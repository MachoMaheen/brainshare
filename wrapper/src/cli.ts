#!/usr/bin/env node
import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function authHeaders(token: string) {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    "user-agent": "brainshare-wrap/0.2",
  } as Record<string, string>;
}

async function call(
  url: string,
  method: string,
  body: unknown,
  token: string
): Promise<{ ok: boolean; status: number; data: any; text: string }> {
  const res = await fetch(url, {
    method,
    headers: authHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data, text };
}

const sharedAuth = (y: Argv) =>
  y
    .option("publisher", {
      type: "string",
      demandOption: true,
      describe: "publisher base URL",
    })
    .option("token", {
      type: "string",
      demandOption: true,
      describe: "publisher bearer token (PUBLISHER_TOKEN)",
    });

await yargs(hideBin(process.argv))
  .scriptName("brainshare-wrap")
  .command(
    "create",
    "Create or update a wrapper bundle",
    (y) =>
      sharedAuth(y)
        .option("ulids", {
          type: "string",
          demandOption: true,
          describe: "comma-separated ULIDs",
        })
        .option("title", { type: "string", default: "Shared slice" })
        .option("description", { type: "string", default: "" })
        .option("name", {
          type: "string",
          describe: "wrapper id (defaults to a random short string)",
        })
        .option("gated", {
          type: "boolean",
          default: false,
          describe: "require ?t=<jwt> token to view",
        }),
    async (a) => {
      const ulids = (a.ulids as string)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const bad = ulids.filter((u: string) => !ULID_PATTERN.test(u));
      if (bad.length) {
        console.error(`bad ULIDs: ${bad.join(", ")}`);
        process.exit(1);
      }
      const wrapId = a.name ?? Math.random().toString(36).slice(2, 10);
      const publisher = (a.publisher as string).replace(/\/$/, "");
      const r = await call(
        `${publisher}/api/wrappers/${wrapId}`,
        "PUT",
        {
          title: a.title,
          description: a.description,
          ulids,
          gated: a.gated,
          created_at: new Date().toISOString(),
        },
        a.token as string
      );
      if (!r.ok) {
        console.error(`failed: ${r.status} ${r.text}`);
        process.exit(1);
      }
      console.log(`wrapper ${a.gated ? "(gated) " : ""}created: ${r.data.url}`);
      console.log(`bundled ${ulids.length} note(s)`);
      if (a.gated) {
        console.log(`\nThis wrapper is gated — mint an access token next:`);
        console.log(`  brainshare-wrap mint --wrap ${wrapId} --publisher ${publisher} --token <PUBLISHER_TOKEN>`);
      }
    }
  )
  .command(
    "mint",
    "Mint an access token for a gated wrapper",
    (y) =>
      sharedAuth(y)
        .option("wrap", {
          type: "string",
          demandOption: true,
          describe: "wrapper id",
        })
        .option("exp-days", {
          type: "number",
          default: 7,
          describe: "expiry in days from now",
        })
        .option("exp-seconds", {
          type: "number",
          describe: "expiry in seconds (overrides --exp-days)",
        })
        .option("max-views", {
          type: "number",
          describe: "view-count limit",
        })
        .option("viewer", {
          type: "string",
          describe: "viewer label (telemetry only, not enforced)",
        }),
    async (a) => {
      const publisher = (a.publisher as string).replace(/\/$/, "");
      const body: Record<string, unknown> = {};
      if (a["exp-seconds"] !== undefined) body.exp_seconds = a["exp-seconds"];
      else body.exp_days = a["exp-days"];
      if (a["max-views"] !== undefined) body.max_views = a["max-views"];
      if (a.viewer) body.viewer = a.viewer;
      const r = await call(
        `${publisher}/api/wrappers/${a.wrap}/tokens`,
        "POST",
        body,
        a.token as string
      );
      if (!r.ok) {
        console.error(`failed: ${r.status} ${r.text}`);
        process.exit(1);
      }
      console.log(`token minted`);
      console.log(`  url:        ${r.data.url}`);
      console.log(`  jti:        ${r.data.jti}        (use this to revoke)`);
      console.log(`  expires:    ${new Date(r.data.exp * 1000).toISOString()}`);
      if (r.data.max_views) console.log(`  max views:  ${r.data.max_views}`);
      if (r.data.viewer)    console.log(`  viewer:     ${r.data.viewer}`);
    }
  )
  .command(
    "revoke",
    "Revoke an access token by jti",
    (y) =>
      sharedAuth(y)
        .option("wrap", {
          type: "string",
          demandOption: true,
          describe: "wrapper id (informational; jti is the actual key)",
        })
        .option("jti", {
          type: "string",
          demandOption: true,
          describe: "token id to revoke",
        }),
    async (a) => {
      const publisher = (a.publisher as string).replace(/\/$/, "");
      const r = await call(
        `${publisher}/api/wrappers/${a.wrap}/revoke`,
        "POST",
        { jti: a.jti },
        a.token as string
      );
      if (!r.ok) {
        console.error(`failed: ${r.status} ${r.text}`);
        process.exit(1);
      }
      console.log(`revoked: ${a.jti}`);
    }
  )
  .demandCommand(1, "specify a subcommand: create | mint | revoke")
  .strict()
  .help()
  .parse();
