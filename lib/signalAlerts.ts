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
import { sendPushToAll } from "@/lib/pushNotify";

// Owner request 2026-07-27: BE alert must fire EXACTLY ONCE per signal, tied to
// TP1 (not a repeating pip-distance ladder anymore -- the old [20,50,70] threshold
// system fired multiple "amankan posisi" alerts as price ran, which felt spammy).
// be_alert_level is now just a 0/1 flag: 0 = not yet fired, 1 = fired (forever after).
export const BE_FIRE_AT_TP_LEVEL = 1;

export function decimalsFor(pair: PairConfig): number {
  return pair.pipUnit < 1 ? 2 : 0;
}

// Derives a short push-notification title+body from a Telegram HTML alert message
// (BE/TP/SL/timeout all share this shape: an emoji+bold headline line, then detail
// lines). Keeps push notifications in lockstep with whatever the channel says without
// needing a separate payload built at every call site.
function toPushPayload(text: string): { title: string; body: string } {
  const plain = text.replace(/<[^>]+>/g, "");
  const lines = plain.split("\n").map((l) => l.trim()).filter((l) => l && !/^[━\-—]+$/.test(l));
  const title = lines[0] || "Update Sinyal";
  const body = lines.slice(1, 4).join(" · ").slice(0, 160) || "Cek detail di halaman Sinyal.";
  return { title, body };
}

// Owner request 2026-07-28: Telegram CHANNEL blasts (new signal + every BE/TP/SL/
// timeout follow-up) are restricted to XAU ONLY -- BTC/ETH/SOL signals still get
// created, monitored, and shown on the web dashboard exactly as before, and still
// trigger a real device push (push is a web/PWA delivery channel, not the Telegram
// channel, so it's unaffected), they just never post to the Telegram group/channel.
export const CHANNEL_ONLY_PAIRS = ["XAUUSD"];
export function isChannelPair(pairKey: string): boolean {
  return CHANNEL_ONLY_PAIRS.includes(pairKey);
}

export async function sendSignalAlert(pairKey: string, audience: string | null | undefined, text: string, keyboard?: InlineKeyboard) {
  if (isChannelPair(pairKey)) {
    await sendToChannel(vipChannelId(), text, keyboard);
    if (audience === "public") await sendToChannel(publicChannelId(), text, keyboard);
  }

  const { title, body } = toPushPayload(text);
  sendPushToAll({ title, body, url: "/dashboard/sinyal", tag: "qco2-signal" }).catch(() => null);
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

export function buildBEMessage(pair: PairConfig, pipsRunning: number, decimals: number) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  return `🔐 <b>AMANKAN POSISI — SET BE</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📈 RUNNING  : ${fmt(pipsRunning)} ${pair.pipLabelSuffix}\n🎯 TP1 tercapai\n\n✅ Posisi sudah aman.\nGeser SL ke entry (Break Even) untuk mengunci modal.`;
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
  // Owner request 2026-07-27: BE alert fires exactly ONCE, the moment TP1 is
  // crossed -- tied directly to the same advanceTp() call (auto AND the admin's
  // manual TP1 button both trigger it identically), no more separate repeating
  // pip-ladder BE alerts.
  const willCrossTp1 = oldLevel < 1 && targetLevel >= 1 && !(signal.be_alert_level >= 1);

  for (let lvl = oldLevel + 1; lvl <= targetLevel; lvl++) {
    const isFinal = lvl === tps.length;
    const price = tps[lvl - 1];
    if (isFinal) {
      await sendSignalAlert(pair.key, signal.audience, buildTelegramCloseMessage(pair, dir, `tp${lvl}`, price, decimals, signal.entry));
    } else {
      await sendSignalAlert(pair.key, signal.audience, buildTPProgressMessage(pair, dir, lvl, price, decimals, signal.entry));
    }
    if (lvl === 1 && willCrossTp1) {
      const pipsRunning = dir === "BUY" ? (price - signal.entry) / pair.pipUnit : (signal.entry - price) / pair.pipUnit;
      await sendSignalAlert(pair.key, signal.audience, buildBEMessage(pair, pipsRunning, decimals));
    }
  }

  if (targetLevel === tps.length) {
    await admin
      .from("qco2_signals")
      .update({
        status: "tp_hit",
        hit_level: `tp${targetLevel}`,
        tp_alert_level: targetLevel,
        closed_at: new Date().toISOString(),
        ...(willCrossTp1 ? { be_alert_level: 1 } : {}),
      })
      .eq("id", signal.id);
    return { status: "fired", closed: true, level: targetLevel };
  }

  await admin
    .from("qco2_signals")
    .update({ tp_alert_level: targetLevel, ...(willCrossTp1 ? { be_alert_level: 1 } : {}) })
    .eq("id", signal.id);
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
  await sendSignalAlert(pair.key, signal.audience, buildTelegramCloseMessage(pair, signal.direction, "sl", signal.stop_loss, decimals, signal.entry));
  return { status: "fired" };
}

/** Admin-only manual override: fires the single BE alert on demand (e.g. admin
 * wants to call it early, before TP1 actually prints). Fires at most ONCE per
 * signal, same as the automatic TP1-triggered path in advanceTp() -- both write
 * the same be_alert_level=1 flag so neither can double-fire after the other. If
 * `livePriceHint` isn't given (manual button path has no live price in-hand),
 * fetches a fresh one so the manual alert always shows true real-time pips. */
export async function advanceBe(
  admin: ReturnType<typeof getSupabaseAdmin>,
  pair: PairConfig,
  decimals: number,
  signal: Record<string, any>,
  livePriceHint?: number
): Promise<{ status: "fired" | "already" | "closed_other" }> {
  if (signal.status !== "active") return { status: "closed_other" };
  if (signal.be_alert_level >= 1) return { status: "already" };

  const livePrice = livePriceHint ?? (await getLivePriceForPair(pair.key, pair.dataInstId));
  const pipsRunning = signal.direction === "BUY" ? (livePrice - signal.entry) / pair.pipUnit : (signal.entry - livePrice) / pair.pipUnit;

  await sendSignalAlert(pair.key, signal.audience, buildBEMessage(pair, pipsRunning, decimals));
  await admin.from("qco2_signals").update({ be_alert_level: 1 }).eq("id", signal.id);
  return { status: "fired" };
}
