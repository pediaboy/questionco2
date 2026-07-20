// Shared signal-alert logic used by BOTH the automatic cron monitor
// (app/api/cron/auto-signal/route.ts, price-driven) AND the admin-only manual
// Telegram inline buttons (app/api/telegram-webhook/route.ts, button-press-driven).
// Owner requirement (2026-07-20): pressing a button must send a REAL alert to the
// channel AND update the signal's actual state, using the exact same code path the
// automatic engine uses -- so manual and automatic never conflict or duplicate,
// everything stays in sync in real time regardless of which one acts first.
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PairConfig } from "@/lib/signalPairs";
import { sendToChannel, InlineKeyboard } from "@/lib/telegramApi";
import { vipChannelId, publicChannelId } from "@/lib/telegramBotConfig";
import { getLivePriceForPair } from "@/lib/signalEngine";

export const BE_THRESHOLDS = [20, 50, 70]; // first level lowered 30->20 per owner request 2026-07-20

export function decimalsFor(pair: PairConfig): number {
  return pair.pipUnit < 1 ? 2 : 0;
}

export async function sendSignalAlert(audience: string | null | undefined, text: string, keyboard?: InlineKeyboard) {
  await sendToChannel(vipChannelId(), text, keyboard);
  if (audience === "public") await sendToChannel(publicChannelId(), text, keyboard);
}

export function buildTelegramCloseMessage(
  pair: PairConfig,
  direction: "BUY" | "SELL",
  hitLevel: string,
  price: number,
  decimals: number,
  entry: number
) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const pipsMoved = Math.round(Math.abs(price - entry) / pair.pipUnit);

  if (hitLevel === "sl") {
    return `🔴 <b>SL TERKENA — ${pair.label}</b>\n🛑 SL    : ${fmt(price)}\n📉 PIPS  : -${pipsMoved}`;
  }

  return `✅ <b>${hitLevel.toUpperCase()} TERCAPAI — ${pair.label}</b>\n🎯 ${hitLevel.toUpperCase()} : ${fmt(price)}\n📈 PIPS : ${pipsMoved}\n💵 PROFIT : +${pipsMoved} pips`;
}

export function buildTPProgressMessage(pair: PairConfig, direction: "BUY" | "SELL", tpLevel: number, price: number, decimals: number, entry: number) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const pipsMoved = Math.round(Math.abs(price - entry) / pair.pipUnit);
  return (
    `✅ <b>TP${tpLevel} TERCAPAI — ${pair.label}</b>\n🎯 TP${tpLevel} : ${fmt(price)}\n📈 PROFIT : +${pipsMoved} pips\n\n` +
    `💡 Posisi masih berjalan menuju TP${tpLevel + 1}. Amankan sebagian profit / sesuaikan SL.`
  );
}

export function buildBEMessage(pair: PairConfig, threshold: number, pipsRunning: number, decimals: number) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  return `🔐 <b>AMANKAN POSISI — SET BE</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📈 RUNNING  : ${fmt(pipsRunning)} ${pair.pipLabelSuffix}\n🎯 TRIGGER  : ${threshold} ${pair.pipLabelSuffix}\n\n✅ Posisi sudah masuk area aman.\nGeser SL ke entry (Break Even) untuk mengunci modal.`;
}

function tpArray(signal: Record<string, any>): number[] {
  return [signal.take_profit, signal.tp2, signal.tp3, signal.tp4].filter((v) => v !== null && v !== undefined);
}

/** Fires an alert for every TP level newly crossed since `signal.tp_alert_level`, up
 * to `targetLevel`. Closes the signal (status=tp_hit) only if targetLevel is the LAST
 * available TP for this signal; otherwise keeps it active for further TP/SL/BE. Used
 * by the cron (targetLevel = highest level the live price has reached) and by the
 * admin manual button (targetLevel = the exact TP button pressed). */
export async function advanceTp(
  admin: ReturnType<typeof getSupabaseAdmin>,
  pair: PairConfig,
  decimals: number,
  signal: Record<string, any>,
  targetLevel: number
): Promise<{ status: "fired" | "already" | "invalid" | "closed_other"; closed?: boolean; level?: number }> {
  if (signal.status !== "active") return { status: "closed_other" };
  const tps = tpArray(signal);
  if (targetLevel < 1 || targetLevel > tps.length) return { status: "invalid" };
  const oldLevel: number = signal.tp_alert_level || 0;
  if (targetLevel <= oldLevel) return { status: "already" };

  const dir = signal.direction as "BUY" | "SELL";

  for (let lvl = oldLevel + 1; lvl <= targetLevel; lvl++) {
    const isFinal = lvl === tps.length;
    const price = tps[lvl - 1];
    if (isFinal) {
      await sendSignalAlert(signal.audience, buildTelegramCloseMessage(pair, dir, `tp${lvl}`, price, decimals, signal.entry));
    } else {
      await sendSignalAlert(signal.audience, buildTPProgressMessage(pair, dir, lvl, price, decimals, signal.entry));
    }
  }

  if (targetLevel === tps.length) {
    await admin
      .from("qco2_signals")
      .update({ status: "tp_hit", hit_level: `tp${targetLevel}`, tp_alert_level: targetLevel, closed_at: new Date().toISOString() })
      .eq("id", signal.id);
    return { status: "fired", closed: true, level: targetLevel };
  }

  await admin.from("qco2_signals").update({ tp_alert_level: targetLevel }).eq("id", signal.id);
  return { status: "fired", closed: false, level: targetLevel };
}

/** SL always takes priority and closes immediately -- real stop-out regardless of
 * how many TP levels were already alerted. Used by both cron (price-triggered) and
 * the admin manual SL button (declared directly). */
export async function closeViaSl(
  admin: ReturnType<typeof getSupabaseAdmin>,
  pair: PairConfig,
  decimals: number,
  signal: Record<string, any>
): Promise<{ status: "fired" | "closed_other" }> {
  if (signal.status !== "active") return { status: "closed_other" };
  await admin
    .from("qco2_signals")
    .update({ status: "sl_hit", hit_level: "sl", closed_at: new Date().toISOString() })
    .eq("id", signal.id);
  await sendSignalAlert(signal.audience, buildTelegramCloseMessage(pair, signal.direction, "sl", signal.stop_loss, decimals, signal.entry));
  return { status: "fired" };
}

/** Advances exactly ONE BE threshold step (the next unfired one in BE_THRESHOLDS).
 * Cron calls this in a loop while the live pips still qualify (so a fast move that
 * jumps straight past 20 AND 50 in one tick still fires both, one call per step).
 * The admin manual BE button calls it once per press. If `livePriceHint` isn't
 * given (manual button path has no live price in-hand), fetches a fresh one so the
 * manual alert always shows the true real-time running pips, same as automatic. */
export async function advanceBe(
  admin: ReturnType<typeof getSupabaseAdmin>,
  pair: PairConfig,
  decimals: number,
  signal: Record<string, any>,
  livePriceHint?: number
): Promise<{ status: "fired" | "already" | "closed_other"; threshold?: number }> {
  if (signal.status !== "active") return { status: "closed_other" };
  const oldLevel: number = signal.be_alert_level || 0;
  const nextThreshold = BE_THRESHOLDS.find((t) => t > oldLevel);
  if (!nextThreshold) return { status: "already" };

  const livePrice = livePriceHint ?? (await getLivePriceForPair(pair.key, pair.dataInstId));
  const pipsRunning = signal.direction === "BUY" ? (livePrice - signal.entry) / pair.pipUnit : (signal.entry - livePrice) / pair.pipUnit;

  await sendSignalAlert(signal.audience, buildBEMessage(pair, nextThreshold, pipsRunning, decimals));
  await admin.from("qco2_signals").update({ be_alert_level: nextThreshold }).eq("id", signal.id);
  return { status: "fired", threshold: nextThreshold };
}
