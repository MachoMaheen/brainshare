import * as vscode from "vscode";
import { createHash } from "node:crypto";
import { apiFromSettings, BrainShareApi } from "./api";
import { SliceRecord, StateStore } from "./state";

let store: StateStore | undefined;
let tree: SliceTreeProvider | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const root = workspaceRoot();
  if (root) {
    store = new StateStore(root);
    tree = new SliceTreeProvider(store);
    context.subscriptions.push(vscode.window.registerTreeDataProvider("brainshare.slices", tree));
  }

  register(context, "brainshare.setup", () => setup(context));
  register(context, "brainshare.publishCurrent", (uri?: vscode.Uri) => publishCurrent(context, uri));
  register(context, "brainshare.publishFolder", (uri?: vscode.Uri) => publishFolder(context, uri));
  register(context, "brainshare.addCurrentToSlice", () => addCurrentToSlice(context));
  register(context, "brainshare.republishSlice", (item?: SliceTreeItem) => republishSlice(context, item?.slice));
  register(context, "brainshare.copyCurrentUrl", () => currentPublishedUrl(false));
  register(context, "brainshare.openCurrentUrl", () => currentPublishedUrl(true));
  register(context, "brainshare.copySliceUrl", (item?: SliceTreeItem) => useSliceUrl(item?.slice, false));
  register(context, "brainshare.openSlice", (item?: SliceTreeItem) => useSliceUrl(item?.slice, true));
  register(context, "brainshare.mintToken", (item?: SliceTreeItem) => mintToken(context, item?.slice));
  register(context, "brainshare.revokeToken", (item?: SliceTreeItem) => revokeToken(context, item?.slice));
  register(context, "brainshare.unpublishCurrent", () => unpublishCurrent(context));
  register(context, "brainshare.deleteSlice", (item?: SliceTreeItem) => deleteSlice(context, item?.slice));
  register(context, "brainshare.refresh", () => tree?.refresh());

  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (!store || document.languageId !== "markdown") return;
    if (!vscode.workspace.getConfiguration("brainshare").get<boolean>("autoPublishOnSave", false)) return;
    const state = await store.read();
    const path = store.relative(document.uri);
    if (!state.notes[path]?.publishedAt) return;
    try {
      await publishOne(context, document.uri, false);
    } catch (error) {
      console.warn("BrainShare auto-publish failed", error);
    }
  }));
}

export function deactivate(): void {}

function register(context: vscode.ExtensionContext, command: string, fn: (...args: any[]) => unknown): void {
  context.subscriptions.push(vscode.commands.registerCommand(command, async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(message);
    }
  }));
}

function workspaceRoot(): vscode.Uri | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri;
}

function requireStore(): StateStore {
  if (!store) throw new Error("Open a folder or workspace before using BrainShare.");
  return store;
}

async function setup(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration("brainshare");
  const currentUrl = config.get<string>("publisherUrl", "");
  const publisherUrl = await vscode.window.showInputBox({
    title: "BrainShare publisher",
    prompt: "Your self-hosted Cloudflare Worker URL",
    value: currentUrl,
    placeHolder: "https://brainshare-publisher.example.workers.dev",
    validateInput: (value) => {
      try { new URL(value); return undefined; } catch { return "Enter a valid http(s) URL"; }
    },
  });
  if (!publisherUrl) return;
  const publisherToken = await vscode.window.showInputBox({
    title: "BrainShare publisher token",
    prompt: "Stored securely in VS Code SecretStorage, not in settings.json",
    password: true,
  });
  if (!publisherToken) return;
  await config.update("publisherUrl", publisherUrl.replace(/\/$/, ""), vscode.ConfigurationTarget.Workspace);
  await context.secrets.store("brainshare.publisherToken", publisherToken);
  void vscode.window.showInformationMessage("BrainShare publisher configured.");
}

async function publishCurrent(context: vscode.ExtensionContext, uri?: vscode.Uri): Promise<void> {
  const target = uri ?? vscode.window.activeTextEditor?.document.uri;
  if (!target || target.path.toLowerCase().endsWith(".md") === false) {
    throw new Error("Open or select a Markdown file first.");
  }
  const result = await publishOne(context, target, true);
  await vscode.env.clipboard.writeText(result.url);
  void vscode.window.showInformationMessage(`BrainShare published ${requireStore().relative(target)} — URL copied.`);
}

async function publishOne(context: vscode.ExtensionContext, uri: vscode.Uri, force: boolean): Promise<{ id: string; url: string; pushed: boolean }> {
  const stateStore = requireStore();
  const api = await apiFromSettings(context);
  const identityMode = vscode.workspace.getConfiguration("brainshare").get<"sidecar" | "frontmatter">("identityMode", "sidecar");
  const id = await stateStore.getOrCreateId(uri, identityMode);
  const markdown = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
  const hash = createHash("sha256").update(markdown).digest("hex");
  const state = await stateStore.read();
  const path = stateStore.relative(uri);
  const previous = state.notes[path];
  if (!force && previous?.hash === hash && previous.url) return { id, url: previous.url, pushed: false };
  const result = await api.publishNote(id, path, markdown);
  await stateStore.recordPublishedNote(uri, { id, url: result.url, hash, publishedAt: new Date().toISOString() });
  return { id, url: result.url, pushed: true };
}

async function publishFolder(context: vscode.ExtensionContext, uri?: vscode.Uri): Promise<void> {
  const stateStore = requireStore();
  let folder = uri;
  if (!folder || !(await isDirectory(folder))) {
    const picked = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, title: "Choose a folder to publish as a BrainShare slice" });
    folder = picked?.[0];
  }
  if (!folder) return;
  const files = await markdownFilesUnder(folder);
  if (files.length === 0) throw new Error("No Markdown files found in that folder.");

  const defaultTitle = folder.path.split("/").filter(Boolean).pop() ?? "Shared slice";
  const title = await vscode.window.showInputBox({ title: "Slice title", value: defaultTitle });
  if (!title) return;
  const id = await vscode.window.showInputBox({
    title: "Slice URL id",
    value: slugify(title),
    prompt: "Stable URL id. Updating this slice later keeps the same URL.",
    validateInput: validateWrapperId,
  });
  if (!id) return;
  const description = await vscode.window.showInputBox({ title: "Slice description", value: "" }) ?? "";
  const visibility = await vscode.window.showQuickPick([
    { label: "Public / unlisted", gated: false, description: "Anyone with the URL can read it" },
    { label: "JWT gated", gated: true, description: "Recipients need a minted access token" },
  ], { title: "Slice access" });
  if (!visibility) return;

  const api = await apiFromSettings(context);
  const published = await publishFiles(context, files);
  const existing = await api.getWrapper(id);
  const merged = unique([...(existing?.ulids ?? []), ...published.map((p) => p.id)]);
  const payload = {
    title,
    description,
    gated: visibility.gated,
    ulids: merged,
    created_at: existing?.created_at ?? new Date().toISOString(),
    ...(existing?.canvases ? { canvases: existing.canvases } : {}),
    ...(existing?.assets ? { assets: existing.assets } : {}),
  };
  const wrapper = await api.publishWrapper(id, payload);
  const record: SliceRecord = {
    id,
    title,
    description,
    gated: visibility.gated,
    files: files.map((f) => stateStore.relative(f)),
    ulids: merged,
    url: wrapper.url,
    createdAt: payload.created_at,
  };
  await stateStore.upsertSlice(record);
  tree?.refresh();
  await vscode.env.clipboard.writeText(wrapper.url);
  void vscode.window.showInformationMessage(`BrainShare published ${published.length} Markdown files as “${title}” — URL copied.`);
}

async function publishFiles(context: vscode.ExtensionContext, files: vscode.Uri[]): Promise<Array<{ id: string; url: string }>> {
  return await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Publishing BrainShare slice", cancellable: false }, async (progress) => {
    const out: Array<{ id: string; url: string }> = [];
    for (let i = 0; i < files.length; i++) {
      progress.report({ message: `${i + 1}/${files.length} ${requireStore().relative(files[i])}` });
      const result = await publishOne(context, files[i], false);
      out.push({ id: result.id, url: result.url });
    }
    return out;
  });
}

async function addCurrentToSlice(context: vscode.ExtensionContext): Promise<void> {
  const stateStore = requireStore();
  const uri = vscode.window.activeTextEditor?.document.uri;
  if (!uri || !uri.path.toLowerCase().endsWith(".md")) throw new Error("Open a Markdown file first.");
  const state = await stateStore.read();
  const slice = await pickSlice(Object.values(state.slices), "Add current file to slice");
  if (!slice) return;
  const published = await publishOne(context, uri, false);
  const api = await apiFromSettings(context);
  const existing = await api.getWrapper(slice.id);
  if (!existing) throw new Error(`Slice ${slice.id} no longer exists on the publisher.`);
  const ulids = unique([...existing.ulids, published.id]);
  const wrapper = await api.publishWrapper(slice.id, { ...existing, ulids });
  const path = stateStore.relative(uri);
  await stateStore.upsertSlice({ ...slice, ulids, files: unique([...slice.files, path]), url: wrapper.url });
  tree?.refresh();
  void vscode.window.showInformationMessage(`Added ${path} to “${slice.title}”.`);
}

async function republishSlice(context: vscode.ExtensionContext, supplied?: SliceRecord): Promise<void> {
  const stateStore = requireStore();
  const state = await stateStore.read();
  const slice = supplied ?? await pickSlice(Object.values(state.slices), "Re-publish BrainShare slice");
  if (!slice) return;
  const files: vscode.Uri[] = [];
  for (const path of slice.files) {
    const uri = vscode.Uri.joinPath(workspaceRoot()!, ...path.split("/"));
    try { await vscode.workspace.fs.stat(uri); files.push(uri); } catch { /* missing file: preserve remote ULID */ }
  }
  const published = await publishFiles(context, files);
  const api = await apiFromSettings(context);
  const existing = await api.getWrapper(slice.id);
  if (!existing) throw new Error(`Slice ${slice.id} no longer exists on the publisher.`);
  const ulids = unique([...existing.ulids, ...published.map((p) => p.id)]);
  const wrapper = await api.publishWrapper(slice.id, { ...existing, ulids });
  await stateStore.upsertSlice({ ...slice, ulids, url: wrapper.url });
  tree?.refresh();
  void vscode.window.showInformationMessage(`Re-published “${slice.title}”.`);
}

async function currentPublishedUrl(open: boolean): Promise<void> {
  const stateStore = requireStore();
  const uri = vscode.window.activeTextEditor?.document.uri;
  if (!uri) throw new Error("Open a Markdown file first.");
  const state = await stateStore.read();
  const url = state.notes[stateStore.relative(uri)]?.url;
  if (!url) throw new Error("This file has not been published by this workspace yet.");
  if (open) await vscode.env.openExternal(vscode.Uri.parse(url));
  else { await vscode.env.clipboard.writeText(url); void vscode.window.showInformationMessage("BrainShare URL copied."); }
}

async function useSliceUrl(supplied: SliceRecord | undefined, open: boolean): Promise<void> {
  const state = await requireStore().read();
  const slice = supplied ?? await pickSlice(Object.values(state.slices), open ? "Open BrainShare slice" : "Copy BrainShare slice URL");
  if (!slice) return;
  if (open) await vscode.env.openExternal(vscode.Uri.parse(slice.url));
  else { await vscode.env.clipboard.writeText(slice.url); void vscode.window.showInformationMessage("BrainShare slice URL copied."); }
}

async function mintToken(context: vscode.ExtensionContext, supplied?: SliceRecord): Promise<void> {
  const state = await requireStore().read();
  const slice = supplied ?? await pickSlice(Object.values(state.slices).filter((s) => s.gated), "Mint access token for slice");
  if (!slice) return;
  if (!slice.gated) throw new Error("This slice is not gated. Re-publish it as JWT gated first.");
  const viewer = await vscode.window.showInputBox({ title: "Viewer label (optional)", placeHolder: "Alice" });
  const daysRaw = await vscode.window.showInputBox({ title: "Token expiry", prompt: "Days from now", value: "7", validateInput: positiveNumber });
  if (!daysRaw) return;
  const maxRaw = await vscode.window.showInputBox({ title: "Maximum views (optional)", prompt: "Leave blank for unlimited", value: "" });
  const api = await apiFromSettings(context);
  const token = await api.mintToken(slice.id, { expDays: Number(daysRaw), maxViews: maxRaw ? Number(maxRaw) : undefined, viewer: viewer || undefined });
  await vscode.env.clipboard.writeText(token.url);
  void vscode.window.showInformationMessage(`Access URL copied. JTI: ${token.jti}`);
}

async function revokeToken(context: vscode.ExtensionContext, supplied?: SliceRecord): Promise<void> {
  const state = await requireStore().read();
  const slice = supplied ?? await pickSlice(Object.values(state.slices), "Revoke BrainShare access token");
  if (!slice) return;
  const jti = await vscode.window.showInputBox({ title: "Token JTI", prompt: "Paste the jti returned when the token was minted" });
  if (!jti) return;
  const api = await apiFromSettings(context);
  await api.revokeToken(slice.id, jti.trim());
  void vscode.window.showInformationMessage(`Revoked token ${jti.trim()}.`);
}

async function unpublishCurrent(context: vscode.ExtensionContext): Promise<void> {
  const stateStore = requireStore();
  const uri = vscode.window.activeTextEditor?.document.uri;
  if (!uri) throw new Error("Open a Markdown file first.");
  const state = await stateStore.read();
  const record = state.notes[stateStore.relative(uri)];
  if (!record?.id) throw new Error("This file has not been published by this workspace.");
  const confirm = await vscode.window.showWarningMessage("Unpublish this note from BrainShare? Any slice referencing it may show it as missing until republished.", { modal: true }, "Unpublish");
  if (confirm !== "Unpublish") return;
  const api = await apiFromSettings(context);
  await api.unpublishNote(record.id);
  await stateStore.removeNote(uri);
  tree?.refresh();
  void vscode.window.showInformationMessage("BrainShare note unpublished.");
}

async function deleteSlice(context: vscode.ExtensionContext, supplied?: SliceRecord): Promise<void> {
  const stateStore = requireStore();
  const state = await stateStore.read();
  const slice = supplied ?? await pickSlice(Object.values(state.slices), "Delete BrainShare slice");
  if (!slice) return;
  const confirm = await vscode.window.showWarningMessage(`Delete the shared slice “${slice.title}”? Standalone notes are kept.`, { modal: true }, "Delete slice");
  if (confirm !== "Delete slice") return;
  const api = await apiFromSettings(context);
  await api.deleteWrapper(slice.id);
  await stateStore.removeSlice(slice.id);
  tree?.refresh();
  void vscode.window.showInformationMessage(`Deleted “${slice.title}”.`);
}

async function markdownFilesUnder(folder: vscode.Uri): Promise<vscode.Uri[]> {
  const root = workspaceRoot();
  if (!root) return [];
  const relative = vscode.workspace.asRelativePath(folder, false).replace(/\\/g, "/");
  const pattern = new vscode.RelativePattern(root, relative ? `${relative}/**/*.md` : "**/*.md");
  const files = await vscode.workspace.findFiles(pattern, "**/{node_modules,.git,.brainshare}/**");
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function isDirectory(uri: vscode.Uri): Promise<boolean> {
  try { return ((await vscode.workspace.fs.stat(uri)).type & vscode.FileType.Directory) !== 0; } catch { return false; }
}

async function pickSlice(slices: SliceRecord[], title: string): Promise<SliceRecord | undefined> {
  if (slices.length === 0) throw new Error("No BrainShare slices are recorded in this workspace yet.");
  const selected = await vscode.window.showQuickPick(slices.map((slice) => ({ label: slice.title, description: slice.id, detail: slice.url, slice })), { title });
  return selected?.slice;
}

function slugify(value: string): string {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return slug || `slice-${Date.now().toString(36)}`;
}

function validateWrapperId(value: string): string | undefined {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(value) ? undefined : "Use 1–64 letters, numbers, _ or -";
}

function positiveNumber(value: string): string | undefined {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? undefined : "Enter a number greater than zero";
}

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }

class SliceTreeProvider implements vscode.TreeDataProvider<SliceTreeItem> {
  private readonly changed = new vscode.EventEmitter<SliceTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this.changed.event;
  constructor(private readonly stateStore: StateStore) {}
  refresh(): void { this.changed.fire(); }
  getTreeItem(element: SliceTreeItem): vscode.TreeItem { return element; }
  async getChildren(): Promise<SliceTreeItem[]> {
    const state = await this.stateStore.read();
    return Object.values(state.slices)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((slice) => new SliceTreeItem(slice));
  }
}

class SliceTreeItem extends vscode.TreeItem {
  constructor(readonly slice: SliceRecord) {
    super(slice.title, vscode.TreeItemCollapsibleState.None);
    this.id = slice.id;
    this.description = `${slice.ulids.length} notes${slice.gated ? " · gated" : ""}`;
    this.tooltip = new vscode.MarkdownString(`**${slice.title}**\n\n${slice.description || "No description"}\n\n${slice.url}`);
    this.contextValue = "brainshare.slice";
    this.iconPath = new vscode.ThemeIcon(slice.gated ? "lock" : "book");
    this.command = { command: "brainshare.openSlice", title: "Open slice", arguments: [this] };
  }
}
