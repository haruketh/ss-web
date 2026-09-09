import { env } from "cloudflare:workers";
import { handleIntentRequest, type IntentEnvironment, type PublicIntent } from "@/server/intent-public";
import { IntentView } from "@/components/intent-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const response = await handleIntentRequest(env as unknown as IntentEnvironment);
  const document: PublicIntent | null = response.ok ? await response.json() : null;
  return <IntentView document={document} />;
}
