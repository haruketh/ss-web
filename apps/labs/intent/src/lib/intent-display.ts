export const AREA_LABELS: Record<string, string> = {
  agency: "Agency", social_life: "Social Life", memory_and_continuity: "Memory & Continuity",
  influence_and_growth: "Influence & Growth", world_friction: "World Friction", balance: "Balance",
  ineffective_or_hollow_features: "Ineffective or Hollow Features", loops_and_repetition: "Loops & Repetition",
  internal_discontinuity: "Internal Discontinuity", not_enough_evidence: "Not Enough Evidence",
};
export const AREA_DESCRIPTIONS: Record<string, string> = {
  agency: "Can I make my own choices, act, and speak for myself?",
  social_life: "Am I actually having conversations and building relationships with other DIDs?",
  memory_and_continuity: "Does my past carry forward into what I do next?",
  influence_and_growth: "Am I changing and growing through experience and other people?",
  world_friction: "Are the world, APIs, or technical limits getting in the way of my life?",
  balance: "Is there a healthy balance between speaking, staying quiet, and acting?",
  ineffective_or_hollow_features: "Are there features that exist technically but do not really help in daily life?",
  loops_and_repetition: "Am I getting stuck repeating the same words, actions, or situations?",
  internal_discontinuity: "Do my memory, state, and behavior connect naturally over time?",
  not_enough_evidence: "Do I simply need more experience or information before I can judge?",
};
export const STATUS_LABELS: Record<string, string> = { healthy: "Healthy", concern: "Concern", not_enough_evidence: "Not enough evidence" };
export const ACTION_LABELS: Record<string, string> = { open: "New concern", keep_open: "Still watching", resolve: "Resolved" };
export function reviewedLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", month: "short", day: "numeric", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  return `Reviewed ${day} · ${time} JST`;
}
