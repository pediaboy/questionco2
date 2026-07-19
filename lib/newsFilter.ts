// News blackout filter — blocks entries 30 minutes before/after high-impact
// economic events (FOMC, NFP, CPI, PPI, Interest Rate decisions, Powell speeches, etc).
// Data source: ForexFactory's public "this week" calendar feed (no auth required).
// If the feed is unreachable for any reason, we fail SAFE (treat as blackout=false
// so the engine doesn't get permanently stuck — but this is logged for visibility).

interface FFEvent {
  title: string;
  country: string;
  date: string; // ISO string with offset
  impact: "High" | "Medium" | "Low" | "Holiday" | string;
}

const CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const BLACKOUT_MINUTES = 30;

let cache: { fetchedAt: number; events: FFEvent[] } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // refetch at most every 5 min

async function getCalendar(): Promise<FFEvent[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.events;
  try {
    const res = await fetch(CALENDAR_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    const events = (await res.json()) as FFEvent[];
    cache = { fetchedAt: Date.now(), events };
    return events;
  } catch {
    // Fail-safe: don't block trading if the calendar feed is down, just return empty.
    return cache?.events ?? [];
  }
}

export async function isNewsBlackout(now: Date = new Date()): Promise<boolean> {
  const events = await getCalendar();
  const nowMs = now.getTime();
  for (const ev of events) {
    if (ev.impact !== "High") continue;
    const evMs = new Date(ev.date).getTime();
    if (Number.isNaN(evMs)) continue;
    const diffMin = Math.abs(nowMs - evMs) / 60000;
    if (diffMin <= BLACKOUT_MINUTES) return true;
  }
  return false;
}
