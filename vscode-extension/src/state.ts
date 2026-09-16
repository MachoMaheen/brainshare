import * as vscode from "vscode";
import {
  normalizeBrainSharePath,
  validateProjectManifest,
  validateSlicesFile,
  type ProjectManifestV1,
  type SlicesFileV1,
} from "@brainshare/protocol";
import { isValidUlid, ulid } from "./ulid";

export interface NoteRecord {
  id: string;
  url?: string;
  hash?: string;
  publishedAt?: string;
}

export interface SliceRecord {
  id: string;
  title: string;
  description: string;
  gated: boolean;
  files: string[];
  ulids: string[];
  url: string;
  createdAt: string;
}

export interface WorkspaceState {
  version: 1;
  notes: Record<string, NoteRecord>;
  slices: Record<string, SliceRecord>;
}

interface AdapterNoteState {
  url?: string;
  publishedAt?: string;
}

interface AdapterState {
  version: 1;
  notes: Record<string, AdapterNoteState>;
  slices: Record<string, SliceRecord>;
}

const EMPTY_ADAPTER = (): AdapterState => ({ version: 1, notes: {}, slices: {} });

export class StateStore {
  constructor(private readonly root: vscode.Uri) {}

  private get dir(): vscode.Uri { return vscode.Uri.joinPath(this.root, ".brainshare"); }
  private get manifestFile(): vscode.Uri { return vscode.Uri.joinPath(this.dir, "manifest.json"); }
  private get slicesFile(): vscode.Uri { return vscode.Uri.joinPath(this.dir, "slices.json"); }
  private get adapterFile(): vscode.Uri { return vscode.Uri.joinPath(this.dir, "vscode.json"); }

  async read(): Promise<WorkspaceState> {
    const manifest = await this.readManifest();
    const adapter = await this.readAdapter();
    const notes: Record<string, NoteRecord> = {};
    for (const [path, identity] of Object.entries(manifest.notes)) {
      notes[path] = {
        id: identity.id,
        ...(identity.hash ? { hash: identity.hash } : {}),
        ...(adapter.notes[path] ?? {}),
      };
    }
    return { version: 1, notes, slices: adapter.slices };
  }

  relative(uri: vscode.Uri): string {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (!folder || folder.uri.toString(true) !== this.root.toString(true)) {
      throw new Error("BrainShare currently operates on the first workspace folder. Open the Markdown file from that folder or use a separate window.");
    }
    return normalizeBrainSharePath(vscode.workspace.asRelativePath(uri, false).replace(/\\/g, "/"));
  }

  async getOrCreateId(uri: vscode.Uri, identityMode: "sidecar" | "frontmatter"): Promise<string> {
    const path = this.relative(uri);
    const text = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
    const frontmatterId = readFrontmatterId(text);
    const manifest = await this.readManifest();

    // Always reuse a valid existing Obsidian/BrainShare id and mirror it into
    // the universal manifest, even when VS Code is configured for sidecar mode.
    if (frontmatterId && isValidUlid(frontmatterId)) {
      if (manifest.notes[path]?.id !== frontmatterId) {
        manifest.notes[path] = { ...(manifest.notes[path] ?? {}), id: frontmatterId };
        await this.writeManifest(manifest);
      }
      return frontmatterId;
    }

    const existing = manifest.notes[path]?.id;
    if (existing && isValidUlid(existing)) return existing;

    const id = ulid();
    if (identityMode === "frontmatter") {
      await vscode.workspace.fs.writeFile(uri, Buffer.from(writeFrontmatterId(text, id), "utf8"));
    }
    manifest.notes[path] = { id };
    await this.writeManifest(manifest);
    return id;
  }

  async recordPublishedNote(uri: vscode.Uri, patch: Partial<NoteRecord> & { id: string }): Promise<void> {
    const path = this.relative(uri);
    const manifest = await this.readManifest();
    const previous = manifest.notes[path];
    manifest.notes[path] = {
      ...(previous ?? {}),
      id: patch.id,
      ...(patch.hash ? { hash: patch.hash } : {}),
      updatedAt: patch.publishedAt ?? new Date().toISOString(),
    };
    await this.writeManifest(manifest);

    const adapter = await this.readAdapter();
    adapter.notes[path] = {
      ...(adapter.notes[path] ?? {}),
      ...(patch.url ? { url: patch.url } : {}),
      ...(patch.publishedAt ? { publishedAt: patch.publishedAt } : {}),
    };
    await this.writeAdapter(adapter);
  }

  /** Clear VS Code publication metadata without destroying the stable note identity. */
  async removeNote(uri: vscode.Uri): Promise<void> {
    const adapter = await this.readAdapter();
    delete adapter.notes[this.relative(uri)];
    await this.writeAdapter(adapter);
  }

  async renameNote(oldUri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
    const oldPath = this.relative(oldUri);
    const newPath = this.relative(newUri);

    const manifest = await this.readManifest();
    const identity = manifest.notes[oldPath];
    if (identity) {
      manifest.notes[newPath] = identity;
      delete manifest.notes[oldPath];
      await this.writeManifest(manifest);
    }

    const adapter = await this.readAdapter();
    if (adapter.notes[oldPath]) {
      adapter.notes[newPath] = adapter.notes[oldPath];
      delete adapter.notes[oldPath];
    }
    for (const slice of Object.values(adapter.slices)) {
      slice.files = slice.files.map((path) => path === oldPath ? newPath : path);
    }
    await this.writeAdapter(adapter);

    const slices = await this.readSlices();
    for (const slice of Object.values(slices.slices)) {
      slice.include = slice.include.map((path) => path === oldPath ? newPath : path);
      if (slice.exclude) slice.exclude = slice.exclude.map((path) => path === oldPath ? newPath : path);
      if (slice.entrypoint === oldPath) slice.entrypoint = newPath;
      if (slice.pinned) slice.pinned = slice.pinned.map((path) => path === oldPath ? newPath : path);
    }
    await this.writeSlices(slices);
  }

  async upsertSlice(slice: SliceRecord): Promise<void> {
    const adapter = await this.readAdapter();
    adapter.slices[slice.id] = slice;
    await this.writeAdapter(adapter);

    const slices = await this.readSlices();
    const existing = slices.slices[slice.id];
    slices.slices[slice.id] = {
      ...(existing ?? {}),
      id: slice.id,
      title: slice.title,
      description: slice.description,
      include: [...slice.files],
      visibility: slice.gated ? "gated" : "unlisted",
      live: existing?.live ?? true,
    };
    await this.writeSlices(slices);
  }

  async removeSlice(id: string): Promise<void> {
    const adapter = await this.readAdapter();
    delete adapter.slices[id];
    await this.writeAdapter(adapter);

    const slices = await this.readSlices();
    if (slices.slices[id]) {
      delete slices.slices[id];
      await this.writeSlices(slices);
    }
  }

  private projectName(): string {
    const parts = this.root.path.split("/").filter(Boolean);
    return parts[parts.length - 1] || "BrainShare project";
  }

  private async readManifest(): Promise<ProjectManifestV1> {
    try {
      const raw = await vscode.workspace.fs.readFile(this.manifestFile);
      const parsed = JSON.parse(Buffer.from(raw).toString("utf8")) as unknown;
      if (isLegacyWorkspaceState(parsed)) return await this.migrateLegacy(parsed);
      return validateProjectManifest(parsed);
    } catch (error) {
      if (isFileNotFound(error)) {
        return { version: 1, project: { name: this.projectName(), createdAt: new Date().toISOString() }, notes: {} };
      }
      throw new Error(`BrainShare could not read .brainshare/manifest.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async readSlices(): Promise<SlicesFileV1> {
    try {
      const raw = await vscode.workspace.fs.readFile(this.slicesFile);
      return validateSlicesFile(JSON.parse(Buffer.from(raw).toString("utf8")));
    } catch (error) {
      if (isFileNotFound(error)) return { version: 1, slices: {} };
      throw new Error(`BrainShare could not read .brainshare/slices.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async readAdapter(): Promise<AdapterState> {
    try {
      const raw = await vscode.workspace.fs.readFile(this.adapterFile);
      const parsed = JSON.parse(Buffer.from(raw).toString("utf8")) as Partial<AdapterState>;
      if (parsed.version !== 1) throw new Error(`Unsupported VS Code adapter state version: ${String(parsed.version)}`);
      return { version: 1, notes: parsed.notes ?? {}, slices: parsed.slices ?? {} };
    } catch (error) {
      if (isFileNotFound(error)) return EMPTY_ADAPTER();
      throw new Error(`BrainShare could not read .brainshare/vscode.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async writeManifest(manifest: ProjectManifestV1): Promise<void> {
    await this.writeJson(this.manifestFile, manifest);
  }

  private async writeSlices(slices: SlicesFileV1): Promise<void> {
    await this.writeJson(this.slicesFile, slices);
  }

  private async writeAdapter(adapter: AdapterState): Promise<void> {
    await this.writeJson(this.adapterFile, adapter);
  }

  private async writeJson(uri: vscode.Uri, value: unknown): Promise<void> {
    await vscode.workspace.fs.createDirectory(this.dir);
    await vscode.workspace.fs.writeFile(uri, Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8"));
  }

  private async migrateLegacy(legacy: WorkspaceState): Promise<ProjectManifestV1> {
    const manifest: ProjectManifestV1 = {
      version: 1,
      project: { name: this.projectName(), createdAt: new Date().toISOString() },
      notes: {},
    };
    const adapter = EMPTY_ADAPTER();
    const slices: SlicesFileV1 = { version: 1, slices: {} };

    for (const [rawPath, record] of Object.entries(legacy.notes ?? {})) {
      const path = normalizeBrainSharePath(rawPath);
      if (!record?.id || !isValidUlid(record.id)) throw new Error(`Invalid legacy BrainShare note identity for ${path}`);
      manifest.notes[path] = {
        id: record.id,
        ...(record.hash ? { hash: record.hash } : {}),
        ...(record.publishedAt ? { updatedAt: record.publishedAt } : {}),
      };
      if (record.url || record.publishedAt) adapter.notes[path] = { url: record.url, publishedAt: record.publishedAt };
    }

    for (const [id, slice] of Object.entries(legacy.slices ?? {})) {
      adapter.slices[id] = slice;
      slices.slices[id] = {
        id,
        title: slice.title,
        description: slice.description,
        include: [...slice.files],
        visibility: slice.gated ? "gated" : "unlisted",
        live: true,
      };
    }

    await this.writeManifest(manifest);
    await this.writeSlices(slices);
    await this.writeAdapter(adapter);
    return manifest;
  }
}

function isLegacyWorkspaceState(value: unknown): value is WorkspaceState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<WorkspaceState> & { project?: unknown };
  return state.version === 1 && state.project === undefined && !!state.notes && !!state.slices;
}

function readFrontmatterId(text: string): string | undefined {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) return undefined;
  const normalized = text.replace(/\r\n/g, "\n");
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) return undefined;
  const fm = normalized.slice(4, end);
  const match = fm.match(/^id:\s*['\"]?([^'\"\s]+)['\"]?\s*$/m);
  return match?.[1];
}

function writeFrontmatterId(text: string, id: string): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const normalized = text.replace(/\r\n/g, "\n");
  let next: string;
  if (normalized.startsWith("---\n")) {
    const end = normalized.indexOf("\n---\n", 4);
    if (end >= 0) {
      const fm = normalized.slice(4, end);
      const nextFm = /^id:\s*.*$/m.test(fm)
        ? fm.replace(/^id:\s*.*$/m, `id: ${id}`)
        : `id: ${id}\n${fm}`;
      next = `---\n${nextFm}\n---\n${normalized.slice(end + 5)}`;
      return eol === "\n" ? next : next.replace(/\n/g, eol);
    }
  }
  next = `---\nid: ${id}\n---\n\n${normalized}`;
  return eol === "\n" ? next : next.replace(/\n/g, eol);
}

function isFileNotFound(error: unknown): boolean {
  const code = (error as { code?: string } | undefined)?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code === "FileNotFound" || /file\s*not\s*found|enoent/i.test(message);
}
