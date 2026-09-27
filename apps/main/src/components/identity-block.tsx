import Image from "next/image";
import type { StateIdentity } from "@/lib/state-data";
import { shortenDid } from "@/lib/state-data";
import { CopyDidButton } from "@/components/copy-did-button";
import { CalendarIcon, DidKeyIcon } from "@/components/ui-icons";

export function IdentityBlock({ identity }: { identity: StateIdentity }) {
  return <section className="identity-block" aria-label="Identity">
    {identity.avatarSrc && <Image className="identity-avatar" src={identity.avatarSrc} alt={identity.name} width={96} height={96} />}
    <div className="identity-info">
      <h2>{identity.name}</h2>
      <p className="identity-bio">{identity.bio}</p>
      <div className="identity-meta-row"><DidKeyIcon /><span>DID <code>{shortenDid(identity.did)}</code></span><CopyDidButton did={identity.did} /></div>
      <div className="identity-meta-row"><CalendarIcon /><span>Active since {identity.activeSince}</span></div>
    </div>
  </section>;
}
