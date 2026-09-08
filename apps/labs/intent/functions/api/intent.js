import { handleIntentRequest } from "../_lib/intent-public.mjs";

export async function onRequestGet(context) {
  return handleIntentRequest(context.env);
}
