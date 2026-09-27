"use client";

import { useState } from "react";
import type { StatePerson } from "@/lib/state-data";
import { shortenDid } from "@/lib/state-data";
import { CopyDidButton } from "@/components/copy-did-button";

function stagePriority(stage: string) {
  const normalized = stage.toLowerCase();
  if (normalized === "friend") return 0;
  if (normalized === "familiar") return 1;
  return 2;
}

function lastEncounterTime(value: string) {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

export function SocialCard({ people }: { people: StatePerson[] }) {
  const [expanded, setExpanded] = useState(false);
  const sortedPeople = [...people].sort((a, b) =>
    stagePriority(a.stage) - stagePriority(b.stage) ||
    lastEncounterTime(b.lastEncounter) - lastEncounterTime(a.lastEncounter)
  );
  const visiblePeople = expanded ? sortedPeople : sortedPeople.slice(0, 5);
  const hasMore = sortedPeople.length > 5;

  return <section className="panel social-card" aria-labelledby="social-title">
    <div className="card-heading">
      <span className="card-number">04</span>
      <div><h2 id="social-title">Social</h2><p>{`${people.length} ${people.length === 1 ? "connection" : "connections"}`}</p></div>
    </div>
    <ul className="social-list" id="social-people-list">
      {visiblePeople.map((person) => {
        const nickname = person.sarukuNickname || person.observedNickname;
        const didShort = shortenDid(person.did);
        return <li className="social-person" key={person.did}>
          <span className="social-avatar" aria-hidden="true">{(nickname || didShort).slice(0, 1).toUpperCase()}</span>
          <span className="social-person-details">
            <span className="social-name-row">
              <strong>{nickname || didShort}</strong>
              {person.sarukuNickname && <small className="social-provenance">nickname</small>}
            </span>
            <span className="social-did"><span>DID {didShort}</span><CopyDidButton did={person.did} /></span>
          </span>
          <span className="stage-pill">{person.stage}</span>
        </li>;
      })}
    </ul>
    {people.length === 0 && <p className="empty-note">No public social connections are available.</p>}
    {hasMore && <button className="social-toggle" type="button" aria-expanded={expanded} aria-controls="social-people-list" onClick={() => setExpanded(!expanded)}>{expanded ? "Less" : "More"}</button>}
  </section>;
}
