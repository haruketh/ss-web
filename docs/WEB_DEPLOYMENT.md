# Second Session Web Deployment

## Model

Second Session Web uses the dedicated Second Session Cloudflare account, Workers +
vinext, and GitHub Workers Builds. Each app is deployed as its own Worker from its
app directory in the monorepo. Normal production releases are created by the
GitHub integration, not by direct local Wrangler deployment.

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

Account IDs, API tokens, private engine paths, and runtime data must not be added to
documentation, source, or client-visible configuration.
