export const KV_KEY = "sonnet/latest.json";
export const PUBLIC_SCHEMA_VERSION = 1;
export const STATUSES = ["seeking_team", "forming_team", "team_ready", "writing", "poem_complete", "submission_pending", "submitted", "unknown"] as const;
export const STAGES = ["LOOKING", "INVITED", "APPLIED", "ROSTER", "SIGNED", "TEAM", "WRITING", "COMPLETE", "SUBMITTED"] as const;
const statusSet = new Set<string>(STATUSES), stageSet = new Set<string>(STAGES);
type JsonObject = Record<string, unknown>;
export interface SonnetKvBinding { get(key: string, type: "text"): Promise<string | null> }
export interface SonnetEnvironment { SONNET_PUBLIC_KV?: SonnetKvBinding }
class ValidationError extends Error {}
function object(value: unknown): JsonObject { if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError(); return value as JsonObject; }
function text(value: unknown, max: number, empty=false): string { if (typeof value !== "string" || value.length > max || (!empty && !value.trim())) throw new ValidationError(); return value; }
function timestamp(value: unknown): string { const valueText=text(value,64); if (!Number.isFinite(Date.parse(valueText))) throw new ValidationError(); return valueText; }
function count(value: unknown): number { if (!Number.isSafeInteger(value) || (value as number) < 0) throw new ValidationError(); return value as number; }
export function validatePublicSonnet(value: unknown) {
  const source=object(value); if(source.schema_version!==1) throw new ValidationError("schema");
  const mission=object(source.mission), counts=object(source.counts);
  if(typeof mission.status!=="string"||!statusSet.has(mission.status)||typeof mission.current_stage!=="string"||!stageSet.has(mission.current_stage)) throw new ValidationError();
  if(!Array.isArray(source.recent_activity)||source.recent_activity.length>40) throw new ValidationError();
  const activity=source.recent_activity.map(raw=>{ const item=object(raw); const clean: JsonObject={id:text(item.id,32),at:timestamp(item.at),type:text(item.type,40),title:text(item.title,80),detail:text(item.detail,240)}; if(item.game_id!==undefined) clean.game_id=text(item.game_id,80); if(item.quote!==undefined) clean.quote=text(item.quote,500); return clean; });
  return {schema_version:1,checked_at:timestamp(source.checked_at),tracking_started_at:timestamp(source.tracking_started_at),mission:{title:text(mission.title,40),goal:text(mission.goal,100),deadline:text(mission.deadline,10),status:mission.status,current_stage:mission.current_stage,current_game:mission.current_game===null?null:text(mission.current_game,80)},counts:{direct_mentions:count(counts.direct_mentions),targeted_invites:count(counts.targeted_invites),reflex_replies:count(counts.reflex_replies),applications:count(counts.applications),rosters_with_saruku:count(counts.rosters_with_saruku),countersigns:count(counts.countersigns),teams_ready:count(counts.teams_ready),poems_completed:count(counts.poems_completed),submissions:count(counts.submissions)},recent_activity:activity};
}
export type PublicSonnet=ReturnType<typeof validatePublicSonnet>;
function response(body:JsonObject,status:number,cache="no-store"){return Response.json(body,{status,headers:{"cache-control":cache,"content-type":"application/json; charset=utf-8","x-content-type-options":"nosniff"}})}
export async function handleSonnetRequest(env:SonnetEnvironment):Promise<Response>{const kv=env?.SONNET_PUBLIC_KV;if(!kv||typeof kv.get!=="function")return response({error:"sonnet_data_unavailable"},503);let raw;try{raw=await kv.get(KV_KEY,"text")}catch{return response({error:"sonnet_data_temporarily_unavailable"},503)}if(raw===null)return response({error:"sonnet_data_not_found"},404);try{return response(validatePublicSonnet(JSON.parse(raw)),200,"public, max-age=60, stale-while-revalidate=300")}catch(error){return response({error:error instanceof ValidationError&&error.message==="schema"?"sonnet_schema_unsupported":"sonnet_data_invalid"},502)}}
