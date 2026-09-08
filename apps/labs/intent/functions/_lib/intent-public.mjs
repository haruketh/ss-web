const KV_KEY = "intent/latest.json";
const PUBLIC_SCHEMA_VERSION = 1;

const AREAS = [
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
];

const AREA_SET = new Set(AREAS);
const AREA_STATUSES = new Set(["concern", "healthy", "not_enough_evidence"]);
const OVERALL_STATUSES = new Set(["feedback", "no_change", "not_enough_evidence"]);
const ITEM_ACTIONS = new Set(["open", "keep_open", "resolve"]);
const CONFIDENCE = new Set(["low", "medium", "high"]);

class PublicIntentValidationError extends Error {}

function requireObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new PublicIntentValidationError("invalid_object");
  }
  return value;
}

function requireString(value, maximum, allowEmpty = true) {
  if (
    typeof value !== "string" ||
    value.length > maximum ||
    (!allowEmpty && value.trim().length === 0)
  ) {
    throw new PublicIntentValidationError("invalid_string");
  }
  return value;
}

function requireTimestamp(value) {
  const text = requireString(value, 64, false);
  if (!Number.isFinite(Date.parse(text))) {
    throw new PublicIntentValidationError("invalid_timestamp");
  }
  return text;
}

export function validatePublicIntent(value) {
  const source = requireObject(value);
  if (source.schema_version !== PUBLIC_SCHEMA_VERSION) {
    throw new PublicIntentValidationError("unsupported_schema");
  }
  if (!OVERALL_STATUSES.has(source.overall_status)) {
    throw new PublicIntentValidationError("invalid_overall_status");
  }

  if (!Array.isArray(source.areas) || source.areas.length !== AREAS.length) {
    throw new PublicIntentValidationError("invalid_areas");
  }
  const seenAreas = new Set();
  const areas = source.areas.map((rawArea) => {
    const area = requireObject(rawArea);
    if (
      !AREA_SET.has(area.area) ||
      seenAreas.has(area.area) ||
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
      !ITEM_ACTIONS.has(change.action) ||
      !AREA_SET.has(change.area) ||
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

  // Reconstruct the response from the public allowlist. Unknown source fields
  // are deliberately ignored instead of being forwarded to the browser.
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

function jsonResponse(body, status, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
      "x-content-type-options": "nosniff",
    },
  });
}

export async function handleIntentRequest(env) {
  const binding = env?.INTENT_PUBLIC_KV;
  if (!binding || typeof binding.get !== "function") {
    return jsonResponse({ error: "intent_data_unavailable" }, 503);
  }

  let raw;
  try {
    raw = await binding.get(KV_KEY, "text");
  } catch {
    return jsonResponse({ error: "intent_data_temporarily_unavailable" }, 503);
  }
  if (raw === null || raw === undefined) {
    return jsonResponse({ error: "intent_data_not_found" }, 404);
  }
  if (typeof raw !== "string") {
    return jsonResponse({ error: "intent_data_invalid" }, 502);
  }

  let parsed;
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

export { AREAS, KV_KEY, PUBLIC_SCHEMA_VERSION };
