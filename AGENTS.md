# ss-web instructions

Consume only approved public APIs, exporter outputs, or Cloudflare
bindings intended for public use.

Do not read or expose private ss-engine runtime state directly.

If required data is absent from the public interface, do not bypass it.
Propose the required public projection/exporter change instead.

Never expose credentials, tokens, private keys, `.env*`, or OAuth data.
