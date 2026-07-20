// Admin price-alarm feature (owner 2026-07-20: "bikinin fitur sender alert ke id
// admin, model nya ky price alarm, biar ga bablas entry an gua, wajib sinkron").
//
// Admin sets a target price per pair from the Telegram bot panel. Checking happens
// INSIDE app/api/cron/auto-signal/route.ts's processPair(), reusing the exact same
// `livePrice` variable already fetched there for TP/SL/BE monitoring on every cron
// tick (Base44 every 5min + GitHub Actions every ~2min) -- so the alarm is
// guaranteed to fire off the identical live price the rest of the engine sees, not
// a separate/possibly-stale fetch. That's the "wajib sinkron" requirement.
//
// One-shot: once triggered, status flips to "triggered" so it never fires twice.
import { sendMessage } from "@/lib/telegramApi";
import { TELEGRAM_ADMIN_ID } from "@/lib/telegramBotConfig";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function checkPriceAlarms(admin: ReturnType<typeof getSupabaseAdmin>, pairLabel: string, livePrice: number, decimals: number): Promise<void> {
  if (!Number.isFinite(livePrice)) return;

  const { data: alarms } = await admin.from("qco2_price_alarms").select("*").eq("pair", pairLabel).eq("status", "active");
  if (!alarms || alarms.length === 0) return;

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  for (const alarm of alarms) {
    const target = Number(alarm.target_price);
    const hit = alarm.direction === "up" ? livePrice >= target : livePrice <= target;
    if (!hit) continue;

    await admin
      .from("qco2_price_alarms")
      .update({ status: "triggered", triggered_at: new Date().toISOString(), triggered_price: livePrice })
      .eq("id", alarm.id);

    const arrow = alarm.direction === "up" ? "📈" : "📉";
    const verb = alarm.direction === "up" ? "NAIK ke" : "TURUN ke";
    const text =
      `🔔 <b>PRICE ALARM — ${pairLabel}</b>\n━━━━━━━━━━━━━━━━\n\n` +
      `${arrow} Harga sudah ${verb} target lo!\n\n` +
      `Target: <b>${fmt(target)}</b>\nHarga sekarang: <b>${fmt(livePrice)}</b>` +
      (alarm.note ? `\n\nCatatan: ${alarm.note}` : "") +
      `\n\n⚡ Jangan sampai bablas entry, gas cek chart sekarang!`;

    await sendMessage(TELEGRAM_ADMIN_ID, text).catch(() => null);
  }
}
