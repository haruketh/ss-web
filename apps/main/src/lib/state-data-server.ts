/// <reference types="vite/client" />
import "server-only";
import { emptyStatePageData, mapDevelopmentSnapshot, readStatePageDataFromKV } from "./state-data.ts";

export async function getStatePageData() {
  if (import.meta.env.DEV || process.env.NODE_ENV === "development") {
    try {
      const { default: snapshot } = await import("../../data/state-demo.json");
      return mapDevelopmentSnapshot(snapshot);
    } catch {
      return emptyStatePageData();
    }
  }

  try {
    const { env } = await import("cloudflare:workers");
    return await readStatePageDataFromKV(env.STATE_PUBLIC_KV, env.STATE_PUBLIC_DID);
  } catch {
    return emptyStatePageData();
  }
}
