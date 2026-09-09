# Second Session Web Architecture

## Role

Second Session Web is the public presentation and read-only consumption layer for
Second Session. The private `ss-engine` owns runtime behavior, state generation,
and public-safe export. This public repository owns Web applications, public
schemas, UI, and deployment structure.

Only explicitly exported public-safe data crosses this boundary. The Web does not
read the Mac mini filesystem, private engine state, or private Intent schema.

```text
Second Session
├─ ss-engine (private runtime and public-safe exporters)
└─ ss-web (public applications and visualization)
```

## Monorepo

```text
ss-web/
├─ apps/
│  ├─ main/
│  └─ labs/
│     ├─ intent/
│     └─ room-discovery/
└─ packages/
   ├─ ui/
   ├─ design-tokens/
   └─ shared/
```

Applications remain independently deployable. Shared visual primitives and safe
public utilities should move into `packages/ui`, `packages/design-tokens`, or
`packages/shared` only when two or more real applications need them.

## Deployment model

Full-stack Next.js applications deploy as independent Cloudflare Workers using
vinext. GitHub integration and Workers Builds build each application from its own
monorepo root. Normal production deployment follows a push to the configured
branch; local credentials are not used for direct Wrangler production deploys.

The current Intent Worker lives at `apps/labs/intent`. Its server-side code reads a
single public document from Cloudflare Workers KV. KV is the public-data boundary,
not a mirror of engine runtime state.

```text
ss-engine private Intent
  -> public-safe exporter
  -> Cloudflare Workers KV
  -> Intent Worker
  -> read-only API and UI
```

No runtime Intent JSON is stored in ss-web. The Mac mini exposes no inbound path,
and ss-web has neither a private engine path nor a KV write credential.

## Future architecture

`apps/main` will become the primary public Second Session site. Main will own the
global header and navigation, with the hamburger menu introduced when Main is
implemented. It may link to Labs, but its runtime must not depend on them.

Intent can remain an independent Lab. State and Room experiences may become
separate applications or Workers when their requirements are known. Their refresh
and polling needs must be designed from those products rather than generalized
from Intent, which intentionally performs no client polling or automatic refresh.

Labs and v1/v2 prototypes may use Preview deployments. Independent deployment and
the public/private boundary must remain intact through later consolidation.

## Repository boundary

This public repository may contain frontend implementation, public schemas,
architecture and UI design, Cloudflare deployment structure, and documentation of
the public/private boundary.

It must not contain private Intent prompts, raw Review data, evidence, internal
scoring, private memory, API tokens, private DID keys, security-sensitive engine
internals, or mutable runtime state.
