import {
  Plugin,
  TFile,
  Notice,
  PluginSettingTab,
  App,
  Setting,
  requestUrl,
} from "obsidian";
import { ulid } from "./ulid";
import { FolderPickerModal } from "./folder-picker";

interface BrainShareSettings {
  publisherUrl: string;
  publisherToken: string;
  autoStampUlids: boolean;
}

const DEFAULT_SETTINGS: BrainShareSettings = {
  publisherUrl: "",
  publisherToken: "",
  autoStampUlids: true,
};

export default class BrainSharePlugin extends Plugin {
  settings: BrainShareSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (!(file instanceof TFile) || !file.path.endsWith(".md")) return;
        if (!this.settings.autoStampUlids) return;
        // wait one tick so Obsidian's template/templater systems can run first
        await new Promise((r) => setTimeout(r, 200));
        try {
          await this.stampUlid(file);
        } catch {
          // ignore — user may have closed the file mid-write
        }
      })
    );

    this.addCommand({
      id: "brainshare-stamp-all",
      name: "Stamp ULIDs into all notes",
      callback: async () => {
        const files = this.app.vault.getMarkdownFiles();
        let stamped = 0;
        for (const file of files) {
          if (await this.stampUlid(file)) stamped++;
        }
        new Notice(`BrainShare: stamped ${stamped} note(s)`);
      },
    });

    this.addCommand({
      id: "brainshare-publish-current",
      name: "Publish current note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !file.path.endsWith(".md")) return false;
        if (checking) return true;
        this.publishNote(file);
        return true;
      },
    });

    this.addCommand({
      id: "brainshare-publish-folder",
      name: "Publish folder(s)…",
      callback: () => new FolderPickerModal(this.app, this).open(),
    });

    this.addCommand({
      id: "brainshare-copy-current-id",
      name: "Copy current note ULID",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || !file.path.endsWith(".md")) return false;
        if (checking) return true;
        const id = this.app.metadataCache.getFileCache(file)?.frontmatter?.id;
        if (!id) {
          new Notice("BrainShare: no ULID on this note");
          return true;
        }
        navigator.clipboard.writeText(id).catch(() => {});
        new Notice(`BrainShare: copied ${id}`);
        return true;
      },
    });

    this.addSettingTab(new BrainShareSettingTab(this.app, this));
  }

  async stampUlid(file: TFile): Promise<boolean> {
    let didStamp = false;
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      if (!fm.id) {
        fm.id = ulid();
        didStamp = true;
      }
    });
    return didStamp;
  }

  /**
   * Push a single note to the worker. Stamps a ULID first if missing.
   * Returns the ULID on success, null on failure. Does NOT show notices —
   * caller decides how to surface results (single note vs bulk).
   */
  async publishNoteSilent(file: TFile): Promise<string | null> {
    const { publisherUrl, publisherToken } = this.settings;
    if (!publisherUrl || !publisherToken) return null;
    await this.stampUlid(file);
    const id = this.app.metadataCache.getFileCache(file)?.frontmatter?.id;
    if (!id) return null;
    const content = await this.app.vault.read(file);
    const res = await requestUrl({
      url: `${publisherUrl}/api/notes/${id}`,
      method: "PUT",
      headers: {
        "content-type": "text/markdown",
        authorization: `Bearer ${publisherToken}`,
        "x-note-path": file.path,
      },
      body: content,
      throw: false,
    });
    return res.status < 400 ? id : null;
  }

  async publishNote(file: TFile) {
    const { publisherUrl, publisherToken } = this.settings;
    if (!publisherUrl || !publisherToken) {
      new Notice("BrainShare: configure publisher URL + token in settings");
      return;
    }
    try {
      const id = await this.publishNoteSilent(file);
      if (!id) {
        new Notice("BrainShare: publish failed (check publisher URL/token + console)");
        return;
      }
      const publicUrl = `${publisherUrl}/${id}`;
      new Notice(`BrainShare: published → ${publicUrl}`);
      try {
        await navigator.clipboard.writeText(publicUrl);
      } catch {
        // clipboard may not be available — the URL is still in the notice
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`BrainShare: ${msg}`);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class BrainShareSettingTab extends PluginSettingTab {
  plugin: BrainSharePlugin;

  constructor(app: App, plugin: BrainSharePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "BrainShare" });

    new Setting(containerEl)
      .setName("Publisher URL")
      .setDesc("Base URL of the BrainShare publisher worker")
      .addText((t) =>
        t
          .setPlaceholder("https://brainshare-publisher.your.workers.dev")
          .setValue(this.plugin.settings.publisherUrl)
          .onChange(async (v) => {
            this.plugin.settings.publisherUrl = v.trim().replace(/\/$/, "");
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Publisher token")
      .setDesc("Bearer token (matches the PUBLISHER_TOKEN secret on the worker)")
      .addText((t) =>
        t
          .setPlaceholder("paste secret here")
          .setValue(this.plugin.settings.publisherToken)
          .onChange(async (v) => {
            this.plugin.settings.publisherToken = v.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Auto-stamp ULIDs")
      .setDesc("Stamp a ULID into every newly-created note's frontmatter")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoStampUlids).onChange(async (v) => {
          this.plugin.settings.autoStampUlids = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
