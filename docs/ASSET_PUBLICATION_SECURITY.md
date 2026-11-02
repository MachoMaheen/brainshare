# Asset publication security

The legacy `scripts/bulk-publish-full.py` checks all selected vault content locally **before any network request or ULID stamping**. A failed preflight exits with code 2. Each finding contains a location and a code, not the matched secret value.

The preflight inventories image assets with project-relative paths, byte sizes, SHA-256 hashes and detected MIME types. It rejects symlink files or directories, paths with Unicode/case collisions, ambiguous image basenames, private filename patterns, recognizable credentials, active HTML, external image embeds, unresolved local images, and assets whose extension does not match their bytes. Supported raster formats are PNG, JPEG, GIF, WebP, AVIF and BMP. SVG, PDF and HTML files are not uploaded as images. Images are limited to 5 MB, with a 150 MB aggregate inventory limit. A file changed after preflight is rejected before that file is uploaded.

The Worker independently hashes the uploaded content and requires the URL key to equal its SHA-256 digest. It rejects files with unsupported signatures, mismatched MIME declarations or unsafe formats; it does not rely on editor-side checks. Scoped asset responses add `X-Content-Type-Options: nosniff`, a restrictive CSP, `Cross-Origin-Resource-Policy: same-origin` and `Referrer-Policy: no-referrer`. Previously stored SVG and unsupported media are not rendered by the scoped asset endpoint, even if referenced in an older Slice.

## Migration and limitations

- Existing SVG embeds and files with mismatched or non-SHA-256 asset keys will stop rendering. Convert trusted illustrations to raster formats, re-upload and republish the Slice manifest.
- Existing direct `/asset/<key>` links remain unavailable; scoped `/share/<id>/asset/<key>` links require membership and authorization.
- The legacy bulk publisher explicitly publishes the **whole vault** (except ignored directories); it cannot represent a restricted Slice. Use the CLI's reviewed Slice selection when you want document-level exclusions. Never point bulk publish at a directory containing private information.
- The scanner rejects common EXIF, XMP, and PNG textual metadata markers but does **not** fully parse every metadata container, inspect steganography, or guarantee that images are free from confidential information. Manually strip image metadata and review assets before publication.
- The bulk script previously performed stamp-and-upload in a single pass. The preflight gate stops unsafe scans before uploads, but source files can still change concurrently or a later network operation can fail after an earlier upload. No transactional multi-file publishing is claimed.

Run the offline regressions with:

```bash
python -m unittest discover -s scripts -p 'test_publication_preflight.py' -v
cd publisher && npm test && npm run test:smoke
```
