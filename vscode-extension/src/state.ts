import * as vscode from "vscode";
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

const DEFAULT_STATE: WorkspaceState = { version: 1, notes: {}, slices: {} };

export class StateStore {
  constructor(private readonly root: vscode.Uri) {}

  private get dir(): vscode.Uri { return vscode.Uri.joinPath(this.root, ".brainshare"); }
  private get file(): vscode.Uri { return vscode.Uri.joinPath(this.dir, "manifest.json"); }

  async read(): Promise<WorkspaceState> {
    try {
      const raw = await vscode.workspace.fs.readFile(this.file);
      const parsed = JSON.parse(Buffer.from(raw).toString("utf8")) as Partial<WorkspaceState>;
      if (parsed.version !== undefined && parsed.version !== 1) {
        throw new Error(`Unsupported BrainShare manifest version: ${String(parsed.version)}`);
      }
      return {
        version: 1,
        notes: parsed.notes ?? {},
        slices: parsed.slices ?? {},
      };
    } catch (error) {
      if (isFileNotFound(error)) return structuredClone(DEFAULT_STATE);
      throw new Error(`BrainShare could not read .brainshare/manifest.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async write(state: WorkspaceState): Promise<void> {
    await vscode.workspace.fs.createDirectory(this.dir);
    const body = Buffer.from(JSON.stringify(state, null, 2) + "\n", "utf8");
    await vscode.workspace.fs.writeFile(this.file, body);
  }

  relative(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false).replace(/\\/g, "/");
  }

  async getOrCreateId(uri: vscode.Uri, identityMode: "sidecar" | "frontmatter"): Promise<string> {
    const path = this.relative(uri);
    const text = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
    const frontmatterId = readFrontmatterId(text);

    // Always reuse a valid existing Obsidian/BrainShare id, even in sidecar mode.
    // This prevents VS Code from accidentally giving the same note a second identity.
    if (frontmatterId && isValidUlid(frontmatterId)) {
      if (identityMode === "sidecar") {
        const state = await this.read();
        if (state.notes[path]?.id !== frontmatterId) {
          state.notes[path] = { ...(state.notes[path] ?? {}), id: frontmatterId };
          await this.write(state);
        }
      }
      return frontmatterId;
    }

    if (identityMode === "frontmatter") {
      const id = ulid();
      await vscode.workspace.fs.writeFile(uri, Buffer.from(writeFrontmatterId(text, id), "utf8"));
      return id;
    }

    const state = await this.read();
    const existing = state.notes[path]?.id;
    if (existing && isValidUlid(existing)) return existing;
    const id = ulid();
    state.notes[path] = { ...(state.notes[path] ?? {}), id };
    await this.write(state);
    return id;
  }

  async recordPublishedNote(uri: vscode.Uri, patch: Partial<NoteRecord> & { id: string }): Promise<void> {
    const state = await this.read();
    const path = this.relative(uri);
    state.notes[path] = { ...(state.notes[path] ?? {}), ...patch };
    await this.write(state);
  }

  async removeNote(uri: vscode.Uri): Promise<void> {
    const state = await this.read();
    delete state.notes[this.relative(uri)];
    await this.write(state);
  }

  async renameNote(oldUri: vscode.Uri, newUri: vscode.Uri): Promise<void> {
    const state = await this.read();
    const oldPath = this.relative(oldUri);
    const newPath = this.relative(newUri);
    const record = state.notes[oldPath];
    if (!record) return;
    state.notes[newPath] = record;
    delete state.notes[oldPath];
    for (const slice of Object.values(state.slices)) {
      const index = slice.files.indexOf(oldPath);
      if (index >= 0) slice.files[index] = newPath;
    }
    await this.write(state);
  }

  async upsertSlice(slice: SliceRecord): Promise<void> {
    const state = await this.read();
    state.slices[slice.id] = slice;
    await this.write(state);
  }

  async removeSlice(id: string): Promise<void> {
    const state = await this.read();
    delete state.slices[id];
    await this.write(state);
  }
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
