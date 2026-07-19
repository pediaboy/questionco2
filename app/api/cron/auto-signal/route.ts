import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchOkxCandles, fetchOkxLastPrice, evaluateStrategy, pipsToPrice } from "@/lib/signalEngine";
import { SIGNAL_PAIRS, PairConfig } from "@/lib/signalPairs";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const CRON_SECRET = "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";
const BE_THRESHOLDS = [30, 50, 70];
const TIMEOUT_MINUTES = 60;

function isWeekendWIB(): boolean {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = wib.getUTCDay();
  return day === 0 || day === 6;
}

async function getLiveXauUsd(): Promise<number> {
  // Reuse the same TradingView scanner call the site's own /api/ticker uses.
  const res = await fetch("https://scanner.tradingview.com/cfd/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols: { tickers: ["OANDA:XAUUSD"] }, columns: ["close"] }),
    cache: "no-store",
  });
  const json = await res.json();
  return Number(json?.data?.[0]?.d?.[0]);
}

function buildTelegramSignalMessage(
  pair: PairConfig,
  direction: "BUY" | "SELL",
  entry: number,
  tps: number[],
  sl: number,
  decimals: number,
  rvolRatio: number
) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const rrLabels = ["1:1", "1:2", "1:4"];
  const tpLines = tps
    .map((tp, i) => `TP${i + 1} → ${fmt(tp)}  (${pair.tpPips[i]} ${pair.pipLabelSuffix} • RR ${rrLabels[i]})`)
    .join("\n");

  return `<b>LASTQUESTION.CO — AUTO SIGNAL</b>\n\n📊 PAIR   : ${pair.label}\n📈 SETUP  : ${direction}\n🎯 ENTRY  : ${fmt(entry)}\n\n🎯 TAKE PROFIT\n${tpLines}\n\n🔴 STOP LOSS : ${fmt(sl)}  (${pair.slPips} ${pair.pipLabelSuffix})\n\nFilter: VWAP ✓ • EMA200 Trend ✓ • RVOL ${rvolRatio.toFixed(2)}x\n\n⚠️ Gunakan money management. Amankan profit di TP1/TP2, hindari overtrade.\n\n#AUTOSIGNAL #${pair.label}\n\nlastquestion.store`;
}

function buildTelegramCloseMessage(
  pair: PairConfig,
  direction: "BUY" | "SELL",
  hitLevel: string,
  price: number,
  decimals: number,
  entry: number
) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  if (hitLevel === "sl") {
    return `🔴 <b>STOP LOSS HIT</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📉 ARAH     : ${direction}\n💥 SL HIT   : ${fmt(price)}\n\nSignal ditutup sesuai rencana risiko.\n🔓 Slot signal baru sudah terbuka.\n\n📌 Disiplin di SL adalah kunci bertahan jangka panjang.\n\n#AUTOSIGNAL #${pair.label}`;
  }

  const tpIndex = Number(hitLevel.replace("tp", ""));
  const pipsGained = Math.round(Math.abs(price - entry) / pair.pipUnit);
  return `✅ <b>${hitLevel.toUpperCase()} HIT — PROFIT!</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📈 ARAH     : ${direction}\n🎯 HARGA    : ${fmt(price)}\n💰 PROFIT   : +${pipsGained} ${pair.pipLabelSuffix}\n\n${tpIndex >= 2 ? "Selamat! Sisa posisi bisa di-trailing atau full close sesuai rencana." : "Amankan sebagian profit, geser SL ke entry untuk sisa posisi."}\n\n#AUTOSIGNAL #${pair.label}`;
}

function buildBEMessage(pair: PairConfig, threshold: number, pipsRunning: number, decimals: number) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  return `🔐 <b>AMANKAN POSISI — SET BE</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📈 RUNNING  : ${fmt(pipsRunning)} ${pair.pipLabelSuffix}\n🎯 TRIGGER  : ${threshold} ${pair.pipLabelSuffix}\n\n✅ Posisi sudah masuk area aman.\nGeser SL ke entry (Break Even) untuk mengunci modal.\n\n#AUTOSIGNAL #${pair.label}`;
}

function buildTimeoutMessage() {
  return `⏳ <b>TIMEOUT 60 MENIT</b>\n━━━━━━━━━━━━━━━━\n\nRonde belum mencapai target.\n🔓 Slot signal baru sudah terbuka.\n\n📌 Tetap selektif — utamakan kualitas setup daripada kuantitas.`;
}

async function processPair(pair: PairConfig, admin: ReturnType<typeof getSupabaseAdmin>) {
  const decimals = pair.pipUnit < 1 ? 2 : 0;

  if (pair.skipWeekends && isWeekendWIB()) {
    return { pair: pair.key, action: "skipped_weekend" };
  }

  // 1. Check for an existing active auto signal on this pair.
  const { data: activeRows } = await admin
    .from("qco2_signals")
    .select("*")
    .eq("pair", pair.label)
    .eq("source", "auto")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  const active = activeRows?.[0];

  const livePrice = pair.useLiveTickerFor ? await getLiveXauUsd() : await fetchOkxLastPrice(pair.dataInstId);

  if (active) {
    // Monitor for TP/SL hit.
    const dir = active.direction as "BUY" | "SELL";
    const tps: number[] = [active.take_profit, active.tp2, active.tp3].filter((v) => v !== null && v !== undefined);
    const sl = active.stop_loss;

    let hit: { level: string; price: number } | null = null;

    if (dir === "BUY") {
      if (livePrice <= sl) hit = { level: "sl", price: sl };
      else {
        for (let i = tps.length - 1; i >= 0; i--) {
          if (livePrice >= tps[i]) {
            hit = { level: `tp${i + 1}`, price: tps[i] };
            break;
          }
        }
      }
    } else {
      if (livePrice >= sl) hit = { level: "sl", price: sl };
      else {
        for (let i = tps.length - 1; i >= 0; i--) {
          if (livePrice <= tps[i]) {
            hit = { level: `tp${i + 1}`, price: tps[i] };
            break;
          }
        }
      }
    }

    if (hit) {
      const status = hit.level === "sl" ? "sl_hit" : "tp_hit";
      await admin
        .from("qco2_signals")
        .update({ status, hit_level: hit.level, closed_at: new Date().toISOString() })
        .eq("id", active.id);

      await sendTelegramMessage(buildTelegramCloseMessage(pair, dir, hit.level, hit.price, decimals, active.entry));
      return { pair: pair.key, action: "closed", hit_level: hit.level };
    }

    // Not hit yet — check 60-minute timeout before anything else.
    const ageMin = (Date.now() - new Date(active.created_at).getTime()) / 60000;
    if (ageMin >= TIMEOUT_MINUTES) {
      await admin
        .from("qco2_signals")
        .update({ status: "timeout", hit_level: "timeout", closed_at: new Date().toISOString() })
        .eq("id", active.id);

      await sendTelegramMessage(buildTimeoutMessage());
      return { pair: pair.key, action: "timeout", age_min: Math.round(ageMin) };
    }

    // Check running pips for Break-Even alert thresholds (30 / 50 / 70).
    const pipsRunning =
      dir === "BUY" ? (livePrice - active.entry) / pair.pipUnit : (active.entry - livePrice) / pair.pipUnit;

    let newLevel: number = active.be_alert_level || 0;
    for (const threshold of BE_THRESHOLDS) {
      if (pipsRunning >= threshold && newLevel < threshold) {
        await sendTelegramMessage(buildBEMessage(pair, threshold, pipsRunning, decimals));
        newLevel = threshold;
      }
    }
    if (newLevel !== (active.be_alert_level || 0)) {
      await admin.from("qco2_signals").update({ be_alert_level: newLevel }).eq("id", active.id);
    }

    return { pair: pair.key, action: "monitoring", live_price: livePrice, pips_running: Math.round(pipsRunning) };
  }

  // 2. No active signal — evaluate strategy for a fresh trigger.
  // M5 needs enough history for a real EMA200 read; M1 needs enough for RVOL(20).
  const [m5, m1] = await Promise.all([
    fetchOkxCandles(pair.dataInstId, "5m", 300),
    fetchOkxCandles(pair.dataInstId, "1m", 100),
  ]);

  const result = evaluateStrategy(m5, m1);
  if (!result.direction) {
    return {
      pair: pair.key,
      action: "no_trigger",
      reason: result.reason,
      m5_trend: result.m5Trend,
      vwap: result.vwapValue,
      ema200: result.ema200Value,
      rvol_ratio: result.rvolRatio,
    };
  }

  const entry = livePrice;
  const tps =
    result.direction === "BUY"
      ? pair.tpPips.map((p) => entry + pipsToPrice(p, pair.pipUnit))
      : pair.tpPips.map((p) => entry - pipsToPrice(p, pair.pipUnit));
  const sl = result.direction === "BUY" ? entry - pipsToPrice(pair.slPips, pair.pipUnit) : entry + pipsToPrice(pair.slPips, pair.pipUnit);

  const { data: created, error } = await admin
    .from("qco2_signals")
    .insert({
      pair: pair.label,
      direction: result.direction,
      entry,
      stop_loss: sl,
      take_profit: tps[0],
      tp2: tps[1],
      tp3: tps[2],
      tp4: null,
      pip_unit: pair.pipUnit,
      source: "auto",
      status: "active",
      be_alert_level: 0,
    })
    .select()
    .single();

  if (error) return { pair: pair.key, action: "error", error: error.message };

  await sendTelegramMessage(buildTelegramSignalMessage(pair, result.direction, entry, tps, sl, decimals, result.rvolRatio));

  return { pair: pair.key, action: "created", id: created.id, direction: result.direction, entry };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const results = [];
  for (const pair of SIGNAL_PAIRS) {
    try {
      results.push(await processPair(pair, admin));
    } catch (err) {
      results.push({ pair: pair.key, action: "error", error: err instanceof Error ? err.message : "unknown" });
    }
  }

  return NextResponse.json({ success: true, results });
}
