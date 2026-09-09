export const KV_KEY = "intent/latest.json";
export const PUBLIC_SCHEMA_VERSION = 1;

export const AREAS = [
  "agency",
  "social_life",
  "memory_and_continuity",
  "influence_and_growth",
  "world_friction",
  "balance",
  "ineffective_or_hollow_features",
  "loops_and_repetition",
  "internal_discontinuity",
  "not_enough_evidence",
] as const;

const AREA_SET = new Set<string>(AREAS);
const AREA_STATUSES = new Set(["concern", "healthy", "not_enough_evidence"]);
const OVERALL_STATUSES = new Set(["feedback", "no_change", "not_enough_evidence"]);
const ITEM_ACTIONS = new Set(["open", "keep_open", "resolve"]);
const CONFIDENCE = new Set(["low", "medium", "high"]);

type JsonObject = Record<string, unknown>;

export interface IntentKvBinding {
  get(key: string, type: "text"): Promise<string | null>;
}

export interface IntentEnvironment {
  INTENT_PUBLIC_KV?: IntentKvBinding;
}

class PublicIntentValidationError extends Error {}

function requireObject(value: unknown): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new PublicIntentValidationError("invalid_object");
  }
  return value as JsonObject;
}

function requireString(value: unknown, maximum: number, allowEmpty = true): string {
  if (
    typeof value !== "string" ||
    value.length > maximum ||
    (!allowEmpty && value.trim().length === 0)
  ) {
    throw new PublicIntentValidationError("invalid_string");
  }
  return value;
}

function requireTimestamp(value: unknown): string {
  const text = requireString(value, 64, false);
  if (!Number.isFinite(Date.parse(text))) {
    throw new PublicIntentValidationError("invalid_timestamp");
  }
  return text;
}

export function validatePublicIntent(value: unknown) {
  const source = requireObject(value);
  if (source.schema_version !== PUBLIC_SCHEMA_VERSION) {
    throw new PublicIntentValidationError("unsupported_schema");
  }
  if (typeof source.overall_status !== "string" || !OVERALL_STATUSES.has(source.overall_status)) {
    throw new PublicIntentValidationError("invalid_overall_status");
  }

  if (!Array.isArray(source.areas) || source.areas.length !== AREAS.length) {
    throw new PublicIntentValidationError("invalid_areas");
  }
  const seenAreas = new Set<string>();
  const areas = source.areas.map((rawArea) => {
    const area = requireObject(rawArea);
    if (
      typeof area.area !== "string" ||
      !AREA_SET.has(area.area) ||
      seenAreas.has(area.area) ||
      typeof area.status !== "string" ||
      !AREA_STATUSES.has(area.status)
    ) {
      throw new PublicIntentValidationError("invalid_area");
    }
    seenAreas.add(area.area);
    return {
      area: area.area,
      status: area.status,
      summary: requireString(area.summary, 500),
    };
  });
  if (seenAreas.size !== AREAS.length) {
    throw new PublicIntentValidationError("missing_area");
  }

  if (!Array.isArray(source.item_changes) || source.item_changes.length > 10) {
    throw new PublicIntentValidationError("invalid_item_changes");
  }
  const itemChanges = source.item_changes.map((rawChange) => {
    const change = requireObject(rawChange);
    if (
      typeof change.action !== "string" ||
      !ITEM_ACTIONS.has(change.action) ||
      typeof change.area !== "string" ||
      !AREA_SET.has(change.area) ||
      typeof change.confidence !== "string" ||
      !CONFIDENCE.has(change.confidence)
    ) {
      throw new PublicIntentValidationError("invalid_item_change");
    }
    return {
      action: change.action,
      area: change.area,
      confidence: change.confidence,
      summary: requireString(change.summary, 500, false),
    };
  });

  // Reconstruct from the public allowlist. Unknown source fields never reach
  // the response returned to the browser.
  return {
    schema_version: PUBLIC_SCHEMA_VERSION,
    generated_at: requireTimestamp(source.generated_at),
    reviewed_at: requireTimestamp(source.reviewed_at),
    overall_status: source.overall_status,
    summary: requireString(source.summary, 600),
    areas,
    item_changes: itemChanges,
  };
}

export type PublicIntent = ReturnType<typeof validatePublicIntent>;

function jsonResponse(body: JsonObject, status: number, cacheControl = "no-store") {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": cacheControl,
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function handleIntentRequest(env: IntentEnvironment): Promise<Response> {
  const binding = env?.INTENT_PUBLIC_KV;
  if (!binding || typeof binding.get !== "function") {
    return jsonResponse({ error: "intent_data_unavailable" }, 503);
  }

  let raw: string | null;
  try {
    raw = await binding.get(KV_KEY, "text");
  } catch {
    return jsonResponse({ error: "intent_data_temporarily_unavailable" }, 503);
  }
  if (raw === null) {
    return jsonResponse({ error: "intent_data_not_found" }, 404);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: "intent_data_invalid" }, 502);
  }

  let publicIntent;
  try {
    publicIntent = validatePublicIntent(parsed);
  } catch (error) {
    if (error instanceof PublicIntentValidationError && error.message === "unsupported_schema") {
      return jsonResponse({ error: "intent_schema_unsupported" }, 502);
    }
    return jsonResponse({ error: "intent_data_invalid" }, 502);
  }

  return jsonResponse(publicIntent, 200, "public, max-age=60, stale-while-revalidate=300");
}
