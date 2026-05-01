import { App, Modal, Notice, Setting } from "obsidian";
import type BrainSharePlugin from "./main";

/**
 * RevokeTokenModal — paste a wrapId + jti, kill that single recipient's
 * access token. Other tokens for the same wrapper keep working.
 */
export class RevokeTokenModal extends Modal {
  private plugin: BrainSharePlugin;
  private wrapId = "";
  private jti = "";

  constructor(app: App, plugin: BrainSharePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Revoke share token" });
    contentEl.createEl("p", {
      text: "Paste the jti shown when the token was minted. Only that recipient is kicked — other tokens for the same wrapper keep working.",
      cls: "setting-item-description",
    });

    new Setting(contentEl)
      .setName("Wrapper id")
      .addText((t) =>
        t.setPlaceholder("e.g. agent-os").onChange((v) => (this.wrapId = v.trim()))
      );

    new Setting(contentEl)
      .setName("jti")
      .setDesc("The unique id of the token to revoke")
      .addText((t) =>
        t.setPlaceholder("uuid…").onChange((v) => (this.jti = v.trim()))
      );

    new Setting(contentEl).addButton((b) =>
      b.setButtonText("Revoke").setWarning().onClick(async () => {
        if (!this.wrapId || !this.jti) {
          new Notice("BrainShare: enter both wrapId and jti");
          return;
        }
        const ok = await this.plugin.revokeToken(this.wrapId, this.jti);
        if (!ok) {
          new Notice("BrainShare: revoke failed (check publisher URL/token)");
          return;
        }
        new Notice(`BrainShare: revoked ${this.jti.slice(0, 8)}…`);
        this.close();
      })
    );
  }

  onClose() {
    this.contentEl.empty();
  }
}
