import { env } from "cloudflare:workers";

import {
  handleIntentRequest,
  type IntentEnvironment,
} from "@/server/intent-public";

export async function GET(): Promise<Response> {
  return handleIntentRequest(env as unknown as IntentEnvironment);
}
