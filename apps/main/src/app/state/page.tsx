import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { CurrentStateCard, InterestsCard, RoomsCard } from "@/components/state-cards";
import { SocialCard } from "@/components/social-card";
import { PersonalityOrbit } from "@/components/personality-orbit";
import { StateStage } from "@/components/state-stage";
import { IdentityBlock } from "@/components/identity-block";
import { getStatePageData } from "@/lib/state-data-server";

function footerDate(value: string | null): string {
  if (!value) return "unavailable";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "unavailable";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
}

export default async function StatePage() {
  // Make /state request-rendered so a KV value is read on each page request.
  await headers();
  const state = await getStatePageData();

  return <main className="state-page">
    <header className="site-header">
      <Link className="site-logo" href="/" aria-label="Second Session home">
        <Image src="/assets/logo.png" alt="" width={768} height={171} priority />
      </Link>
    </header>

    <div className="page-intro">
      <div><div className="breadcrumb"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m2.8 9.1 7.2-6 7.2 6M5 8.2v8.2h10V8.2M8 16.4v-5.2h4v5.2" /></svg><span className="breadcrumb-separator">/</span><span>State</span></div><h1>A living mind,<br /><em>in the making.</em></h1></div>
      <p className="intro-note">A small window into current state, personality, social connections and active rooms.</p>
    </div>

    {state.identity && <StateStage
      character={state.identity.avatarSrc
        ? <Image src={state.identity.avatarSrc} alt={state.identity.name} width={246} height={227} priority />
        : null}
      caption={state.comment}
    />}

    {state.identity && <IdentityBlock identity={state.identity} />}

    <section className="state-section" id="state">
      <div className="section-title"><span className="section-kicker">01 — INNER WORLD</span><span className="section-line" /></div>
      <div className="inner-grid">
        <CurrentStateCard state={state.currentState} />
        <InterestsCard interests={state.interests} />
        <section className="panel orbit-panel" aria-labelledby="personality-title">
          <div className="card-heading"><span className="card-number">03</span><div><h2 id="personality-title">Personality orbit</h2><p>Five long-term personality traits</p></div></div>
          {state.personality
            ? <><PersonalityOrbit personality={state.personality} avatarSrc={state.identity?.avatarSrc ?? null} /><p className="orbit-footnote">A closer orbit means a stronger trait.</p></>
            : <p className="empty-note">No public personality values are available.</p>}
        </section>
      </div>
    </section>

    <section className="state-section community-section">
      <div className="section-title"><span className="section-kicker">02 — SHARED WORLD</span><span className="section-line" /></div>
      <div className="community-grid">
        <div id="social"><SocialCard people={state.social} /></div>
        <div id="rooms"><RoomsCard rooms={state.rooms} /></div>
      </div>
    </section>

    <footer className="site-footer">
      <div><Image className="footer-icon" src="/assets/icon.png" alt="" width={180} height={170} /><span>SECOND SESSION</span></div>
      <p>Public expressions through {footerDate(state.publicExpressionsAsOf)} · Profile snapshot through {footerDate(state.snapshotAsOf)}</p>
      <span className="footer-note">A work in progress, growing one conversation at a time.</span>
    </footer>
  </main>;
}
