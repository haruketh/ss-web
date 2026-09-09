import type { ReactNode } from "react";
import type { PublicIntent } from "../server/intent-public";
import { AREA_DESCRIPTIONS, AREA_LABELS, STATUS_LABELS, ACTION_LABELS, reviewedLabel } from "../lib/intent-display";

export function Thought({ children, size = "regular" }: { children: ReactNode; size?: string }) {
  return <div className={`thought thought--${size}`}><p>{children}</p></div>;
}

export function IntentFrame({ children }: { children: ReactNode }) {
  return <main className="intent-page">
    <header className="page-heading"><p className="breadcrumb">SECOND SESSION / LABS</p><h1>INTENT</h1></header>
    <div className="saruku entrance">
      {/* Local artwork requires no external image service. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/saruku-intent.png" width="88" height="88" alt="" />
      <p>Saruku</p>
    </div>
    {children}
  </main>;
}

export function IntentView({ document }: { document: PublicIntent | null }) {
  if (!document) return <IntentFrame><div className="summary entrance"><Thought size="summary">Saruku’s thoughts are unavailable right now.</Thought></div></IntentFrame>;
  return <IntentFrame>
    <div className="summary entrance"><Thought size="summary">{document.summary}</Thought></div>
    <section className="areas entrance" aria-label="Intent areas">
      {Object.entries(AREA_LABELS).map(([key, label]) => {
        const area = document.areas.find((entry) => entry.area === key)!;
        return <section className="area" key={key} aria-labelledby={`area-${key}`}>
          <header className="area-heading">
            <h2 id={`area-${key}`}>{label}</h2>
            <p>{AREA_DESCRIPTIONS[key]}</p>
            <span className={`status status--${area.status}`}><i aria-hidden="true" />{STATUS_LABELS[area.status]}</span>
          </header>
          <Thought>{area.summary}</Thought>
        </section>;
      })}
    </section>
    {document.item_changes.length > 0 && <section className="on-my-mind entrance" aria-labelledby="on-my-mind">
      <h2 id="on-my-mind">Still on my mind</h2>
      {document.item_changes.map((item, index) => <section className="mind-item" key={index}>
        <div className="thought-heading"><h3>{AREA_LABELS[item.area]}</h3><span className="action">{ACTION_LABELS[item.action]}</span></div>
        <Thought size="small">{item.summary}</Thought>
      </section>)}
    </section>}
    <footer className="reviewed"><time dateTime={document.reviewed_at}>{reviewedLabel(document.reviewed_at)}</time></footer>
  </IntentFrame>;
}
