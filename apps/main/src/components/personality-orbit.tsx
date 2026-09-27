import type { Personality } from "@/lib/state-data";
import Image from "next/image";

const orbitOrder = ["curiosity", "sociability", "empathy", "independence", "caution"] as const;
const labels: Record<(typeof orbitOrder)[number], string> = {
  curiosity: "Curiosity",
  sociability: "Sociability",
  empathy: "Empathy",
  independence: "Independence",
  caution: "Caution",
};
const angles = [-90, -18, 54, 126, 198];

function polarPoint(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: 300 + Math.cos(radians) * radius, y: 220 + Math.sin(radians) * radius };
}

export function PersonalityOrbit({ personality, avatarSrc }: { personality: Personality; avatarSrc: string | null }) {
  return <div className="orbit" role="img" aria-label={`Personality orbit: ${orbitOrder.map((axis) => `${labels[axis]} ${personality[axis]}`).join(", ")}`}>
    <svg className="orbit-lines" viewBox="0 0 600 440" aria-hidden="true">
      <ellipse cx="300" cy="220" rx="206" ry="174" />
      <ellipse cx="300" cy="220" rx="152" ry="128" />
      {orbitOrder.map((axis, index) => {
        const point = polarPoint(angles[index], 155);
        const strength = 0.14 + personality[axis] / 140;
        return <line key={axis} x1="300" y1="220" x2={point.x} y2={point.y} style={{ opacity: strength }} />;
      })}
    </svg>
    {orbitOrder.map((axis, index) => {
      const point = polarPoint(angles[index], 155);
      const value = personality[axis];
      const dotSize = 12 + value * 0.12;
      return <div className="orbit-node" key={axis} style={{ left: `${(point.x / 600) * 100}%`, top: `${(point.y / 410) * 100}%` }}>
        <span className="orbit-dot" style={{ width: dotSize, height: dotSize, opacity: 0.5 + value / 200 }} />
        <span className="orbit-label">{labels[axis]}</span>
        <span className="orbit-value">{value}</span>
      </div>;
    })}
    <div className="orbit-center">{avatarSrc && <Image src={avatarSrc} alt="Saruku" width={69} height={64} />}</div>
  </div>;
}
