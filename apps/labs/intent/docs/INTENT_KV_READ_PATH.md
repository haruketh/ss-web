# Intent KV Read Path

## Architecture

The private engine publishes only its public-safe Intent schema to Cloudflare
Workers KV. This app reads that value server-side and exposes a read-only response:

```text
ss-engine private state
  -> ss-engine public-safe exporter
  -> Workers KV key: intent/latest.json
  -> vinext Next.js Route Handler GET /api/intent on Cloudflare Workers
  -> future Intent UI
```

No runtime Intent JSON is stored in this repository. The function cannot access the
Mac mini filesystem and receives no Cloudflare write credential.

## Binding

- Binding name: `INTENT_PUBLIC_KV`
- KV key: `intent/latest.json`
- Access from this application: read-only (`get` only)

The binding must refer to the same namespace written by the ss-engine exporter.
Do not put the engine's API token, account ID, namespace ID, filesystem paths, or
private Intent data into browser code or static assets.

## Local development

The checked-in Wrangler configuration declares `INTENT_PUBLIC_KV` with the
production namespace ID. Wrangler local development still uses a local KV store.
Seed only a synthetic document matching public schema version 1 at
`intent/latest.json`; do not copy production Intent runtime data into the repository.

For example:

```text
pnpm exec wrangler kv key put --binding INTENT_PUBLIC_KV --local \
  --path <synthetic-public-json> intent/latest.json \
  --config dist/server/wrangler.json
pnpm run start:vinext
```

Run `pnpm run build:vinext` before these commands. Seeding and starting must use the
same generated `dist/server/wrangler.json`, otherwise Wrangler can select separate
local stores. No Cloudflare credential is required by the unit tests or local KV
verification.

## Production Workers configuration

With the production KV namespace created:

1. Confirm `wrangler.jsonc` contains the intended production namespace ID.
2. Confirm the server-side binding is named `INTENT_PUBLIC_KV`.
3. Deploy the Worker and verify `GET /api/intent`.

The engine's write API token remains only on the engine host. The Route Handler uses
the server-side Workers binding and needs no token in source or client code.

The production namespace ID is a Cloudflare resource identifier, not a write
credential, but it is never included in browser code. Account IDs and API tokens do
not belong in this repository.

## Workers Builds

The generated vinext scripts and `dist/server/wrangler.json` establish these build
settings for the current monorepo app:

```text
Root directory: apps/labs/intent
Build command: pnpm run build:vinext
Deploy command: pnpm exec wrangler deploy --config dist/server/wrangler.json
Preview deploy command: pnpm exec wrangler versions upload --config dist/server/wrangler.json
Production branch: main
Build watch path: apps/labs/intent/**
```

Use the custom/vinext Workers configuration, not the Next.js Static HTML Export
Pages preset.

## Validation and failures

The function parses the KV value, requires `schema_version: 1`, validates every
required field and enum, and reconstructs the response from an explicit allowlist.
Unknown fields are discarded.

- Missing binding: `503 intent_data_unavailable`
- Temporary KV read failure: `503 intent_data_temporarily_unavailable`
- Missing value: `404 intent_data_not_found`
- Malformed or invalid value: `502 intent_data_invalid`
- Unsupported schema: `502 intent_schema_unsupported`

Provider errors and rejected data are not returned to the browser.
