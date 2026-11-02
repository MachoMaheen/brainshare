export const BRAINSHARE_PROTOCOL_VERSION = 1 as const;
export type SliceVisibility = "public" | "unlisted" | "gated";

export interface NoteIdentity { id: string; hash?: string; updatedAt?: string; }
export interface ProjectManifestV1 { version: 1; project: { name: string; createdAt?: string }; notes: Record<string, NoteIdentity>; }
export interface SliceDefinitionV1 { id: string; title: string; description?: string; include: string[]; exclude?: string[]; entrypoint?: string; pinned?: string[]; visibility?: SliceVisibility; live?: boolean; }
export interface SliceFileV1 { id: string; path: string; hash: string; title: string; }
export interface SliceEdgeV1 { from: string; to: string; kind: "wikilink" | "markdown"; }
export interface CompiledSliceV1 { protocol: 1; id: string; revision: string; title: string; description: string; visibility: SliceVisibility; live: boolean; entrypoint?: string; createdAt: string; files: SliceFileV1[]; edges: SliceEdgeV1[]; backlinks: Record<string, string[]>; }
export interface SlicesFileV1 { version: 1; slices: Record<string, SliceDefinitionV1>; }

export function normalizeBrainSharePath(input: string): string {
  const value = input.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/{2,}/g, "/");
  if (!value || value.startsWith("/") || value.split("/").includes("..")) throw new Error(`Invalid BrainShare path: ${input}`);
  return value;
}
export function assertSliceId(id: string): string { if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) throw new Error(`Invalid slice id: ${id}`); return id; }
export function isUlid(value: string): boolean { return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(value); }
export function validateProjectManifest(value: unknown): ProjectManifestV1 {
  if (!value || typeof value !== "object") throw new Error("Manifest must be an object");
  const m = value as Partial<ProjectManifestV1>;
  if (m.version !== 1) throw new Error("Unsupported manifest version");
  if (!m.project || typeof m.project.name !== "string" || !m.project.name.trim()) throw new Error("Manifest project.name is required");
  if (!m.notes || typeof m.notes !== "object" || Array.isArray(m.notes)) throw new Error("Manifest notes must be an object");
  for (const [path, note] of Object.entries(m.notes)) { normalizeBrainSharePath(path); if (!note || !isUlid(note.id)) throw new Error(`Invalid note identity for ${path}`); }
  return m as ProjectManifestV1;
}
export function validateSlicesFile(value: unknown): SlicesFileV1 {
  if (!value || typeof value !== "object") throw new Error("Slices file must be an object");
  const f = value as Partial<SlicesFileV1>;
  if (f.version !== 1 || !f.slices || typeof f.slices !== "object" || Array.isArray(f.slices)) throw new Error("Invalid slices file");
  for (const [key, slice] of Object.entries(f.slices)) { assertSliceId(key); if (!slice || slice.id !== key) throw new Error(`Slice key/id mismatch: ${key}`); if (!slice.title?.trim()) throw new Error(`Slice ${key} needs a title`); if (!Array.isArray(slice.include) || slice.include.length === 0) throw new Error(`Slice ${key} needs include patterns`); for (const p of slice.include) if (typeof p !== "string" || !p.trim()) throw new Error(`Bad include in ${key}`); }
  return f as SlicesFileV1;
}
