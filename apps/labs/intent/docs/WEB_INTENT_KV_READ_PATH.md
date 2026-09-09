# Web Intent KV Read Path

## Architecture

The private engine publishes only public-safe Intent schema version 1 to Cloudflare
Workers KV. This app reads the value server-side and exposes the same validated
document to its UI and read-only API:

```text
ss-engine private state
  -> ss-engine public-safe exporter
  -> Workers KV key: intent/latest.json
  -> vinext Next.js Route Handler GET /api/intent on Cloudflare Workers
  -> Intent Server Component and UI
```

No runtime Intent JSON is stored in this repository. The Worker cannot access the
Mac mini filesystem and receives no Cloudflare write credential.

## Binding

- Binding name: `INTENT_PUBLIC_KV`
- KV key: `intent/latest.json`
- Application access: read-only (`get` only)

The binding points to the namespace written by ss-engine. Engine API tokens,
account IDs, private paths, and private Intent data do not enter browser code or
static assets.

## Local development

The checked-in Wrangler configuration declares `INTENT_PUBLIC_KV`. Local Wrangler
development uses a local KV store. Seed only a synthetic document matching public
schema version 1; never copy production Intent runtime data into this repository.

```text
pnpm run build:vinext
pnpm exec wrangler kv key put --binding INTENT_PUBLIC_KV --local \
  --path <synthetic-public-json> intent/latest.json \
  --config dist/server/wrangler.json
pnpm run start:vinext
```

Seeding and starting use the same generated Wrangler config. Unit tests and local
KV verification require no Cloudflare credential.

## Validation and failures

The server parses JSON, requires `schema_version: 1`, validates required fields and
enums, and reconstructs an explicit allowlist. Unknown fields are discarded.

- missing binding: `503 intent_data_unavailable`
- temporary KV failure: `503 intent_data_temporarily_unavailable`
- missing value: `404 intent_data_not_found`
- malformed or invalid value: `502 intent_data_invalid`
- unsupported schema: `502 intent_schema_unsupported`

Provider detail and rejected source data are not returned to the browser. The API
declares UTF-8 explicitly so non-ASCII public wording survives the full path.

Workers Builds settings are documented in
[`../../../../docs/WEB_DEPLOYMENT.md`](../../../../docs/WEB_DEPLOYMENT.md).
