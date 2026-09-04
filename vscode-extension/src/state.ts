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
      const parsed = JSON.parse(Buffer.from(raw).toString("utf8")) as WorkspaceState;
      return {
        version: 1,
        notes: parsed.notes ?? {},
        slices: parsed.slices ?? {},
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
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
    if (identityMode === "frontmatter") {
      const text = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
      const existing = readFrontmatterId(text);
      if (existing && isValidUlid(existing)) return existing;
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
  const normalized = text.replace(/\r\n/g, "\n");
  if (normalized.startsWith("---\n")) {
    const end = normalized.indexOf("\n---\n", 4);
    if (end >= 0) {
      const fm = normalized.slice(4, end);
      const nextFm = /^id:\s*.*$/m.test(fm)
        ? fm.replace(/^id:\s*.*$/m, `id: ${id}`)
        : `id: ${id}\n${fm}`;
      return `---\n${nextFm}\n---\n${normalized.slice(end + 5)}`;
    }
  }
  return `---\nid: ${id}\n---\n\n${text}`;
}
