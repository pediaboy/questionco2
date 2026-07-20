import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchOkxCandles, fetchOkxLastPrice } from "@/lib/signalEngine";
import { evaluateInstitutional, EngineSettings, DEFAULT_ENGINE_SETTINGS, FactorWeights } from "@/lib/institutionalEngine";
import { isNewsBlackout } from "@/lib/newsFilter";
import { getActiveSessions } from "@/lib/marketSessions";
import { SIGNAL_PAIRS, PairConfig } from "@/lib/signalPairs";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendToChannel } from "@/lib/telegramApi";
import { vipChannelId, publicChannelId } from "@/lib/telegramBotConfig";

export const dynamic = "force-dynamic";

const CRON_SECRET = "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";
const BE_THRESHOLDS = [30, 50, 70];
const TIMEOUT_MINUTES = 60;
const ATR_SL_MULTIPLIER = 1.5;
const RR_TARGETS = [2, 3, 4]; // TP1=RR1:2 (minimum), TP2=RR1:3 (ideal), TP3=RR1:4 (extended)

function isWeekendWIB(): boolean {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const day = wib.getUTCDay();
  return day === 0 || day === 6;
}

async function getLiveXauUsd(): Promise<number> {
  const res = await fetch("https://scanner.tradingview.com/cfd/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols: { tickers: ["OANDA:XAUUSD"] }, columns: ["close"] }),
    cache: "no-store",
  });
  const json = await res.json();
  return Number(json?.data?.[0]?.d?.[0]);
}

// ---------- institutional-format Telegram message ----------

function buildInstitutionalSignalMessage(
  pair: PairConfig,
  direction: "BUY" | "SELL",
  entry: number,
  sl: number,
  tps: number[],
  decimals: number,
  trend: "up" | "down" | "none",
  confidence: number,
  reasoning: string,
  checklist: { label: string; pass: boolean }[]
) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const checklistLines = checklist
    .filter((c) => !["Trend (EMA20/50/200)"].includes(c.label))
    .map((c) => `${c.label} ${c.pass ? "✔" : "✘"}`)
    .join("\n");

  return (
    `🚨 <b>SCALPING SIGNAL</b>\n━━━━━━━━━━━━━━━━\n\n` +
    `Pair : <b>${pair.label}</b>\nTimeframe : M5\nTrend : <b>${trend.toUpperCase()}</b>\n\n` +
    `Signal : <b>${direction}</b>\n\n` +
    `Entry : <b>${fmt(entry)}</b>\nStoploss : <b>${fmt(sl)}</b>\n` +
    `Take Profit 1 : <b>${fmt(tps[0])}</b>  (RR 1:${RR_TARGETS[0]})\n` +
    `Take Profit 2 : <b>${fmt(tps[1])}</b>  (RR 1:${RR_TARGETS[1]})\n` +
    `Take Profit 3 : <b>${fmt(tps[2])}</b>  (RR 1:${RR_TARGETS[2]})\n\n` +
    `Risk Reward : 1:${RR_TARGETS[0]} - 1:${RR_TARGETS[2]}\nConfidence : <b>${confidence}%</b>\n\n` +
    `Alasan : ${reasoning}\n\n` +
    `Checklist :\n${checklistLines}\n\n#${pair.label}\n\nlastquestion.store`
  );
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
    return `🔴 <b>STOP LOSS HIT</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📉 ARAH     : ${direction}\n💥 SL HIT   : ${fmt(price)}\n\nSignal ditutup sesuai rencana risiko.\n🔓 Slot signal baru sudah terbuka.\n\n📌 Disiplin di SL adalah kunci bertahan jangka panjang.\n\n#${pair.label}`;
  }

  const tpIndex = Number(hitLevel.replace("tp", ""));
  const pipsGained = Math.abs(price - entry);
  return `✅ <b>${hitLevel.toUpperCase()} HIT — PROFIT!</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📈 ARAH     : ${direction}\n🎯 HARGA    : ${fmt(price)}\n💰 PROFIT   : +${fmt(pipsGained)} ${pair.pipLabelSuffix}\n\n${tpIndex >= 2 ? "Selamat! Sisa posisi bisa di-trailing atau full close sesuai rencana." : "Amankan sebagian profit, geser SL ke entry untuk sisa posisi."}\n\n#${pair.label}`;
}

function buildBEMessage(pair: PairConfig, threshold: number, pipsRunning: number, decimals: number) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  return `🔐 <b>AMANKAN POSISI — SET BE</b>\n━━━━━━━━━━━━━━━━\n\n📊 PAIR     : ${pair.label}\n📈 RUNNING  : ${fmt(pipsRunning)} ${pair.pipLabelSuffix}\n🎯 TRIGGER  : ${threshold} ${pair.pipLabelSuffix}\n\n✅ Posisi sudah masuk area aman.\nGeser SL ke entry (Break Even) untuk mengunci modal.\n\n#${pair.label}`;
}

function buildTimeoutMessage() {
  return `⏳ <b>TIMEOUT 60 MENIT</b>\n━━━━━━━━━━━━━━━━\n\nRonde belum mencapai target.\n🔓 Slot signal baru sudah terbuka.\n\n📌 Tetap selektif — utamakan kualitas setup daripada kuantitas.`;
}

function buildSessionChangeMessage(opened: string[], closed: string[], active: string[]): string {
  const lines: string[] = [`🌏 <b>PERGANTIAN SESI PASAR</b>`, `━━━━━━━━━━━━━━━━`, ``];
  if (opened.length) lines.push(`🔔 Sesi dibuka: ${opened.join(", ")}`);
  if (closed.length) lines.push(`🔕 Sesi ditutup: ${closed.join(", ")}`);
  lines.push(``, `📊 Sesi aktif sekarang: ${active.length ? active.join(", ") : "-"}`);
  lines.push(``, `Volatilitas &amp; likuiditas market bisa berubah — tetap disiplin dengan manajemen risiko.`);
  return lines.join("\n");
}

async function checkSessionChange(admin: ReturnType<typeof getSupabaseAdmin>) {
  const active = getActiveSessions().map((s) => s.label);

  const { data: stateRow } = await admin.from("qco2_session_state").select("*").eq("id", "singleton").maybeSingle();

  const previous: string[] = stateRow?.active_sessions || [];
  const opened = active.filter((s) => !previous.includes(s));
  const closed = previous.filter((s) => !active.includes(s));

  if (opened.length === 0 && closed.length === 0) {
    return { changed: false };
  }

  const text = buildSessionChangeMessage(opened, closed, active);
  await Promise.all([sendToChannel(vipChannelId(), text), sendToChannel(publicChannelId(), text)]);

  await admin
    .from("qco2_session_state")
    .upsert({ id: "singleton", active_sessions: active, updated_at: new Date().toISOString() });

  return { changed: true, opened, closed, active };
}

interface RiskSettings {
  atrSlMultiplier: number;
  rrTargets: number[];
  activePairs: string[];
}

async function loadEngineSettings(admin: ReturnType<typeof getSupabaseAdmin>): Promise<{ engine: EngineSettings; risk: RiskSettings }> {
  const { data } = await admin.from("qco2_engine_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) {
    return { engine: DEFAULT_ENGINE_SETTINGS, risk: { atrSlMultiplier: ATR_SL_MULTIPLIER, rrTargets: RR_TARGETS, activePairs: SIGNAL_PAIRS.map((p) => p.key) } };
  }
  const fw = data.factor_weights as FactorWeights;
  return {
    engine: { confidenceMin: data.confidence_min ?? 76, factorWeights: fw ?? DEFAULT_ENGINE_SETTINGS.factorWeights },
    risk: {
      atrSlMultiplier: Number(data.atr_sl_multiplier) || ATR_SL_MULTIPLIER,
      rrTargets: Array.isArray(data.rr_targets) ? data.rr_targets : RR_TARGETS,
      activePairs: Array.isArray(data.active_pairs) ? data.active_pairs : SIGNAL_PAIRS.map((p) => p.key),
    },
  };
}

async function logTick(
  admin: ReturnType<typeof getSupabaseAdmin>,
  pairKey: string,
  action: string,
  confidence: number | null,
  direction: string | null,
  reasoning: string | null
) {
  await admin.from("qco2_engine_logs").insert({ pair: pairKey, action, confidence, direction, reasoning });
}

async function fanOutAlerts(
  admin: ReturnType<typeof getSupabaseAdmin>,
  signalId: string,
  pairLabel: string,
  direction: string,
  confidence: number,
  message: string
) {
  const { data: rules } = await admin.from("qco2_alert_rules").select("*").eq("enabled", true).lte("min_confidence", confidence);
  if (!rules || rules.length === 0) return;
  const matches = rules.filter((r) => r.pairs === "all" || (Array.isArray(r.pairs) && r.pairs.includes(pairLabel)));
  if (matches.length === 0) return;
  await admin.from("qco2_notifications").insert(
    matches.map((r) => ({
      user_id: r.user_id,
      signal_id: signalId,
      pair: pairLabel,
      direction,
      confidence,
      message,
    }))
  );
}

async function processPair(
  pair: PairConfig,
  admin: ReturnType<typeof getSupabaseAdmin>,
  newsBlackout: boolean,
  engineSettings: EngineSettings,
  riskSettings: RiskSettings
) {
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

  // 2. No active signal — evaluate the institutional SMC strategy for a fresh trigger.
  const [m5, m1] = await Promise.all([
    fetchOkxCandles(pair.dataInstId, "5m", 300),
    fetchOkxCandles(pair.dataInstId, "1m", 100),
  ]);

  const result = evaluateInstitutional(m5, m1, newsBlackout, engineSettings, pair.pipUnit);
  if (!result.direction) {
    return {
      pair: pair.key,
      action: "no_trigger",
      reason: result.blockReason || result.reasoning || "no_trigger",
      confidence: result.confidence,
    };
  }

  const entry = livePrice;
  const slDistance = result.atr * riskSettings.atrSlMultiplier;
  const sl = result.direction === "BUY" ? entry - slDistance : entry + slDistance;
  const tps =
    result.direction === "BUY"
      ? riskSettings.rrTargets.map((rr) => entry + slDistance * rr)
      : riskSettings.rrTargets.map((rr) => entry - slDistance * rr);

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
      audience: "vip",
      confidence: result.confidence,
      reasoning: result.reasoning,
      strategy_mode: "institutional_smc_v3",
    })
    .select()
    .single();

  if (error) return { pair: pair.key, action: "error", error: error.message };

  const message = buildInstitutionalSignalMessage(pair, result.direction, entry, sl, tps, decimals, result.trend, result.confidence, result.reasoning, result.checklist);
  await sendTelegramMessage(message);
  await fanOutAlerts(admin, created.id, pair.label, result.direction, result.confidence, message.replace(/<[^>]+>/g, "")).catch(() => null);

  return { pair: pair.key, action: "created", id: created.id, direction: result.direction, entry, confidence: result.confidence };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const [newsBlackout, sessionChange, settings] = await Promise.all([
    isNewsBlackout(),
    checkSessionChange(admin),
    loadEngineSettings(admin),
  ]);

  const activePairs = SIGNAL_PAIRS.filter((p) => settings.risk.activePairs.includes(p.key));
  const results = [];
  for (const pair of activePairs) {
    try {
      const r = await processPair(pair, admin, newsBlackout, settings.engine, settings.risk);
      results.push(r);
      const anyR = r as { confidence?: number; direction?: string | null; reason?: string; error?: string };
      await logTick(admin, pair.key, r.action, anyR.confidence ?? null, anyR.direction ?? null, anyR.reason ?? anyR.error ?? null).catch(() => null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.push({ pair: pair.key, action: "error", error: msg });
      await logTick(admin, pair.key, "error", null, null, msg).catch(() => null);
    }
  }

  return NextResponse.json({ success: true, news_blackout: newsBlackout, session_change: sessionChange, results });
}
