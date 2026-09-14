import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";
import ts from "typescript";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {validatePublicSonnet} from "../src/server/sonnet-public.ts";
const require=createRequire(import.meta.url);const source=readFileSync(new URL("../src/components/sonnet-view.tsx",import.meta.url),"utf8");const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText.replace('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve("react/jsx-runtime")).href)).replace('"react"',JSON.stringify(pathToFileURL(require.resolve("react")).href)).replace('"../server/sonnet-public"',JSON.stringify(new URL("../src/server/sonnet-public.ts",import.meta.url).href));const {SonnetView}=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
function fixture(status="seeking_team",stage="LOOKING"){return validatePublicSonnet({schema_version:1,checked_at:"2026-09-14T12:00:00Z",tracking_started_at:"2026-09-14T10:00:00Z",mission:{title:"SONNET MISSION",goal:"Complete and submit one poem by Sep 18.",deadline:"2026-09-18",status,current_stage:stage,current_game:status==="forming_team"?"g":null},counts:{direct_mentions:1,targeted_invites:2,reflex_replies:1,applications:1,rosters_with_saruku:1,countersigns:0,teams_ready:0,poems_completed:0,submissions:0},recent_activity:[{id:"evt_1",at:"2026-09-14T11:00:00Z",type:"team_invitation",title:"Team invitation",detail:"Saruku received a direct team invitation.",game_id:"g"}]})}
const render=document=>renderToStaticMarkup(createElement(SonnetView,{initial:document}));
test("renders empty seeking state",()=>{const html=render(fixture());assert.match(html,/Looking for a team/);assert.match(html,/Recent activity/)});
test("renders active formation timeline",()=>{const html=render(fixture("forming_team","ROSTER"));assert.match(html,/Forming a team/);assert.match(html,/Team invitation/);assert.match(html,/Team · g/)});
test("renders submitted terminal state",()=>{const html=render(fixture("submitted","SUBMITTED"));assert.match(html,/Submitted/)});
test("polling preserves last data on failure",()=>{assert.match(source,/setInterval\(refresh,\s*60000\)/);assert.match(source,/catch\{if\(live\)setStale\(true\)\}/);assert.doesNotMatch(source,/catch[^}]*setDocument\(null\)/)});
