# Intent KV Read Path

## Architecture

The private engine publishes only its public-safe Intent schema to Cloudflare
Workers KV. This app reads that value server-side and exposes a read-only response:

```text
ss-engine private state
  -> ss-engine public-safe exporter
  -> Workers KV key: intent/latest.json
  -> Pages Function GET /api/intent
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

Create a local KV namespace through Wrangler's local Pages development support and
bind it as `INTENT_PUBLIC_KV`. Seed only a synthetic document matching public schema
version 1 at `intent/latest.json`; do not copy production Intent runtime data into
the repository.

For example, after the app's Cloudflare Pages build/development command is defined:

```text
wrangler pages dev <build-output> --kv INTENT_PUBLIC_KV
```

The binding can also be configured in a local, Git-ignored Wrangler configuration.
No real namespace identifier or credential is required by the unit tests.

## Production Pages configuration

In the Cloudflare dashboard for the Intent Pages project:

1. Create or select the Workers KV namespace used by the engine exporter.
2. Open Settings, then Functions, then KV namespace bindings.
3. Add the production binding `INTENT_PUBLIC_KV` for that namespace.
4. Add the same binding separately for Preview only if preview access is intended.
5. Deploy the application and verify `GET /api/intent`.

The engine's write API token remains only on the engine host. The Pages Function
uses its server-side namespace binding and needs no token in source or client code.

No committed Wrangler file is required for the dashboard-managed binding. If the
project later adopts a committed Wrangler configuration, use a placeholder/binding
name only and keep account and namespace identifiers in deployment configuration.

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
