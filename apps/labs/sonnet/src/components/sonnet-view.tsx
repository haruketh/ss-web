"use client";
import { useEffect, useState } from "react";
import type { PublicSonnet } from "../server/sonnet-public";
import { STAGES } from "../server/sonnet-public";

const STATUS:Record<string,string>={seeking_team:"Looking for a team",forming_team:"Forming a team",team_ready:"Team ready",writing:"Writing",poem_complete:"Poem complete",submission_pending:"Preparing the submission",submitted:"Submitted",unknown:"Status unavailable"};
const COUNTERS:[keyof PublicSonnet["counts"],string][]=[["targeted_invites","Invitations"],["applications","Applications"],["rosters_with_saruku","Rosters"],["reflex_replies","Replies"],["countersigns","Signatures"],["submissions","Submissions"]];
const DISPLAY_STAGES=["LOOKING","INVITED","APPLIED","ROSTER","SIGNED","TEAM","WRITING","SUBMITTED"] as const;
function jst(value:string){return new Intl.DateTimeFormat("en",{timeZone:"Asia/Tokyo",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value))+" JST"}
export function SonnetView({initial}:{initial:PublicSonnet|null}){
  const [document,setDocument]=useState(initial),[stale,setStale]=useState(false);
  useEffect(()=>{let live=true;const refresh=async()=>{try{const response=await fetch("/api/sonnet",{cache:"no-store"});if(!response.ok)throw new Error();const next=await response.json();if(live){setDocument(next);setStale(false)}}catch{if(live)setStale(true)}};const timer=setInterval(refresh,60000);return()=>{live=false;clearInterval(timer)}},[]);
  if(!document)return <main className="page"><p className="eyebrow">SECOND SESSION / LABS</p><h1>SONNET MISSION</h1><section className="hero"><p>Mission data is temporarily unavailable.</p></section></main>;
  const sourceStage=STAGES.indexOf(document.mission.current_stage as typeof STAGES[number]);
  const current=document.mission.current_stage==="COMPLETE"?6:document.mission.current_stage==="SUBMITTED"?7:sourceStage;
  const writing=document.writing;
  return <main className="page">
    <header><p className="eyebrow">SECOND SESSION / LABS</p><h1>SONNET MISSION</h1><p className="goal">Complete and submit one poem by Sep 18.</p></header>
    <section className="hero" aria-labelledby="current-status"><p className="kicker">Current state</p><h2 id="current-status">{STATUS[document.mission.status]}</h2>{document.mission.current_game&&<p className="game">Team · {document.mission.current_game}</p>}<p className="updated">Updated {jst(document.checked_at)}{stale&&<span> · update unavailable</span>}</p></section>
    {writing&&<section className="writing" aria-labelledby="current-poem"><p className="kicker">{document.mission.current_stage}</p>{document.mission.current_game&&<p className="game">Team · {document.mission.current_game}</p>}<h2 id="current-poem">Current poem</h2><div className="poem">{writing.lines.length?writing.lines.map((line,index)=><p key={index}>{line}</p>):<p className="quiet">The first accepted line is still taking shape.</p>}</div><div className="poem-meta"><span>Line {writing.line_number} of 14</span><span>Version {writing.version}</span>{writing.previous_contributor&&<span>Last contribution · {writing.previous_contributor}</span>}</div><h3>Live activity</h3>{writing.activity.length===0?<p className="quiet">Waiting for the next accepted contribution.</p>:<ol className="live-activity">{writing.activity.slice(0,10).map(item=><li key={item.id}><time dateTime={item.at}>{jst(item.at)}</time><div><strong>{item.title}</strong><p>{item.detail}</p>{item.quote&&<blockquote>“{item.quote}”</blockquote>}</div></li>)}</ol>}</section>}
    <ol className="progress" aria-label="Mission progress">{DISPLAY_STAGES.map((stage,index)=><li className={index<=current?"reached":""} key={stage}><i aria-hidden="true"/><span>{stage}</span></li>)}</ol>
    <section className="counters" aria-label="Mission counters">{COUNTERS.map(([key,label])=><div key={key}><strong>{document.counts[key]}</strong><span>{label}</span></div>)}</section>
    <section className="activity"><h2>Recent activity</h2>{document.recent_activity.length===0?<p className="quiet">Waiting for the next public update.</p>:<ol>{document.recent_activity.slice(0,20).map(item=><li key={item.id}><time dateTime={item.at}>{jst(item.at)}</time><div><h3>{item.title}</h3><p>{item.detail}</p>{item.game_id&&<small>Team · {item.game_id}</small>}{item.quote&&<blockquote>“{item.quote}”</blockquote>}</div></li>)}</ol>}</section>
  </main>
}
