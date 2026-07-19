import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";
import { summarizeSignals, HARI_ID, wibDayString } from "@/lib/signalRecap";

export const dynamic = "force-dynamic";
const CRON_SECRET = "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const now = new Date();

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { data: rows, error } = await admin
    .from("qco2_signals")
    .select("pair, status, hit_level, closed_at, created_at")
    .eq("source", "auto")
    .neq("status", "active")
    .gte("closed_at", sevenDaysAgo.toISOString());

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  if (!rows || rows.length === 0) {
    return NextResponse.json({ success: true, skipped: true, reason: "no_signals_this_week" });
  }

  // Group by WIB day string for the last 7 days, oldest -> newest.
  const dayBuckets: Record<string, typeof rows> = {};
  const dayOrder: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = wibDayString(d);
    dayBuckets[key] = [];
    dayOrder.push(key);
  }
  for (const r of rows) {
    if (!r.closed_at) continue;
    const key = wibDayString(new Date(r.closed_at));
    if (dayBuckets[key]) dayBuckets[key].push(r);
  }

  const dayLines = dayOrder
    .filter((key) => dayBuckets[key].length > 0)
    .map((key) => {
      const dayRows = dayBuckets[key];
      const s = summarizeSignals(dayRows);
      const dayName = HARI_ID[new Date(key + "T00:00:00Z").getUTCDay()];
      const totalNet = Object.values(s.byPair).reduce((acc, v) => acc + v.net, 0);
      return `${dayName} : ${totalNet >= 0 ? "+" : ""}${totalNet} (${dayRows.length} signal)`;
    })
    .join("\n");

  const overallSummary = summarizeSignals(rows);
  const overallNet = Object.values(overallSummary.byPair).reduce((acc, v) => acc + v.net, 0);

  const firstDay = dayOrder[0];
  const lastDay = dayOrder[dayOrder.length - 1];

  const message = `<b>🏆 REKAP MINGGUAN</b>\n${firstDay} s/d ${lastDay}\n\n${dayLines}\n\nTOTAL : ${overallSummary.total} signal\nNET : ${overallNet >= 0 ? "+" : ""}${overallNet}\n\n#AUTOSIGNAL`;

  const sendResult = await sendTelegramMessage(message);

  return NextResponse.json({ success: true, overallSummary, telegram: sendResult });
}
