import { App, Modal, Notice, Setting, TFile, TFolder, requestUrl } from "obsidian";
import type BrainSharePlugin from "./main";

/**
 * FolderPickerModal — multi-select tree of vault folders. On Publish, walks every
 * .md inside, stamps a ULID, PUTs to the worker, then bundles all successful ULIDs
 * into a wrapper share URL.
 */
export class FolderPickerModal extends Modal {
  private plugin: BrainSharePlugin;
  private selected = new Set<string>();
  private wrapperName = "";
  private wrapperTitle = "Selected folders";
  private wrapperDescription = "";
  private gated = false;

  // mutable refs to update during publish
  private statusEl: HTMLElement | null = null;
  private publishBtn: HTMLButtonElement | null = null;

  constructor(app: App, plugin: BrainSharePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Publish folder(s)" });
    contentEl.createEl("p", {
      text: "Pick one or more folders. Every .md note inside will be ULID-stamped, pushed to the publisher, then bundled into a single wrapper share URL.",
      cls: "setting-item-description",
    });

    // Folder tree (scrollable)
    const treeEl = contentEl.createDiv();
    treeEl.style.maxHeight = "260px";
    treeEl.style.overflowY = "auto";
    treeEl.style.border = "1px solid var(--background-modifier-border)";
    treeEl.style.borderRadius = "6px";
    treeEl.style.padding = "10px";
    treeEl.style.marginBottom = "12px";
    treeEl.style.fontSize = "0.92em";

    const root = this.app.vault.getRoot();
    this.renderFolderTree(root, treeEl, 0);

    // Settings
    new Setting(contentEl)
      .setName("Wrapper title")
      .addText((t) =>
        t.setValue(this.wrapperTitle).onChange((v) => (this.wrapperTitle = v))
      );

    new Setting(contentEl)
      .setName("Description")
      .addText((t) =>
        t
          .setPlaceholder("optional")
          .onChange((v) => (this.wrapperDescription = v))
      );

    new Setting(contentEl)
      .setName("Wrapper name")
      .setDesc("Leave blank for an auto-generated short id")
      .addText((t) =>
        t.setPlaceholder("e.g. agent-os-q2").onChange((v) => (this.wrapperName = v.trim()))
      );

    new Setting(contentEl)
      .setName("Gated")
      .setDesc("Require a JWT access token to view (mint with the wrapper CLI later)")
      .addToggle((t) => t.setValue(this.gated).onChange((v) => (this.gated = v)));

    // Status line + Publish button
    this.statusEl = contentEl.createDiv();
    this.statusEl.style.fontSize = "0.85em";
    this.statusEl.style.color = "var(--text-muted)";
    this.statusEl.style.minHeight = "1.4em";
    this.statusEl.style.marginTop = "8px";

    new Setting(contentEl).addButton((b) => {
      this.publishBtn = b
        .setButtonText("Publish")
        .setCta()
        .onClick(() => this.publish())
        .buttonEl;
    });
  }

  private renderFolderTree(folder: TFolder, parent: HTMLElement, depth: number) {
    const isRoot = !folder.path || folder.path === "/";
    if (!isRoot) {
      const row = parent.createDiv();
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.padding = "2px 0";
      row.style.paddingLeft = `${depth * 18}px`;

      const cb = row.createEl("input", { type: "checkbox" });
      cb.style.marginRight = "8px";
      cb.addEventListener("change", () => {
        if (cb.checked) this.selected.add(folder.path);
        else this.selected.delete(folder.path);
      });

      const mdCount = this.countMarkdown(folder);
      const label = row.createSpan({ text: folder.name });
      const meta = row.createSpan({
        text: `  ${mdCount} note${mdCount === 1 ? "" : "s"}`,
      });
      meta.style.color = "var(--text-faint)";
      meta.style.marginLeft = "6px";
      meta.style.fontSize = "0.85em";

      // Click label/row to toggle (better UX than hitting tiny checkbox)
      label.style.cursor = "pointer";
      label.addEventListener("click", () => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });
    }

    const children = folder.children
      .filter((c): c is TFolder => c instanceof TFolder)
      .filter((c) => !c.name.startsWith(".")) // skip .obsidian, .trash, etc
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const child of children) {
      this.renderFolderTree(child, parent, isRoot ? depth : depth + 1);
    }
  }

  private countMarkdown(folder: TFolder): number {
    let n = 0;
    for (const c of folder.children) {
      if (c instanceof TFile && c.extension === "md") n++;
      else if (c instanceof TFolder) n += this.countMarkdown(c);
    }
    return n;
  }

  private collectMarkdown(folder: TFolder, into: TFile[]) {
    for (const c of folder.children) {
      if (c instanceof TFile && c.extension === "md") into.push(c);
      else if (c instanceof TFolder) this.collectMarkdown(c, into);
    }
  }

  private setStatus(text: string) {
    if (this.statusEl) this.statusEl.setText(text);
  }

  private async publish() {
    if (this.selected.size === 0) {
      new Notice("BrainShare: pick at least one folder");
      return;
    }
    const { publisherUrl, publisherToken } = this.plugin.settings;
    if (!publisherUrl || !publisherToken) {
      new Notice("BrainShare: configure publisher URL + token in settings first");
      return;
    }

    // Collect files (deduped by path — selecting a parent + child shouldn't double-publish)
    const seen = new Set<string>();
    const files: TFile[] = [];
    for (const folderPath of this.selected) {
      const f = this.app.vault.getAbstractFileByPath(folderPath);
      if (!(f instanceof TFolder)) continue;
      const list: TFile[] = [];
      this.collectMarkdown(f, list);
      for (const file of list) {
        if (!seen.has(file.path)) {
          seen.add(file.path);
          files.push(file);
        }
      }
    }

    if (files.length === 0) {
      new Notice("BrainShare: no markdown notes in selected folders");
      return;
    }

    if (this.publishBtn) this.publishBtn.disabled = true;

    const ulids: string[] = [];
    const failed: { path: string; reason: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.setStatus(`Publishing ${i + 1}/${files.length} — ${file.path}…`);
      try {
        const ulid = await this.plugin.publishNoteSilent(file);
        if (ulid) ulids.push(ulid);
        else failed.push({ path: file.path, reason: "no ULID returned" });
      } catch (e) {
        failed.push({
          path: file.path,
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (ulids.length === 0) {
      new Notice(`BrainShare: 0/${files.length} published`);
      this.setStatus(`Failed all ${files.length}; check console for details`);
      console.warn("BrainShare folder publish failures:", failed);
      if (this.publishBtn) this.publishBtn.disabled = false;
      return;
    }

    // Bundle into a wrapper
    const wrapId = this.wrapperName || Math.random().toString(36).slice(2, 10);
    this.setStatus(`Bundling ${ulids.length} note(s) into wrapper ${wrapId}…`);
    try {
      const res = await requestUrl({
        url: `${publisherUrl}/api/wrappers/${wrapId}`,
        method: "PUT",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${publisherToken}`,
        },
        body: JSON.stringify({
          title: this.wrapperTitle,
          description: this.wrapperDescription,
          ulids,
          gated: this.gated,
          created_at: new Date().toISOString(),
        }),
        throw: false,
      });
      if (res.status >= 400) {
        new Notice(`BrainShare: wrapper PUT failed (${res.status})`);
        if (this.publishBtn) this.publishBtn.disabled = false;
        return;
      }
      const wrapUrl = `${publisherUrl}/share/${wrapId}`;
      const failNote = failed.length ? ` (${failed.length} failed)` : "";
      new Notice(`BrainShare: published ${ulids.length}/${files.length} → ${wrapUrl}${failNote}`);
      try {
        await navigator.clipboard.writeText(wrapUrl);
      } catch {
        // ignore
      }
      this.close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`BrainShare: ${msg}`);
      if (this.publishBtn) this.publishBtn.disabled = false;
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
