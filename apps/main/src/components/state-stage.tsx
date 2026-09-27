import type { ReactNode } from "react";

export type CharacterMotion = "float" | "breathing" | "drift" | "none";
export type BackgroundEffect = "particles" | "rings" | "waves" | "none";

export type StageConfiguration = {
  characterMotion: CharacterMotion;
  backgroundEffect: BackgroundEffect[];
};

export const STATE_STAGE_CONFIGURATION: StageConfiguration = {
  characterMotion: "float",
  backgroundEffect: ["particles", "rings"],
};

const motionClass: Record<CharacterMotion, string> = {
  float: "stage-character--float",
  breathing: "stage-character--breathing",
  drift: "stage-character--drift",
  none: "stage-character--none",
};

function StageEffects({ effects }: { effects: BackgroundEffect[] }) {
  return <div className="stage-effects" aria-hidden="true">
    {effects.includes("particles") && <div className="stage-particles" />}
    {effects.includes("rings") && <div className="stage-rings"><i /><i /><i /></div>}
    {effects.includes("waves") && <div className="stage-waves"><i /><i /></div>}
  </div>;
}

export function StateStage({
  character,
  caption,
  configuration = STATE_STAGE_CONFIGURATION,
}: {
  character: ReactNode;
  caption: string | null;
  configuration?: StageConfiguration;
}) {
  return <section className="stage" aria-label="Saruku character stage">
    <StageEffects effects={configuration.backgroundEffect} />
    <div className={`stage-character ${motionClass[configuration.characterMotion]}`}>{character}</div>
    {caption && <><p className="stage-caption">{caption}</p><span className="stage-caption-rule" aria-hidden="true" /></>}
  </section>;
}
