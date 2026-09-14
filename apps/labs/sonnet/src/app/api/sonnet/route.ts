import { env } from "cloudflare:workers";
import { handleSonnetRequest, type SonnetEnvironment } from "@/server/sonnet-public";
export async function GET(){ return handleSonnetRequest(env as unknown as SonnetEnvironment); }
