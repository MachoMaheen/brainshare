# Local Worker security smoke test

This test starts a disposable Cloudflare Workers runtime over HTTP using Wrangler and its local KV simulator. No Cloudflare account, production Worker, production KV namespace, or real credentials are used.

```bash
cd publisher
npm ci
npm run test:smoke
```

The command creates an isolated temporary KV directory, uses `wrangler.smoke.toml`, and cleans up after completion. It executes the actual Worker entrypoint over HTTP and uses synthetic fixture notes, an intentionally excluded canary, fake assets, and ephemeral auth tokens.

It verifies:

- Private, public, and excluded notes are not reachable through unexpected URLs.
- Unscoped note/canvas/asset routes do not bypass Slice access controls.
- Public search, feed, landing, rendered notes, and ZIP downloads contain only authorized Slice content.
- Gated landing, raw Markdown, search, feed, ZIP, and assets deny anonymous requests.
- Per-Slice asset membership is enforced.
- A valid access-token link redirects into a scoped, HttpOnly browser session without leaving the token in the redirected URL or HTML.
- Separate browser sessions do not inherit access.
- Revoked tokens and cookies stop authorizing further requests.
- Gated membership takes precedence over a previous standalone-public marker.

The smoke test also runs on pull requests in the publisher CI job.

## Before any Cloudflare staging rollout

1. Deploy to a **separate** Worker and KV namespace, not a production binding. Never copy an existing production KV ID into the smoke configuration.
2. Use fresh staging-only `PUBLISHER_TOKEN` and `JWT_SECRET` secrets. Do not commit or log them.
3. Publish only synthetic or explicitly authorized test documents to staging.
4. Validate URLs in a clean browser session and an authorized session. Confirm revocation, expiry, direct assets, file downloads, note search, raw Markdown, and canvas access.
5. Audit existing public direct-note links (`/:ulid`), standalone canvas links (`/c/:ulid`), and unscoped asset links (`/asset/:key`). The access restrictions introduced in PR #17 intentionally change those URLs. Fix or redirect eligible links **only** after their public visibility has been confirmed.
6. Have a tested rollback plan. Restoring an older Worker version restores older exposure behaviors and should not be treated as a privacy-safe rollback. Prefer a forward fix.
7. Inspect custom domain caching and indexing. A deployment does not automatically erase data that was already downloaded or cached elsewhere.

This local test establishes how the Worker behaves in a simulated runtime. A production-like staging deployment and operator confirmation are separate release gates.
