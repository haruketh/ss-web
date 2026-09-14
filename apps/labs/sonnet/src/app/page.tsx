import { env } from "cloudflare:workers";
import { SonnetView } from "@/components/sonnet-view";
import { handleSonnetRequest, type PublicSonnet, type SonnetEnvironment } from "@/server/sonnet-public";
export const dynamic="force-dynamic"; export const revalidate=0;
export default async function Home(){const response=await handleSonnetRequest(env as unknown as SonnetEnvironment);const initial:PublicSonnet|null=response.ok?await response.json():null;return <SonnetView initial={initial}/>}
