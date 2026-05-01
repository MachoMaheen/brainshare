import { App, Modal, Notice, Setting, TFile, TFolder, requestUrl } from "obsidian";
import type BrainSharePlugin from "./main";
import { MintTokenModal } from "./mint-modal";

/**
 * FolderPickerModal — vault tree (folders + .md notes) with per-file checkboxes.
 * Folder checkboxes cascade to descendant notes; individual notes can still be
 * unticked after selecting a parent. On Publish, every selected note gets ULID-
 * stamped + pushed, and all returned ULIDs are bundled into one wrapper share URL.
 */
export class FolderPickerModal extends Modal {
  private plugin: BrainSharePlugin;
  private selectedFiles = new Set<string>();
  private wrapperName = "";
  private wrapperTitle = "Selected slice";
  private wrapperDescription = "";
  private gated = false;

  // path → checkbox refs so toggling at any level can sync the rest of the tree
  private fileBoxes = new Map<string, HTMLInputElement>();
  private folderBoxes = new Map<string, { cb: HTMLInputElement; files: string[] }>();

  // mutable refs to update during publish
  private statusEl: HTMLElement | null = null;
  private countEl: HTMLElement | null = null;
  private publishBtn: HTMLButtonElement | null = null;

  constructor(app: App, plugin: BrainSharePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Publish slice" });
    contentEl.createEl("p", {
      text: "Pick the folders and notes to share. Folder checkboxes select everything inside, but you can untick individual notes to opt them out.",
      cls: "setting-item-description",
    });

    // Tree (scrollable)
    const treeEl = contentEl.createDiv();
    treeEl.style.maxHeight = "320px";
    treeEl.style.overflowY = "auto";
    treeEl.style.border = "1px solid var(--background-modifier-border)";
    treeEl.style.borderRadius = "6px";
    treeEl.style.padding = "10px";
    treeEl.style.marginBottom = "8px";
    treeEl.style.fontSize = "0.92em";

    const root = this.app.vault.getRoot();
    this.renderTree(root, treeEl, 0);

    // Live count
    this.countEl = contentEl.createDiv();
    this.countEl.style.fontSize = "0.85em";
    this.countEl.style.color = "var(--text-muted)";
    this.countEl.style.marginBottom = "12px";
    this.updateCount();

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

    // Status line + Publish
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

  private renderTree(folder: TFolder, parent: HTMLElement, depth: number) {
    const isRoot = !folder.path || folder.path === "/";

    // Render folder row (skip for vault root)
    if (!isRoot) {
      const row = this.makeRow(parent, depth);
      const cb = row.createEl("input", { type: "checkbox" });
      cb.style.marginRight = "8px";

      const files = this.allMarkdown(folder);
      this.folderBoxes.set(folder.path, { cb, files: files.map((f) => f.path) });

      cb.addEventListener("change", () => {
        const want = cb.checked;
        for (const p of files.map((f) => f.path)) {
          if (want) this.selectedFiles.add(p);
          else this.selectedFiles.delete(p);
          const fb = this.fileBoxes.get(p);
          if (fb) fb.checked = want;
        }
        this.recomputeFolderStates();
        this.updateCount();
      });

      const label = row.createSpan({ text: "📁 " + folder.name });
      label.style.cursor = "pointer";
      label.style.fontWeight = "500";
      label.addEventListener("click", () => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });

      const meta = row.createSpan({
        text: `  ${files.length} note${files.length === 1 ? "" : "s"}`,
      });
      meta.style.color = "var(--text-faint)";
      meta.style.marginLeft = "6px";
      meta.style.fontSize = "0.85em";
    }

    const childDepth = isRoot ? depth : depth + 1;

    // Subfolders first (alphabetical, hidden ones skipped)
    const subfolders = folder.children
      .filter((c): c is TFolder => c instanceof TFolder)
      .filter((c) => !c.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const sub of subfolders) {
      this.renderTree(sub, parent, childDepth);
    }

    // Then .md files at this level
    const mdFiles = folder.children
      .filter((c): c is TFile => c instanceof TFile && c.extension === "md")
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const file of mdFiles) {
      this.renderFileRow(file, parent, childDepth);
    }
  }

  private renderFileRow(file: TFile, parent: HTMLElement, depth: number) {
    const row = this.makeRow(parent, depth);
    const cb = row.createEl("input", { type: "checkbox" });
    cb.style.marginRight = "8px";
    this.fileBoxes.set(file.path, cb);

    cb.addEventListener("change", () => {
      if (cb.checked) this.selectedFiles.add(file.path);
      else this.selectedFiles.delete(file.path);
      this.recomputeFolderStates();
      this.updateCount();
    });

    const baseName = file.basename;
    const label = row.createSpan({ text: "📄 " + baseName });
    label.style.cursor = "pointer";
    label.addEventListener("click", () => {
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change"));
    });

    // ULID indicator — faint dot if already stamped
    const stamped = !!this.app.metadataCache.getFileCache(file)?.frontmatter?.id;
    if (stamped) {
      const tag = row.createSpan({ text: "  •" });
      tag.style.color = "var(--text-faint)";
      tag.style.marginLeft = "6px";
      tag.title = "Already has a ULID";
    }
  }

  private makeRow(parent: HTMLElement, depth: number): HTMLElement {
    const row = parent.createDiv();
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.padding = "2px 0";
    row.style.paddingLeft = `${depth * 18}px`;
    return row;
  }

  private allMarkdown(folder: TFolder): TFile[] {
    const out: TFile[] = [];
    const walk = (f: TFolder) => {
      for (const c of f.children) {
        if (c instanceof TFile && c.extension === "md") out.push(c);
        else if (c instanceof TFolder && !c.name.startsWith(".")) walk(c);
      }
    };
    walk(folder);
    return out;
  }

  private recomputeFolderStates() {
    for (const [, { cb, files }] of this.folderBoxes) {
      if (files.length === 0) {
        cb.checked = false;
        cb.indeterminate = false;
        continue;
      }
      let selected = 0;
      for (const p of files) if (this.selectedFiles.has(p)) selected++;
      if (selected === 0) {
        cb.checked = false;
        cb.indeterminate = false;
      } else if (selected === files.length) {
        cb.checked = true;
        cb.indeterminate = false;
      } else {
        cb.checked = false;
        cb.indeterminate = true;
      }
    }
  }

  private updateCount() {
    if (!this.countEl) return;
    const n = this.selectedFiles.size;
    this.countEl.setText(`${n} note${n === 1 ? "" : "s"} selected`);
  }

  private setStatus(text: string) {
    if (this.statusEl) this.statusEl.setText(text);
  }

  private async publish() {
    if (this.selectedFiles.size === 0) {
      new Notice("BrainShare: pick at least one note");
      return;
    }
    const { publisherUrl, publisherToken } = this.plugin.settings;
    if (!publisherUrl || !publisherToken) {
      new Notice("BrainShare: configure publisher URL + token in settings first");
      return;
    }

    const files: TFile[] = [];
    for (const path of this.selectedFiles) {
      const f = this.app.vault.getAbstractFileByPath(path);
      if (f instanceof TFile && f.extension === "md") files.push(f);
    }

    if (files.length === 0) {
      new Notice("BrainShare: selected paths resolve to no markdown files");
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

      // Persist the slice mapping so the vault knows what's been shared
      try {
        await this.plugin.recordSlice({
          wrapId,
          title: this.wrapperTitle,
          description: this.wrapperDescription,
          gated: this.gated,
          ulids,
          files: files.map((f) => f.path),
          publisherUrl,
        });
      } catch (e) {
        console.warn("BrainShare: failed to record slice sidecar", e);
      }

      this.close();

      // Gated wrappers need a token to view — pop the mint modal pre-filled
      if (this.gated) {
        new MintTokenModal(this.app, this.plugin, wrapId).open();
      }
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
