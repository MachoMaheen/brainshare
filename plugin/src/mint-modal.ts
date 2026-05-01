import { App, Modal, Notice, Setting } from "obsidian";
import type BrainSharePlugin from "./main";

/**
 * MintTokenModal — mints a JWT for a gated wrapper directly from inside Obsidian.
 * Opens automatically after publishing a gated slice, and is also reachable via
 * the "Mint share token…" command for any existing wrapper id.
 */
export class MintTokenModal extends Modal {
  private plugin: BrainSharePlugin;
  private wrapId: string;
  private expDays = 7;
  private maxViews: number | "" = "";
  private viewer = "";

  private resultEl: HTMLElement | null = null;
  private mintBtn: HTMLButtonElement | null = null;

  constructor(app: App, plugin: BrainSharePlugin, wrapId = "") {
    super(app);
    this.plugin = plugin;
    this.wrapId = wrapId;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Mint share token" });
    contentEl.createEl("p", {
      text: "Mints a JWT for a gated wrapper. Each token has its own jti so you can revoke per recipient.",
      cls: "setting-item-description",
    });

    new Setting(contentEl)
      .setName("Wrapper id")
      .setDesc("The /share/<id> portion of the URL")
      .addText((t) =>
        t
          .setPlaceholder("e.g. owkja80e")
          .setValue(this.wrapId)
          .onChange((v) => (this.wrapId = v.trim()))
      );

    new Setting(contentEl)
      .setName("Expires in (days)")
      .addText((t) =>
        t.setValue(String(this.expDays)).onChange((v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) this.expDays = n;
        })
      );

    new Setting(contentEl)
      .setName("Max views")
      .setDesc("Leave blank for unlimited")
      .addText((t) =>
        t.setPlaceholder("e.g. 10").onChange((v) => {
          if (!v.trim()) {
            this.maxViews = "";
            return;
          }
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) this.maxViews = n;
        })
      );

    new Setting(contentEl)
      .setName("Viewer label")
      .setDesc("Optional — shown in the token claims (e.g. 'Alice')")
      .addText((t) =>
        t.setPlaceholder("optional").onChange((v) => (this.viewer = v.trim()))
      );

    this.resultEl = contentEl.createDiv();
    this.resultEl.style.marginTop = "12px";

    new Setting(contentEl).addButton((b) => {
      this.mintBtn = b
        .setButtonText("Mint")
        .setCta()
        .onClick(() => this.mint())
        .buttonEl;
    });
  }

  private async mint() {
    if (!this.wrapId) {
      new Notice("BrainShare: enter a wrapper id");
      return;
    }
    if (this.mintBtn) this.mintBtn.disabled = true;
    try {
      const result = await this.plugin.mintToken(this.wrapId, {
        exp_days: this.expDays,
        max_views: typeof this.maxViews === "number" ? this.maxViews : undefined,
        viewer: this.viewer || undefined,
      });
      if (!result) {
        new Notice("BrainShare: mint failed (check wrapper id, settings, console)");
        if (this.mintBtn) this.mintBtn.disabled = false;
        return;
      }
      this.showResult(result);
      try {
        await navigator.clipboard.writeText(result.url);
        new Notice("BrainShare: token URL copied to clipboard");
      } catch {
        new Notice("BrainShare: token minted (clipboard unavailable)");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`BrainShare: ${msg}`);
      if (this.mintBtn) this.mintBtn.disabled = false;
    }
  }

  private showResult(result: { url: string; jti: string; exp: number }) {
    if (!this.resultEl) return;
    this.resultEl.empty();
    this.resultEl.style.padding = "10px";
    this.resultEl.style.border = "1px solid var(--background-modifier-border)";
    this.resultEl.style.borderRadius = "6px";
    this.resultEl.style.background = "var(--background-secondary)";
    this.resultEl.style.fontSize = "0.9em";

    const expDate = new Date(result.exp * 1000).toLocaleString();
    this.resultEl.createDiv({ text: `Expires: ${expDate}` });
    this.resultEl.createDiv({ text: `jti: ${result.jti}  (use to revoke)` }).style.color = "var(--text-faint)";

    const urlBox = this.resultEl.createDiv();
    urlBox.style.marginTop = "8px";
    urlBox.style.wordBreak = "break-all";
    urlBox.style.fontFamily = "var(--font-monospace)";
    urlBox.style.fontSize = "0.82em";
    urlBox.style.padding = "6px";
    urlBox.style.background = "var(--background-primary)";
    urlBox.style.borderRadius = "4px";
    urlBox.setText(result.url);

    if (this.mintBtn) {
      this.mintBtn.disabled = false;
      this.mintBtn.setText("Mint another");
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
