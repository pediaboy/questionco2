import { NextResponse } from "next/server";
import { getUpcomingHighImpactEvent } from "@/lib/newsFilter";

export const dynamic = "force-dynamic";

// Public endpoint wrapping the ForexFactory calendar feed (server-side, since
// ForexFactory's feed doesn't set CORS headers for cross-origin browser fetches).
// Used by the homepage "Kalender Ekonomi" preview card -- real upcoming
// high-impact event, no dummy placeholder data.
export async function GET() {
  try {
    const event = await getUpcomingHighImpactEvent();
    return NextResponse.json({ success: true, event });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
