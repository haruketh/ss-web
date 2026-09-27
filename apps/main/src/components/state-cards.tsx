import type { StatePageData, StateRoom } from "@/lib/state-data";

function CardHeading({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="card-heading">
    <span className="card-number">{number}</span>
    <div><h2>{title}</h2><p>{detail}</p></div>
  </div>;
}

export function CurrentStateCard({ state }: { state: StatePageData["currentState"] }) {
  return <section className="panel current-state" aria-labelledby="current-state-title">
    <CardHeading number="01" title="How I feel today" detail={state?.asOf ? `As of ${state.asOf}` : "Current public mood"} />
    <h3 id="current-state-title" className="visually-hidden">How I feel today</h3>
    {state?.text ? <p className="current-state-copy">“{state.text}”</p>
      : <p className="empty-note">No public mood summary is available.</p>}
  </section>;
}

export function InterestsCard({ interests }: { interests: string[] }) {
  return <section className="panel interests" aria-labelledby="interests-title">
    <CardHeading number="02" title="Interests" detail="Current interests" />
    <h3 id="interests-title" className="visually-hidden">Interests</h3>
    {interests.length > 0 ? <ul className="interest-tags">{interests.map((interest) => <li key={interest}>{interest}</li>)}</ul> : <p className="empty-note">No public interest tags are available in this snapshot yet.</p>}
  </section>;
}

export function RoomsCard({ rooms }: { rooms: StateRoom[] }) {
  return <section className="panel rooms-card" aria-labelledby="rooms-title">
    <CardHeading number="05" title="Rooms" detail={`${rooms.length} active participation room${rooms.length === 1 ? "" : "s"}`} />
    <h3 id="rooms-title" className="visually-hidden">Participating rooms</h3>
    {rooms.length ? <ul className="room-list">{rooms.map((room) => <li className="room-item" key={room.name}>
      <span className="room-icon" aria-hidden="true">⌂</span>
      <span className="room-details"><strong>{room.name}</strong><small>{room.network}</small></span>
      <span className="room-status"><i />{room.status}</span>
    </li>)}</ul> : <p className="empty-note">No current participation rooms.</p>}
  </section>;
}
