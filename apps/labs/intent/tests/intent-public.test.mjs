import assert from "node:assert/strict";
import test from "node:test";

import {
  AREAS,
  KV_KEY,
  handleIntentRequest,
  validatePublicIntent,
} from "../functions/_lib/intent-public.mjs";

function validDocument() {
  return {
    schema_version: 1,
    generated_at: "2026-09-08T00:00:00Z",
    reviewed_at: "2026-09-07T11:00:00Z",
    overall_status: "feedback",
    summary: "Public review summary",
    areas: AREAS.map((area) => ({
      area,
      status: "healthy",
      summary: `Public summary for ${area}`,
    })),
    item_changes: [
      {
        action: "open",
        area: "agency",
        confidence: "medium",
        summary: "Public item summary",
      },
    ],
  };
}

function bindingFor(value) {
  return {
    calls: [],
    async get(key, type) {
      this.calls.push([key, type]);
      return value;
    },
  };
}

test("valid public schema is returned from the fixed KV key", async () => {
  const document = validDocument();
  const binding = bindingFor(JSON.stringify(document));
  const response = await handleIntentRequest({ INTENT_PUBLIC_KV: binding });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), document);
  assert.deepEqual(binding.calls, [[KV_KEY, "text"]]);
});

test("missing KV value returns a safe 404", async () => {
  const response = await handleIntentRequest({ INTENT_PUBLIC_KV: bindingFor(null) });
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "intent_data_not_found" });
});

test("malformed JSON returns a safe 502", async () => {
  const response = await handleIntentRequest({ INTENT_PUBLIC_KV: bindingFor("{not-json") });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "intent_data_invalid" });
});

test("unsupported schema version returns a safe 502", async () => {
  const document = validDocument();
  document.schema_version = 2;
  const response = await handleIntentRequest({
    INTENT_PUBLIC_KV: bindingFor(JSON.stringify(document)),
  });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "intent_schema_unsupported" });
});

test("unknown fields are removed at every published level", async () => {
  const document = validDocument();
  document.private_path = "/private/runtime/path";
  document.secret = "do-not-return";
  document.areas[0].evidence_refs = ["private:evidence"];
  document.item_changes[0].item_id = "private-item-id";
  document.item_changes[0].token = "do-not-return";
  const validated = validatePublicIntent(document);
  const serialized = JSON.stringify(validated);
  for (const forbidden of [
    "private_path",
    "secret",
    "evidence_refs",
    "item_id",
    "token",
    "do-not-return",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("missing binding returns a safe 503", async () => {
  const response = await handleIntentRequest({});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "intent_data_unavailable" });
});

test("KV read failure returns a safe 503 without provider details", async () => {
  const response = await handleIntentRequest({
    INTENT_PUBLIC_KV: {
      async get() {
        throw new Error("sensitive provider detail");
      },
    },
  });
  assert.equal(response.status, 503);
  const body = await response.text();
  assert.equal(body.includes("sensitive provider detail"), false);
  assert.deepEqual(JSON.parse(body), { error: "intent_data_temporarily_unavailable" });
});
