import { App, Modal, Notice, Setting } from "obsidian";
import type BrainSharePlugin from "./main";
import type { SliceMap, SliceRecord } from "./main";
import { FolderPickerModal } from "./folder-picker";
import { MintTokenModal } from "./mint-modal";

/**
 * SlicesModal — reads .obsidian/brainshare-slices.json and shows every slice
 * the user has published from this vault. Clicking a slice opens a manage
 * view: per-note unpublish, "delete wrapper only", or "delete wrapper + all
 * notes" (full takedown).
 */
export class SlicesModal extends Modal {
  private plugin: BrainSharePlugin;
  private slices: SliceMap = {};

  constructor(app: App, plugin: BrainSharePlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    this.slices = await this.plugin.readSlices();
    this.renderList();
  }

  private renderList() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Published slices" });

    const ids = Object.keys(this.slices).sort((a, b) => {
      const ca = this.slices[a].created_at ?? "";
      const cb = this.slices[b].created_at ?? "";
      return cb.localeCompare(ca); // newest first
    });

    if (ids.length === 0) {
      contentEl.createEl("p", {
        text: "No slices recorded in this vault yet. Use 'Publish slice' to create one.",
        cls: "setting-item-description",
      });
      return;
    }

    contentEl.createEl("p", {
      text: `${ids.length} slice${ids.length === 1 ? "" : "s"} recorded in .obsidian/brainshare-slices.json`,
      cls: "setting-item-description",
    });

    const list = contentEl.createDiv();
    list.style.maxHeight = "440px";
    list.style.overflowY = "auto";
    list.style.border = "1px solid var(--background-modifier-border)";
    list.style.borderRadius = "6px";
    list.style.marginTop = "8px";

    for (const wrapId of ids) {
      const slice = this.slices[wrapId];
      const row = list.createDiv();
      row.style.padding = "10px 12px";
      row.style.borderBottom = "1px solid var(--background-modifier-border)";
      row.style.cursor = "pointer";
      row.addEventListener("mouseenter", () => (row.style.background = "var(--background-secondary)"));
      row.addEventListener("mouseleave", () => (row.style.background = ""));
      row.addEventListener("click", () => this.renderManage(wrapId));

      const titleRow = row.createDiv();
      titleRow.style.display = "flex";
      titleRow.style.alignItems = "center";
      titleRow.style.gap = "8px";

      const title = titleRow.createSpan({ text: slice.title || wrapId });
      title.style.fontWeight = "500";

      if (slice.gated) {
        const pill = titleRow.createSpan({ text: "🔒 gated" });
        pill.style.fontSize = "0.75em";
        pill.style.color = "var(--text-accent)";
        pill.style.padding = "1px 6px";
        pill.style.borderRadius = "999px";
        pill.style.background = "var(--background-modifier-hover)";
      }

      const meta = row.createDiv();
      meta.style.fontSize = "0.82em";
      meta.style.color = "var(--text-muted)";
      meta.style.marginTop = "2px";
      meta.setText(
        `${wrapId} · ${slice.ulids.length} note${slice.ulids.length === 1 ? "" : "s"} · ${slice.created_at ? slice.created_at.slice(0, 10) : ""}`
      );
    }
  }

  private renderManage(wrapId: string) {
    const slice = this.slices[wrapId];
    if (!slice) return;
    const { contentEl } = this;
    contentEl.empty();

    const back = contentEl.createEl("a", { text: "← back to slices" });
    back.style.cursor = "pointer";
    back.style.fontSize = "0.85em";
    back.addEventListener("click", () => this.renderList());

    contentEl.createEl("h2", { text: slice.title || wrapId });
    const meta = contentEl.createEl("p", {
      cls: "setting-item-description",
    });
    meta.setText(
      `wrapId: ${wrapId} · ${slice.gated ? "gated" : "public"} · published ${slice.created_at?.slice(0, 10) ?? "—"} · ${slice.ulids.length} notes · publisher: ${slice.publisher}`
    );

    // Open share URL link
    const wrapUrl = `${slice.publisher}/share/${wrapId}`;
    const linkRow = contentEl.createDiv();
    linkRow.style.marginBottom = "10px";
    linkRow.style.fontSize = "0.85em";
    const link = linkRow.createEl("a", { text: wrapUrl, href: wrapUrl });
    link.style.wordBreak = "break-all";

    // Per-note list with unpublish buttons
    contentEl.createEl("h3", { text: "Notes in this slice", cls: "setting-item-name" });
    const notesEl = contentEl.createDiv();
    notesEl.style.maxHeight = "260px";
    notesEl.style.overflowY = "auto";
    notesEl.style.border = "1px solid var(--background-modifier-border)";
    notesEl.style.borderRadius = "6px";
    notesEl.style.padding = "6px";
    notesEl.style.marginBottom = "12px";

    if (slice.ulids.length === 0) {
      notesEl.createEl("div", { text: "(no notes left in this slice)", cls: "setting-item-description" });
    }

    const renderNoteRows = () => {
      notesEl.empty();
      for (let i = 0; i < slice.ulids.length; i++) {
        const u = slice.ulids[i];
        const path = slice.files?.[i] ?? "(unknown path)";
        const row = notesEl.createDiv();
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.padding = "4px 6px";
        row.style.fontSize = "0.85em";
        row.style.borderBottom = "1px solid var(--background-modifier-border)";

        const left = row.createDiv();
        left.createDiv({ text: path });
        const ulidEl = left.createDiv({ text: u });
        ulidEl.style.color = "var(--text-faint)";
        ulidEl.style.fontFamily = "var(--font-monospace)";
        ulidEl.style.fontSize = "0.85em";

        const btn = row.createEl("button", { text: "Unpublish" });
        btn.style.fontSize = "0.8em";
        btn.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          if (!confirm(`Unpublish "${path}"?\n\nThe note's markdown will be deleted from the publisher worker.`)) return;
          btn.disabled = true;
          const ok = await this.plugin.unpublishNote(u);
          if (!ok) {
            new Notice(`BrainShare: failed to unpublish ${u}`);
            btn.disabled = false;
            return;
          }
          // remove from the slice in-memory + sidecar
          slice.ulids.splice(i, 1);
          slice.files?.splice(i, 1);
          await this.plugin.writeSlices(this.slices);
          new Notice(`BrainShare: unpublished ${u}`);
          renderNoteRows();
        });
      }
    };
    renderNoteRows();

    // Update actions
    new Setting(contentEl)
      .setName("Re-publish (refresh content)")
      .setDesc("Re-pushes every note in this slice. Use after editing notes in Obsidian to update what recipients see at the existing share URL. Notes that have been deleted from the vault are skipped.")
      .addButton((b) =>
        b.setButtonText("Re-publish").setCta().onClick(async () => {
          if (!slice.files || slice.files.length === 0) {
            new Notice("BrainShare: this slice has no recorded file paths to re-publish");
            return;
          }
          b.setDisabled(true);
          b.setButtonText("Re-publishing…");
          const result = await this.plugin.republishSlice(wrapId, slice);
          if (!result) {
            new Notice("BrainShare: re-publish failed (check console)");
            b.setDisabled(false);
            b.setButtonText("Re-publish");
            return;
          }
          // Update sidecar with the freshly resolved file list + ULIDs
          this.slices[wrapId] = {
            ...slice,
            ulids: result.ulids,
            files: result.resolvedFiles.map((f) => f.path),
          };
          await this.plugin.writeSlices(this.slices);
          const missingNote = result.missing.length ? `, ${result.missing.length} missing` : "";
          const detail =
            result.changed === 0
              ? `nothing changed (${result.unchanged} up to date)`
              : `${result.changed} updated, ${result.unchanged} unchanged`;
          new Notice(`BrainShare: ${detail} → /share/${wrapId}${missingNote}`);
          this.renderManage(wrapId);
        })
      );

    new Setting(contentEl)
      .setName("Edit notes in slice")
      .setDesc("Open the picker pre-filled with this slice's notes. Tick to add new ones, untick to remove. Same wrapId — share URL stays valid.")
      .addButton((b) =>
        b.setButtonText("Edit notes…").onClick(() => {
          this.close();
          new FolderPickerModal(this.app, this.plugin, {
            wrapId,
            title: slice.title,
            description: slice.description,
            gated: slice.gated,
            files: slice.files ?? [],
            created_at: slice.created_at,
          }).open();
        })
      );

    // Access tokens — gated slices only. Without this, a user who closed the
    // post-publish mint modal had no in-context way back in and assumed the
    // slice was permanently locked.
    if (slice.gated) {
      new Setting(contentEl)
        .setName("Access tokens")
        .setDesc(
          "This slice is gated — viewers need a tokenized link. Mint one per recipient (each has its own jti so you can revoke individually)."
        )
        .addButton((b) =>
          b
            .setButtonText("Mint access token…")
            .setCta()
            .onClick(() => {
              this.close();
              new MintTokenModal(this.app, this.plugin, wrapId).open();
            })
        );
    }

    // Destructive actions
    new Setting(contentEl)
      .setName("Delete wrapper only")
      .setDesc("/share/<id> stops working. Individual /<ulid> URLs still resolve — note markdown stays in the worker.")
      .addButton((b) =>
        b.setButtonText("Delete wrapper").setWarning().onClick(async () => {
          if (!confirm(`Delete wrapper "${wrapId}"?\n\nThe share URL will 404. Notes themselves stay published at /<ulid>.`)) return;
          const ok = await this.plugin.deleteWrapper(wrapId);
          if (!ok) {
            new Notice("BrainShare: failed to delete wrapper");
            return;
          }
          delete this.slices[wrapId];
          await this.plugin.writeSlices(this.slices);
          new Notice(`BrainShare: deleted wrapper ${wrapId}`);
          this.renderList();
        })
      );

    new Setting(contentEl)
      .setName("Delete wrapper + every note (nuke from orbit)")
      .setDesc("Full takedown. Wrapper 404s and every note's standalone URL also 404s. Use this for private content you need fully off the worker.")
      .addButton((b) =>
        b.setButtonText("Nuke slice").setWarning().onClick(async () => {
          if (!confirm(`Nuke slice "${wrapId}"?\n\nThis deletes:\n  • the wrapper /share/${wrapId}\n  • all ${slice.ulids.length} note(s) in the slice (their /<ulid> URLs too)\n\nThis is irreversible.`)) return;
          let failed = 0;
          for (const u of slice.ulids) {
            const ok = await this.plugin.unpublishNote(u);
            if (!ok) failed++;
          }
          const wrOk = await this.plugin.deleteWrapper(wrapId);
          if (!wrOk) failed++;
          delete this.slices[wrapId];
          await this.plugin.writeSlices(this.slices);
          if (failed === 0) {
            new Notice(`BrainShare: nuked slice ${wrapId}`);
          } else {
            new Notice(`BrainShare: nuke completed with ${failed} failure(s) — check console`);
          }
          this.renderList();
        })
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}
