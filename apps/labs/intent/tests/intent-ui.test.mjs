import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { validatePublicIntent, AREAS } from '../src/server/intent-public.ts';
import { AREA_DESCRIPTIONS, AREA_LABELS, STATUS_LABELS, ACTION_LABELS, reviewedLabel } from '../src/lib/intent-display.ts';
import { THEME_SCRIPT } from '../src/lib/theme.ts';

// Compile the real presentational component in memory; no fixtures or build
// artifacts are written to runtime state or the repository.
const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/components/intent-view.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
  .replace('"react/jsx-runtime"', JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href))
  .replace('"../lib/intent-display"', JSON.stringify(new URL('../src/lib/intent-display.ts', import.meta.url).href));
const { IntentView } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
function fixture() {
  return { schema_version: 1, generated_at: '2026-09-09T05:06:07Z', reviewed_at: '2026-09-08T11:00:59Z', overall_status: 'feedback', summary: 'An unchanged thought: 日本語 & <script>not code</script>.',
    areas: [...AREAS].reverse().map(area => ({ area, status: 'healthy', summary: `Thought about ${area}.` })),
    item_changes: [] };
}
const render = document => renderToStaticMarkup(createElement(IntentView, { document }));
test('all ten headings follow the fixed display order, not API order', () => {
  const html = render(validatePublicIntent(fixture()));
  const ids = [...html.matchAll(/<h2 id="area-([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, [...AREAS]);
  assert.equal(Object.keys(AREA_LABELS).length, 10);
  assert.equal(Object.keys(AREA_DESCRIPTIONS).length, 10);
});
test('each area renders title, fixed description, status, then public thought', () => {
  const html = render(validatePublicIntent(fixture()));
  for (const area of AREAS) {
    const title = AREA_LABELS[area];
    const description = AREA_DESCRIPTIONS[area];
    const summary = `Thought about ${area}.`;
    assert.ok(html.includes(description));
    assert.ok(html.indexOf(title) < html.indexOf(description));
    assert.ok(html.indexOf(description) < html.indexOf(summary));
  }
  const agencyDescription = AREA_DESCRIPTIONS.agency;
  const agencySummary = 'Thought about agency.';
  const agencyStart = html.indexOf(agencyDescription);
  assert.ok(agencyStart < html.indexOf('Healthy', agencyStart));
  assert.ok(html.indexOf('Healthy', agencyStart) < html.indexOf(agencySummary));
  assert.ok(html.includes('Can I make my own choices, act, and speak for myself?'));
  assert.ok(html.includes('Do I simply need more experience or information before I can judge?'));
});
test('status and source action labels are explicit', () => {
  assert.deepEqual(STATUS_LABELS, { healthy: 'Healthy', concern: 'Concern', not_enough_evidence: 'Not enough evidence' });
  assert.deepEqual(ACTION_LABELS, { open: 'New concern', keep_open: 'Still watching', resolve: 'Resolved' });
});
test('empty items hide the section; actions preserve input order without confidence', () => {
  const document = fixture();
  assert.ok(!render(validatePublicIntent(document)).includes('Still on my mind'));
  document.item_changes = ['keep_open','open','resolve'].map(action => ({ action, area: 'social_life', confidence: 'high', summary: action + ' thought' }));
  const html = render(validatePublicIntent(document));
  assert.ok(html.includes('Still on my mind'));
  assert.ok(html.indexOf('Still watching') < html.indexOf('New concern'));
  assert.ok(html.includes('Resolved'));
  assert.ok(!html.includes('high'));
});
test('only reviewed time is shown in JST to the minute; body is escaped, not rewritten', () => {
  const html = render(validatePublicIntent(fixture()));
  assert.equal(reviewedLabel(fixture().reviewed_at), 'Reviewed Sep 8, 2026 · 20:00 JST');
  assert.ok(html.includes('An unchanged thought: 日本語 &amp; &lt;script&gt;not code&lt;/script&gt;.'));
  assert.ok(!html.includes('feedback'));
  assert.ok(!html.includes(fixture().generated_at));
});
test('private fields never render, and error state contains only friendly text', () => {
  const document = fixture();
  document.review_id = 'PRIVATE_SENTINEL';
  document.areas[0].evidence_refs = ['PRIVATE_SENTINEL'];
  assert.ok(!render(validatePublicIntent(document)).includes('PRIVATE_SENTINEL'));
  const html = render(null);
  assert.ok(html.includes('Saruku’s thoughts are unavailable right now.'));
  assert.ok(!html.includes('intent_data_'));
});
test('prepaint script respects local boundaries and schedules no data polling', () => {
  for (const [hour, expected] of [[0,'night'],[5,'night'],[6,'day'],[17,'day'],[18,'night'],[23,'night']]) {
    const document = { documentElement: { dataset: {} }, addEventListener() {} };
    const now = new Date(2026, 8, 8, hour, 0, 0);
    class Clock extends Date { constructor(value) { super(value === undefined ? now : value); } }
    vm.runInNewContext(THEME_SCRIPT, { document, Date: Clock, clearTimeout() {}, setTimeout() {}, requestAnimationFrame(fn) { fn(); } });
    assert.equal(document.documentElement.dataset.theme, expected);
  }
  assert.doesNotMatch(THEME_SCRIPT, /fetch\(|setInterval|XMLHttpRequest/);
  const page = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /force-dynamic/);
  assert.doesNotMatch(page, /fetch\(|use client/);
});
