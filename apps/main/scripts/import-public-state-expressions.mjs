#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const sourcePath = args[0] === "--" ? args[1] : args[0];
if (!sourcePath) {
  throw new Error("Pass the path to the exported public_state.json file.");
}

const snapshotPath = fileURLToPath(new URL("../data/state-demo.json", import.meta.url));
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const projection = JSON.parse(await readFile(resolve(sourcePath), "utf8"));
if (!projection || projection.schema_version !== 1 ||
    typeof projection.generated_at !== "string" ||
    typeof projection.identity?.did !== "string" || !Array.isArray(projection.agents) ||
    "self_image" in projection || "processed_event_ids" in projection) {
  throw new Error("Input is not the exported public State projection.");
}
const expressions = projection.public_expressions;

function requireText(value, name, maxLength) {
  if (typeof value !== "string" || value.length < 1 || value.length > maxLength ||
      value !== value.trim() || /[\r\n\u2028\u2029]/u.test(value)) {
    throw new Error(`Invalid public expression: ${name}`);
  }
  return value;
}

function requireDate(value, name) {
  const parsed = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid public expression date: ${name}`);
  }
  return value;
}

if (!expressions || expressions.schema_version !== 1) {
  throw new Error("Unsupported public_expressions schema.");
}

const hero = expressions.hero_comment;
const mood = expressions.mood_summary;
const interests = expressions.interests;
if (!hero || !mood || !interests) {
  throw new Error("The public projection is missing an expression.");
}

const reflectionDate = requireDate(hero.reflection_date, "hero_comment.reflection_date");
if (mood.reflection_date !== reflectionDate || interests.reflection_date !== reflectionDate) {
  throw new Error("Public expressions come from different Reflection dates.");
}
if (!Array.isArray(interests.items) || interests.items.length > 5) {
  throw new Error("Invalid public interests list.");
}

const labels = interests.items.map((item, index) =>
  requireText(item, `interests.items[${index}]`, 40));
if (new Set(labels.map((item) => item.toLocaleLowerCase("en-US"))).size !== labels.length) {
  throw new Error("Public interests contain duplicate labels.");
}

snapshot.comment = requireText(hero.text, "hero_comment.text", 160);
snapshot.currentState = {
  ...snapshot.currentState,
  asOf: requireDate(mood.mood_date, "mood_summary.mood_date"),
  text: requireText(mood.text, "mood_summary.text", 160),
};
snapshot.interests = labels;
snapshot.publicExpressionsAsOf = reflectionDate;

const temporaryPath = `${snapshotPath}.tmp-${process.pid}`;
await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
await rename(temporaryPath, snapshotPath);

console.log(`Updated the State demo expressions from Reflection ${reflectionDate}.`);
