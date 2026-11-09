# Obsidian attachment publishing

## Why a note used to lose images

The previous Obsidian publish command sent only the Markdown body to
`PUT /api/notes/:ulid`. Obsidian resolves `![[Pasted image.png]]` inside a
local vault; the Cloudflare Worker cannot read those local files. A historical
bulk import script could upload images into a Slice manifest, but that did not
make **Publish current note** work.

## New publishing sequence

1. Scan the selected note(s) for local embedded images in `![[image.png]]`
   and standard `![alt](relative/path.png)` syntax. Remote URLs, Markdown
   examples in fences, code spans, and HTML comments are not uploaded.
2. Resolve references via Obsidian's metadata cache and vault file APIs; fail
   before publishing if a reference is missing or unsupported.
3. Review the exact media filenames in the Publish confirmation, particularly
   before sharing company or customer screenshots.
4. Upload each image using SHA-256 content addressing and the existing
   authenticated `PUT /api/assets/:sha256` route. Supported image MIME types
   are PNG, JPEG, GIF, WebP, AVIF and BMP. Each image must be at most 5 MB.
   Static PNG/JPEG/WebP carrying recognizable metadata are re-encoded to
   avoid publishing EXIF/XMP/text chunks. Image types that cannot be safely
   re-encoded are rejected with a clear message, not silently published.
5. Atomically replace the note's filename → SHA-256 mapping using the
   owner-authenticated `PUT /api/notes/:ulid/assets` route. The Worker checks
   that the referenced binary blobs already exist.
6. Publish/update the Markdown body and, for a Slice, include its image
   hashes under note-prefixed manifest entries. Updating an existing note
   automatically updates any Slice it belongs to and invalidates the
   affected HTML cache version.

## Serving / access boundary

- Public standalone note: `/:ulid`
- Images for that note: `/note/:ulid/asset/:sha256`
- Images for a Slice: `/share/:slice/asset/:sha256`
- Global `/asset/:sha256` remains **unavailable** to anonymous readers.
- A note's standalone image URL requires that the note itself be publicly
  accessible and not blocked by a gated Slice reference.
- Gated Slice asset requests run the same access check as the note.
- Removing an image from a note's manifest removes its authorization.
  Unpublishing a note also revokes its automatically-managed Slice media
  memberships. Content-addressed binary values may remain stored for
  future deduplication; unreferenced-blob garbage collection is separate.

## Upgrade an existing broken note

1. Deploy the **updated Worker** first; the old Worker does not implement
   `PUT /api/notes/:ulid/assets`.
2. Update the BrainShare **Obsidian plugin**.
3. In Obsidian open the previously affected Markdown note, confirm that
   the referenced local attachments exist in its vault, and run
   **BrainShare: Publish current note** again.
4. Confirm the seven images display at the existing stable ULID URL.
   If image upload is rejected, inspect Obsidian's developer console for the
   HTTP status, file path, and reason. A publishing error is deliberate:
   a broken/incomplete note must not be reported as a success.

This change does **not** silently upload a whole vault. Only referenced
images in explicitly published notes are eligible.

## Deferred media types

SVG, PDFs, video and audio remain unsupported by the current raster-only KV
upload route. Adding these needs a reviewed R2-backed media pipeline with
content sniffing, file-size quotas, Range requests, safe PDF/video headers,
and private/gated media authorization; do not widen the binary endpoint's
allowlist without those controls.
