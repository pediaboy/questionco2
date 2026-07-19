// Market session windows (UTC hours) — Sydney, Tokyo, London, New York.
// These 4 sessions tile together with overlaps and cover the full 24-hour clock
// with NO gaps (verified: Sydney 22-07 + Tokyo 00-09 + London 08-17 + New York 13-22
// leaves no uncovered hour). So "kill zone = union of all sessions" (per owner
// request "start semua sesi") means the time-gate is effectively always open —
// signal quality is still fully enforced by the other confluence filters
// (structure, SMC, indicators, confidence>=90%), just no longer additionally
// restricted to the narrow 6h/day ICT London+NY kill zone window.
export interface SessionWindow {
  name: string;
  label: string;
  startUtc: number; // 0-23
  endUtc: number; // 0-23, may wrap past midnight (e.g. Sydney 22 -> 7)
}

export const SESSIONS: SessionWindow[] = [
  { name: "sydney", label: "Sydney", startUtc: 22, endUtc: 7 },
  { name: "tokyo", label: "Tokyo", startUtc: 0, endUtc: 9 },
  { name: "london", label: "London", startUtc: 8, endUtc: 17 },
  { name: "newyork", label: "New York", startUtc: 13, endUtc: 22 },
];

function isSessionActive(session: SessionWindow, hour: number): boolean {
  if (session.startUtc < session.endUtc) {
    return hour >= session.startUtc && hour < session.endUtc;
  }
  // Wraps midnight (e.g. Sydney 22:00 -> 07:00)
  return hour >= session.startUtc || hour < session.endUtc;
}

export function getActiveSessions(now: Date = new Date()): SessionWindow[] {
  const hour = now.getUTCHours();
  return SESSIONS.filter((s) => isSessionActive(s, hour));
}

// Kept as a named export for drop-in compatibility with the old ICT-kill-zone gate.
// Now true whenever ANY session is active — given full 24h tiling, this is always
// true, matching the owner's explicit request to stop restricting entries by time
// window and rely on the confluence filters + confidence score for quality instead.
export function inKillZone(now: Date = new Date()): boolean {
  return getActiveSessions(now).length > 0;
}
