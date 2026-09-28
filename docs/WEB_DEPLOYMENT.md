# Second Session Web Deployment

## Model

Second Session Web uses Cloudflare Workers and vinext. Each app has its own
Worker and deployment settings. The Labs Intent app currently uses GitHub
Workers Builds; the main State site is deployed from its app directory with
vinext's Wrangler-backed deploy command.

Secrets and write credentials are not stored in this repository. Preview
deployments can be used for prototypes and release review without changing the
public/private data boundary.

## Intent Worker

```text
Application root: apps/labs/intent
Production branch: main
Build command: pnpm run build:vinext
Deploy command: pnpm exec wrangler deploy --config dist/server/wrangler.json
Preview command: pnpm exec wrangler versions upload --config dist/server/wrangler.json
Build watch path: apps/labs/intent/**
Framework preset: None / Custom
```

The server-side binding is `INTENT_PUBLIC_KV`; the fixed key is
`intent/latest.json`. The Worker only reads the namespace. The private engine's KV
write token remains on the engine host and is never available to browser code.

## Main State Worker

```text
Application root: apps/main
Worker: second-session
Build command: pnpm build:vinext
Deploy command: pnpm deploy:vinext
Canonical site: https://secondsession.world
State page: https://secondsession.world/state
Custom Domains: secondsession.world and www.secondsession.world
www behavior: 301 redirect to the apex host, preserving path and query
Operational fallback: https://second-session.second-session.workers.dev/state
Public data binding: STATE_PUBLIC_KV (read-only from the Worker)
```

The Worker reads public projections only. The binding targets the existing
`second-session-state-public` namespace. The ss-engine publisher owns writes;
no Cloudflare write credential is present in the web app.

`/` and `/state-demo` redirect to `/state`. Changes to the main app should keep
the Worker binding, DID-keyed KV key, and both redirects intact.
The `www.secondsession.world` Custom Domain is handled by the same Worker and
redirects permanently to `https://secondsession.world`, preserving the full
path and query string. The `workers.dev` hostname remains enabled as an
operational fallback and is not the canonical public URL.

Account IDs, API tokens, private engine paths, and runtime data must not be added to
documentation, source, or client-visible configuration.

## Daily Public State publication

The ss-engine publisher is production-active as the system LaunchDaemon
`chat.flop.state-public-publisher`, installed at
`/Library/LaunchDaemons/chat.flop.state-public-publisher.plist` and running as
`flop` at 23:45 local time. Daily Reflection runs independently at 23:00. The
publisher writes the validated public projection to the existing DID-keyed KV
entry; the Worker remains read-only. Operators can inspect the job with
`launchctl print system/chat.flop.state-public-publisher` and request a manual
one-shot with `launchctl kickstart system/chat.flop.state-public-publisher`.
Successful output reports only schema and public record counts.
