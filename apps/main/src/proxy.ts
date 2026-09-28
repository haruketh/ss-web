import type { NextRequest } from "next/server";

const CANONICAL_HOST = "secondsession.world";
const WWW_HOST = "www.secondsession.world";

export function proxy(request: NextRequest) {
  const requestHost = request.headers.get("host")?.toLowerCase().split(":")[0];
  if (requestHost !== WWW_HOST) return;

  const canonicalUrl = new URL(request.url);
  canonicalUrl.protocol = "https:";
  canonicalUrl.hostname = CANONICAL_HOST;
  canonicalUrl.port = "";

  return Response.redirect(canonicalUrl, 301);
}
