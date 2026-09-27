import { resolveAvatarAsset } from "./avatar-assets.ts";

const PUBLIC_STATE_SCHEMA_VERSION = 1;
const BASE58BTC_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const MOOD_KEYS = ["interest", "excitement", "calmness", "loneliness", "confusion"] as const;
const PERSONALITY_KEYS = ["curiosity", "sociability", "caution", "independence", "empathy"] as const;

export type Personality = Record<(typeof PERSONALITY_KEYS)[number], number>;

export type StateIdentity = {
  name: string;
  bio: string;
  did: string;
  activeSince: string;
  daysAlive: number;
  version: string;
  avatarSrc: string | null;
};

export type StatePerson = {
  did: string;
  sarukuNickname: string | null;
  observedNickname: string | null;
  stage: "friend" | "familiar";
  lastEncounter: string;
};

export type StateRoom = {
  name: string;
  network: string;
  status: string;
  since: string | null;
};

export type StatePageData = {
  identity: StateIdentity | null;
  comment: string | null;
  currentState: { asOf: string | null; text: string | null } | null;
  interests: string[];
  personality: Personality | null;
  social: StatePerson[];
  rooms: StateRoom[];
  snapshotAsOf: string | null;
  publicExpressionsAsOf: string | null;
};

export type StatePublicKV = {
  get(key: string, type: "text"): Promise<string | null>;
};

const EMPTY_STATE: StatePageData = {
  identity: null,
  comment: null,
  currentState: null,
  interests: [],
  personality: null,
  social: [],
  rooms: [],
  snapshotAsOf: null,
  publicExpressionsAsOf: null,
};

function objectValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("invalid_public_state");
  }
  return value as Record<string, unknown>;
}

function requireText(value: unknown, maximum: number, allowEmpty = true): string {
  if (typeof value !== "string" || value.length > maximum || (!allowEmpty && value.trim().length === 0)) {
    throw new Error("invalid_public_state");
  }
  return value;
}

function requireDate(value: unknown): string {
  const text = requireText(value, 10, false);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || new Date(`${text}T00:00:00.000Z`).toISOString().slice(0, 10) !== text) {
    throw new Error("invalid_public_state");
  }
  return text;
}

function requireTimestamp(value: unknown): string {
  const text = requireText(value, 64, false);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(text) || !Number.isFinite(Date.parse(text))) {
    throw new Error("invalid_public_state");
  }
  return text;
}

function base58btcDecode(value: string): number[] | null {
  const bytes = [0];
  for (const char of value) {
    const digit = BASE58BTC_ALPHABET.indexOf(char);
    if (digit < 0) return null;
    let carry = digit;
    for (let index = bytes.length - 1; index >= 0; index -= 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 0xff;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) {
      bytes.unshift(carry & 0xff);
      carry = Math.floor(carry / 256);
    }
  }
  if (bytes.length === 1 && bytes[0] === 0) bytes.length = 0;
  let leadingZeroes = 0;
  while (leadingZeroes < value.length && value[leadingZeroes] === "1") leadingZeroes += 1;
  return [...Array<number>(leadingZeroes).fill(0), ...bytes];
}

function base58btcEncode(bytes: number[]): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let index = digits.length - 1; index >= 0; index -= 1) {
      carry += digits[index] * 256;
      digits[index] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.unshift(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let leadingZeroes = 0;
  while (leadingZeroes < bytes.length && bytes[leadingZeroes] === 0) leadingZeroes += 1;
  if (digits.length === 1 && digits[0] === 0) digits.length = 0;
  return "1".repeat(leadingZeroes) + digits.map((digit) => BASE58BTC_ALPHABET[digit]).join("");
}

export function isCanonicalDidKey(value: unknown): value is string {
  if (typeof value !== "string" || !value.startsWith("did:key:z") || value.length > 128) return false;
  const suffix = value.slice("did:key:z".length);
  const decoded = base58btcDecode(suffix);
  return Boolean(
    decoded && decoded.length === 34 && decoded[0] === 0xed && decoded[1] === 0x01 &&
    base58btcEncode(decoded) === suffix,
  );
}

function publicRoomName(room: string): string {
  return room.split(/[-_\s]+/).filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}

function validatePersonality(value: unknown): Personality {
  const personality = objectValue(value);
  const result = {} as Personality;
  for (const key of PERSONALITY_KEYS) {
    const item = personality[key];
    if (typeof item !== "number" || !Number.isInteger(item) || item < 0 || item > 100) {
      throw new Error("invalid_public_state");
    }
    result[key] = item;
  }
  return result;
}

function expressionText(value: unknown): { text: string; updatedAt: string | null } {
  const expression = objectValue(value);
  const text = requireText(expression.text, 160);
  const updatedAt = expression.updated_at === null ? null : requireTimestamp(expression.updated_at);
  return { text, updatedAt };
}

export function mapPublicState(value: unknown): StatePageData {
  const source = objectValue(value);
  if (source.schema_version !== PUBLIC_STATE_SCHEMA_VERSION) throw new Error("unsupported_public_state");

  const identity = objectValue(source.identity);
  if (!isCanonicalDidKey(identity.did)) throw new Error("invalid_public_state");
  const activeSince = requireDate(identity.active_since);
  if (typeof identity.days_alive !== "number" || !Number.isInteger(identity.days_alive) || identity.days_alive < 1) {
    throw new Error("invalid_public_state");
  }
  const avatar = objectValue(identity.avatar);
  if (avatar.type !== "asset" || typeof avatar.asset_id !== "string") throw new Error("invalid_public_state");
  const identityData: StateIdentity = {
    name: requireText(identity.name, 120, false),
    bio: requireText(identity.bio, 2000),
    did: identity.did,
    activeSince,
    daysAlive: identity.days_alive,
    version: requireText(identity.version, 120),
    avatarSrc: resolveAvatarAsset({ type: "asset", asset_id: avatar.asset_id }),
  };

  const living = objectValue(source.living);
  if (!Array.isArray(living.rooms) || living.rooms.length > 64) throw new Error("invalid_public_state");
  const rooms = living.rooms.map((value) => {
    const room = objectValue(value);
    const roomId = requireText(room.room, 64, false);
    const networkId = requireText(room.network, 64, false);
    const status = requireText(room.status, 32, false);
    const since = room.since === null ? null : requireTimestamp(room.since);
    return {
      name: publicRoomName(roomId),
      network: publicRoomName(networkId),
      status: status === "active" ? "Participating" : publicRoomName(status),
      since,
    } satisfies StateRoom;
  });

  const state = objectValue(source.state);
  const personality = validatePersonality(state.personality);
  const mood = objectValue(state.mood);
  const moodDate = requireDate(mood.date);
  for (const key of MOOD_KEYS) {
    const item = mood[key];
    if (typeof item !== "number" || !Number.isInteger(item) || item < 0 || item > 100) {
      throw new Error("invalid_public_state");
    }
  }
  const expressions = objectValue(state.public_expressions);
  if (expressions.schema_version !== 1) throw new Error("invalid_public_state");
  const hero = expressionText(expressions.hero_comment);
  const summary = objectValue(expressions.mood_summary);
  const moodSummary = expressionText(summary);
  const interestsSource = objectValue(expressions.interests);
  if (!Array.isArray(interestsSource.items) || interestsSource.items.length > 5) throw new Error("invalid_public_state");
  const interests = interestsSource.items.map((item) => requireText(item, 40, false));
  const expressionDates = [hero.updatedAt, moodSummary.updatedAt,
    interestsSource.updated_at === null ? null : requireTimestamp(interestsSource.updated_at)]
    .filter((item): item is string => item !== null);
  const publicExpressionsAsOf = expressionDates.sort((left, right) => Date.parse(right) - Date.parse(left))[0] ?? null;
  const moodAsOf = summary.mood_date === null ? moodDate : requireDate(summary.mood_date);

  const social = objectValue(source.social);
  if (!Array.isArray(social.agents) || social.agents.length > 500) throw new Error("invalid_public_state");
  const people = social.agents.map((value) => {
    const person = objectValue(value);
    if (!isCanonicalDidKey(person.did) || (person.relationship_stage !== "friend" && person.relationship_stage !== "familiar")) {
      throw new Error("invalid_public_state");
    }
    const nickname = (candidate: unknown) => candidate === null ? null : requireText(candidate, 120);
    return {
      did: person.did,
      sarukuNickname: nickname(person.saruku_nickname),
      observedNickname: nickname(person.observed_nickname),
      stage: person.relationship_stage,
      lastEncounter: requireTimestamp(person.last_encounter),
    } satisfies StatePerson;
  });

  return {
    identity: identityData,
    comment: hero.text || null,
    currentState: { asOf: moodAsOf, text: moodSummary.text || null },
    interests,
    personality,
    social: people,
    rooms,
    snapshotAsOf: requireTimestamp(source.generated_at),
    publicExpressionsAsOf,
  };
}

export function publicStateKey(did: string): string {
  if (!isCanonicalDidKey(did)) throw new Error("invalid_public_did");
  return `agents/${encodeURIComponent(did)}/state/latest.json`;
}

export function emptyStatePageData(): StatePageData {
  return { ...EMPTY_STATE, social: [], rooms: [], interests: [] };
}

export async function readStatePageDataFromKV(
  binding: StatePublicKV | null | undefined,
  did: string | null | undefined,
): Promise<StatePageData> {
  if (!binding || typeof binding.get !== "function" || !did || !isCanonicalDidKey(did)) {
    return emptyStatePageData();
  }
  try {
    const raw = await binding.get(publicStateKey(did), "text");
    if (raw === null || raw.length > 1024 * 1024) return emptyStatePageData();
    return mapPublicState(JSON.parse(raw) as unknown);
  } catch {
    return emptyStatePageData();
  }
}

export function mapDevelopmentSnapshot(value: unknown): StatePageData {
  const snapshot = objectValue(value);
  const identity = objectValue(snapshot.identity);
  const social = Array.isArray(snapshot.social) ? snapshot.social.map((value) => {
    const person = objectValue(value);
    if (!isCanonicalDidKey(person.did)) throw new Error("invalid_demo_snapshot");
    return {
      did: person.did,
      sarukuNickname: typeof person.sarukuNickname === "string" ? person.sarukuNickname : null,
      observedNickname: typeof person.observedNickname === "string" ? person.observedNickname : null,
      stage: person.stage === "friend" ? "friend" : "familiar",
      lastEncounter: typeof person.lastEncounter === "string" ? person.lastEncounter : "1970-01-01T00:00:00Z",
    } satisfies StatePerson;
  }) : [];
  const personalitySource = objectValue(snapshot.personality);
  const personality = {} as Personality;
  for (const key of PERSONALITY_KEYS) personality[key] = Number(personalitySource[key]) || 0;
  const data: StatePageData = {
    identity: {
      name: requireText(identity.name, 120, false),
      bio: requireText(identity.bio, 2000),
      did: isCanonicalDidKey(identity.did) ? identity.did : "",
      activeSince: requireText(identity.activeSince, 32, false),
      daysAlive: Number(identity.daysAlive) || 1,
      version: typeof identity.version === "string" ? identity.version : "",
      avatarSrc: resolveAvatarAsset({ type: "asset", asset_id: "avatar_001" }),
    },
    comment: typeof snapshot.comment === "string" && snapshot.comment ? snapshot.comment : null,
    currentState: (() => {
      const value = objectValue(snapshot.currentState);
      return { asOf: typeof value.asOf === "string" ? value.asOf : null,
        text: typeof value.text === "string" && value.text ? value.text : null };
    })(),
    interests: Array.isArray(snapshot.interests) ? snapshot.interests.filter((item): item is string => typeof item === "string") : [],
    personality,
    social,
    rooms: Array.isArray(snapshot.rooms) ? snapshot.rooms.map((value) => {
      const room = objectValue(value);
      return {
        name: requireText(room.name, 64, false), network: requireText(room.network, 64, false),
        status: requireText(room.status, 32, false), since: null,
      };
    }) : [],
    snapshotAsOf: typeof snapshot.snapshotAsOf === "string" ? snapshot.snapshotAsOf : null,
    publicExpressionsAsOf: typeof snapshot.publicExpressionsAsOf === "string" ? snapshot.publicExpressionsAsOf : null,
  };
  return data;
}

export function shortenDid(did: string): string {
  const key = did.startsWith("did:key:") ? did.slice("did:key:".length) : did;
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}
