import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendTelegramMessage } from "@/lib/telegram";
import { summarizeSignals, formatDateWIB, wibDayString, recapTargetDate } from "@/lib/signalRecap";

export const dynamic = "force-dynamic";
const CRON_SECRET = "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const now = new Date();
  // Use the buffered target date (not raw `now`) for BOTH the query filter and
  // the displayed label -- see recapTargetDate() doc comment for why (fixes the
  // "recap fired late, summarized the wrong day" bug).
  const targetDate = recapTargetDate(now);
  const todayStr = wibDayString(targetDate);

  // Dedup guard (2026-08-06): the Base44-scheduled workflow and the GitHub
  // Actions backup both hit this endpoint independently -- most days Base44
  // gets cancelled by the platform so only the backup fires, but on days Base44
  // DOES succeed both would fire and double-post the same recap. Claim the day
  // atomically via a unique constraint; whichever caller inserts first wins,
  // the other gets a conflict and skips sending.
  const { error: claimError } = await admin
    .from("qco2_recap_log")
    .insert({ recap_type: "daily", day_key: todayStr });
  if (claimError) {
    return NextResponse.json({ success: true, skipped: true, reason: "already_sent_for_day", day: todayStr });
  }

  // XAU-only (owner request 2026-07-29): the Telegram group only ever receives
  // XAUUSD signals (CHANNEL_ONLY_PAIRS in lib/signalAlerts.ts) -- BTC/ETH/SOL are
  // dashboard-only, so including them in the channel recap was confusing/irrelevant
  // for that audience.
  const { data: rows, error } = await admin
    .from("qco2_signals")
    .select("pair, status, hit_level, closed_at, created_at")
    .eq("source", "auto")
    .eq("pair", "XAUUSD")
    .neq("status", "active");

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const todayRows = (rows || []).filter((r) => r.closed_at && wibDayString(new Date(r.closed_at)) === todayStr);
  const summary = summarizeSignals(todayRows);

  if (summary.total === 0) {
    return NextResponse.json({ success: true, skipped: true, reason: "no_signals_today" });
  }

  const pairLines = Object.entries(summary.byPair)
    .map(([pair, s]) => `${pair} — TP: +${s.tpPips} ${s.suffix} | SL: ${s.slPips} ${s.suffix} | NET: ${s.net >= 0 ? "+" : ""}${s.net} ${s.suffix}`)
    .join("\n");

  const message = `<b>📊 REKAP SIGNAL HARI INI</b>\n${formatDateWIB(targetDate)}\n\nTotal signal : ${summary.total}\n✅ Profit : ${summary.profit}\n❌ Loss : ${summary.loss}\n➖ BE/Cancel : ${summary.beCancel}\n\n${pairLines}\n\nEvaluasi dulu, sabar & disiplin 💪\nBesok kita balikin lagi\n\n#AUTOSIGNAL`;

  const sendResult = await sendTelegramMessage(message);

  return NextResponse.json({ success: true, summary, telegram: sendResult });
}
