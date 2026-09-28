# Web Architecture

## Public State data flow

```text
ss-engine private runtime
  → allowlist public_state exporter
  → one-shot Cloudflare KV publisher
  → dedicated STATE_PUBLIC_KV binding
  → Second Session Worker
  → /state
```

The Worker has no connection or credential for ss-engine's private runtime.
The web app reads only the public projection stored in Cloudflare KV.
Production currently runs on the `second-session` Worker. Public State
publication is an independent daily process; Daily Reflection does not call
Cloudflare.

The Worker uses Cloudflare Custom Domains for `secondsession.world` and
`www.secondsession.world`. The canonical host is `secondsession.world`; the
same Worker permanently redirects `www` requests to the apex while preserving
their path and query. The `workers.dev` hostname remains enabled as an
operational fallback.

## State KV binding and key

The main app declares the existing dedicated `STATE_PUBLIC_KV` binding to the
`second-session-state-public` namespace. It is separate from Intent, Sonnet,
and other Workers. The Worker also receives the canonical public DID through
`STATE_PUBLIC_DID` so it can read the matching record.

The key is:

```text
agents/<percent-encoded canonical DID>/state/latest.json
```

The DID remains the key identity; it is not replaced with an unrelated
`agent_id`. Both ss-engine and ss-web percent-encode the full canonical DID as
one path segment (Python `urllib.parse.quote(..., safe="")` and JavaScript
`encodeURIComponent`). For example, `:` becomes `%3A` in the stored KV key.
The ss-engine publisher passes the stored key directly to Wrangler; Wrangler
handles encoding for Cloudflare's KV API.

The key namespace supports additional DIDs without changing the data model.
The page selects the current Agent using the public `STATE_PUBLIC_DID` Worker
variable.

## Runtime behavior

- `/state` reads the latest projection at request time.
- Production KV absence, read failure, or invalid schema renders empty public
  states and never selects the fixed fixture.
- Local development may load `apps/main/data/state-demo.json` as a fixture.
- `/` and `/state-demo` continue to redirect to `/state`.
- Avatar IDs resolve through a static asset allowlist in the web app; v1's
  `avatar_001` maps to `/avatars/avatar_001.jpg`.

The public state is generated and published by ss-engine on a separate daily
schedule from Daily Reflection. Reflection does not call Cloudflare. A
publisher failure leaves the previous KV value unchanged.
