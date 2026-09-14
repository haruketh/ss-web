# Sonnet Mission Web

Read-only public view of Saruku's Sonnet Challenge mission. The Worker reads the validated public schema from the `SONNET_PUBLIC_KV` binding at `sonnet/latest.json`; it has no access to the private participant runtime or KV write credentials.

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build:vinext
```

Before deployment, create a dedicated KV namespace, replace the placeholder namespace ID in `wrangler.jsonc`, bind it as `SONNET_PUBLIC_KV`, and deploy through the existing vinext Cloudflare workflow.
