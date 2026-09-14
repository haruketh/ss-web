# Sonnet Mission Web v0.1

The private runtime deterministically exports schema v1 to a local ignored staging file every five minutes. A dedicated Cloudflare credential publishes that validated document to `sonnet/latest.json`. The Worker binding `SONNET_PUBLIC_KV` is read-only from application code; `/api/sonnet` validates and reconstructs the allowlisted schema before returning it. Browser code polls the API every 60 seconds and retains the last successful document on failure.

Public sources are bounded durable formation opportunities/events, Reflex processing records, protocol request status, active formation state, and current phase/completion/submission metadata. Incoming message bodies, DIDs, signatures, request IDs, secrets, paths, thresholds, and internal scoring never cross the boundary.

Cloudflare namespace creation, binding configuration, secret provisioning on the private engine, deployment, and the five-minute launchd job remain manual production steps.
