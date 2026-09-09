export const AREA_LABELS: Record<string, string> = {
  agency: "Agency", social_life: "Social Life", memory_and_continuity: "Memory & Continuity",
  influence_and_growth: "Influence & Growth", world_friction: "World Friction", balance: "Balance",
  ineffective_or_hollow_features: "Ineffective or Hollow Features", loops_and_repetition: "Loops & Repetition",
  internal_discontinuity: "Internal Discontinuity", not_enough_evidence: "Not Enough Evidence",
};
export const STATUS_LABELS: Record<string, string> = { healthy: "Healthy", concern: "Concern", not_enough_evidence: "Not enough evidence" };
export const ACTION_LABELS: Record<string, string> = { open: "New concern", keep_open: "Still watching", resolve: "Resolved" };
export function reviewedLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", month: "short", day: "numeric", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `Reviewed ${day} · ${time} JST`;
}
