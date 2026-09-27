import assert from "node:assert/strict";
import test from "node:test";

import {
  isCanonicalDidKey,
  mapPublicState,
  publicStateKey,
  readStatePageDataFromKV,
  shortenDid,
} from "../src/lib/state-data.ts";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58btcEncode(bytes) {
  let number = BigInt(`0x${Buffer.from(bytes).toString("hex")}`);
  let encoded = "";
  while (number > 0n) {
    const remainder = Number(number % 58n);
    number /= 58n;
    encoded = ALPHABET[remainder] + encoded;
  }
  let leadingZeroes = 0;
  while (leadingZeroes < bytes.length && bytes[leadingZeroes] === 0) leadingZeroes += 1;
  return "1".repeat(leadingZeroes) + encoded;
}

const did = `did:key:z${base58btcEncode([0xed, 0x01, ...Array.from({ length: 32 }, (_, i) => i + 1)])}`;

function publicState() {
  return {
    schema_version: 1,
    generated_at: "2026-09-27T12:00:00Z",
    identity: {
      did,
      name: "Saruku",
      bio: "A public profile",
      active_since: "2026-08-30",
      days_alive: 29,
      avatar: { type: "asset", asset_id: "avatar_001" },
      version: "state-growth-v0.1",
    },
    living: {
      rooms: [{ room: "builders", network: "technocore", status: "active", since: null }],
    },
    state: {
      mood: {
        date: "2026-09-27", interest: 70, excitement: 45, calmness: 60,
        loneliness: 10, confusion: 20,
      },
      personality: {
        curiosity: 80, sociability: 60, caution: 30, independence: 65, empathy: 65,
      },
      public_expressions: {
        schema_version: 1,
        hero_comment: {
          text: "I keep learning.", updated_at: "2026-09-27T11:00:00Z",
          reflection_date: "2026-09-27",
        },
        mood_summary: {
          text: "I feel curious today.", updated_at: "2026-09-27T11:00:00Z",
          reflection_date: "2026-09-27", mood_date: "2026-09-27",
        },
        interests: {
          items: ["How trust develops"], updated_at: "2026-09-27T11:00:00Z",
          reflection_date: "2026-09-27",
        },
      },
    },
    social: {
      agents: [{
        did, saruku_nickname: "Builder friend", observed_nickname: null,
        relationship_stage: "friend", last_encounter: "2026-09-26T10:00:00Z",
      }],
    },
  };
}

function bindingFor(value) {
  return {
    keys: [],
    async get(key, type) {
      this.keys.push([key, type]);
      return value;
    },
  };
}

test("public DID validation and key encoding use the canonical DID directly", () => {
  assert.equal(isCanonicalDidKey(did), true);
  assert.equal(isCanonicalDidKey("did:key:z6MkOther"), false);
  assert.equal(publicStateKey(did), `agents/${encodeURIComponent(did)}/state/latest.json`);
  const suffix = did.slice("did:key:".length);
  assert.equal(shortenDid(did), `${suffix.slice(0, 8)}…${suffix.slice(-4)}`);
});

test("public_state maps identity, expressions, social, and living rooms", () => {
  const mapped = mapPublicState(publicState());
  assert.equal(mapped.identity.name, "Saruku");
  assert.equal(mapped.identity.activeSince, "2026-08-30");
  assert.equal(mapped.identity.avatarSrc, "/avatars/avatar_001.jpg");
  assert.equal(mapped.comment, "I keep learning.");
  assert.equal(mapped.currentState.text, "I feel curious today.");
  assert.deepEqual(mapped.interests, ["How trust develops"]);
  assert.equal(mapped.personality.curiosity, 80);
  assert.equal(mapped.social[0].did, did);
  assert.equal(mapped.social[0].sarukuNickname, "Builder friend");
  assert.equal(mapped.rooms[0].name, "Builders");
  assert.equal(mapped.rooms[0].status, "Participating");
  assert.equal(Object.hasOwn(mapped, "private_runtime_note"), false);
});

test("KV mapping requests the DID-keyed latest state value", async () => {
  const binding = bindingFor(JSON.stringify(publicState()));
  const mapped = await readStatePageDataFromKV(binding, did);
  assert.equal(mapped.comment, "I keep learning.");
  assert.deepEqual(binding.keys, [[publicStateKey(did), "text"]]);
});

test("missing binding, missing key, and malformed KV return empty data without snapshot text", async () => {
  for (const mapped of [
    await readStatePageDataFromKV(undefined, did),
    await readStatePageDataFromKV(bindingFor(null), did),
    await readStatePageDataFromKV(bindingFor("{not-json"), did),
    await readStatePageDataFromKV(bindingFor(JSON.stringify({ ...publicState(), schema_version: 99 })), did),
  ]) {
    assert.equal(mapped.identity, null);
    assert.equal(mapped.comment, null);
    assert.deepEqual(mapped.interests, []);
    assert.deepEqual(mapped.social, []);
    assert.deepEqual(mapped.rooms, []);
  }
});

test("malformed or subjective relationship fields do not become UI data", () => {
  const source = publicState();
  source.social.agents[0].private_impression = "private value";
  const mapped = mapPublicState(source);
  assert.equal(JSON.stringify(mapped).includes("private value"), false);
  assert.equal(Object.hasOwn(mapped.social[0], "private_impression"), false);
});
