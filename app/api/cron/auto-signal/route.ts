import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchOkxCandles, fetchOkxLastPrice } from "@/lib/signalEngine";
import { evaluateInstitutional, EngineSettings, DEFAULT_ENGINE_SETTINGS, FactorWeights } from "@/lib/institutionalEngine";
import { evaluateXauAggressive } from "@/lib/xauAggressiveEngine";
import { isNewsBlackout } from "@/lib/newsFilter";
import { getActiveSessions } from "@/lib/marketSessions";
import { SIGNAL_PAIRS, PairConfig } from "@/lib/signalPairs";
import { sendToChannel } from "@/lib/telegramApi";
import { vipChannelId, publicChannelId } from "@/lib/telegramBotConfig";
import { sendSignalAlert, advanceTp, closeViaSl, advanceBe, BE_THRESHOLDS } from "@/lib/signalAlerts";

export const dynamic = "force-dynamic";

const CRON_SECRET = "7b8725bd97d8ee2a3c4c9f27fd320bbed065ad05efb1d66d";
const AUTO_COOLDOWN_MINUTES = 30; // no fresh auto signal for a pair within 30min of its last auto signal closing (owner request 2026-07-20)
const TIMEOUT_MINUTES = 60;
// XAU Aggressive scalping needs a much shorter timeout (owner request 2026-07-20:
// "kalo dah 20menit ga nyentuh langsung kasih time out") -- BTC/ETH/SOL institutional
// SMC keeps the slower 60-min window.
function timeoutMinutesFor(pairKey: string): number {
  return pairKey === "XAUUSD" ? 20 : TIMEOUT_MINUTES;
}
const ATR_SL_MULTIPLIER = 1.5;
const RR_TARGETS = [2, 3, 4, 6]; // TP1=RR1:2, TP2=RR1:3, TP3=RR1:4, TP4=RR1:6 (extended runner)

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
  _trend: "up" | "down" | "none",
  _confidence: number,
  _reasoning: string,
  _checklist: { label: string; pass: boolean }[]
) {
  // Clean customer-facing "VVIP signal" style (2026-07-20, per owner's exact
  // reference example) — technical confidence/reasoning/checklist stay in the DB
  // (still shown on /signal-details and /system-logs for transparency) but are no
  // longer dumped into the raw Telegram blast members receive.
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const pips = (price: number) => Math.round(Math.abs(price - entry) / pair.pipUnit);

  // Cosmetic entry zone: a small buffer toward the more favorable fill price
  // (higher for SELL, lower for BUY) — 3 pips wide, matching the owner's example.
  const zoneBuffer = 3 * pair.pipUnit;
  const zoneLow = direction === "SELL" ? entry : entry - zoneBuffer;
  const zoneHigh = direction === "SELL" ? entry + zoneBuffer : entry;

  const tpLines = tps
    .map((tp, i) => `   TP${i + 1}  ›  ${fmt(tp)}  (${pips(tp)} pips)`)
    .join("\n");

  return (
    `⚜️ <b>LASTQUESTION VVIP SIGNAL</b> ⚜️\n━━━━━━━━━━━━━━━━\n\n` +
    `📊 PAIR    : ${pair.label}\n📈 SETUP   : <b>${direction}</b>\n🎯 ENTRY   : ${fmt(zoneLow)} – ${fmt(zoneHigh)}\n\n` +
    `🎯 TAKE PROFIT\n${tpLines}\n\n` +
    `🛑 STOP LOSS : ${fmt(sl)}  (${pips(sl)} pips)\n\n` +
    `⚠️ Gunakan money management.\nAmankan profit di TP1 / TP2, hindari overtrade.\n\n` +
    `#LASTQUESTIONVVIP\n━━━━━━━━━━━━━━━━\nlastquestion.store`
  );
}

function buildTimeoutMessage(minutes: number) {
  return `⏳ <b>TIMEOUT ${minutes} MENIT</b>\n━━━━━━━━━━━━━━━━\n\nRonde belum mencapai target.\n🔓 Slot signal baru sudah terbuka.\n\n📌 Tetap selektif — utamakan kualitas setup daripada kuantitas.`;
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
    engine: { confidenceMin: data.confidence_min ?? DEFAULT_ENGINE_SETTINGS.confidenceMin, factorWeights: fw ?? DEFAULT_ENGINE_SETTINGS.factorWeights },
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

async function monitorOneSignal(
  admin: ReturnType<typeof getSupabaseAdmin>,
  pair: PairConfig,
  decimals: number,
  livePrice: number,
  active: Record<string, any>
) {
  const dir = active.direction as "BUY" | "SELL";
  const tps: number[] = [active.take_profit, active.tp2, active.tp3, active.tp4].filter((v) => v !== null && v !== undefined);
  const sl = active.stop_loss;

  // SL always takes priority and closes immediately, regardless of how many TP
  // levels have already been alerted -- the raw SL price never moves on its own
  // (BE alerts just tell the member to move it manually), so if price round-trips
  // all the way back down/up to it after running through TP1/TP2, that's still a
  // real stop-out. Uses the SAME closeViaSl() the admin's manual SL button calls
  // (lib/signalAlerts.ts) -- automatic and manual can never conflict or double-fire.
  const slHit = dir === "BUY" ? livePrice <= sl : livePrice >= sl;
  if (slHit) {
    await closeViaSl(admin, pair, decimals, active);
    return { pair: pair.key, source: active.source, action: "closed", hit_level: "sl", still_active: false };
  }

  // Progressive TP alerts: find the HIGHEST tp index reached this tick, then hand it
  // to advanceTp() (same function the admin's manual TP1-4 buttons call) -- it fires
  // one alert per newly-crossed level since tp_alert_level and only closes the
  // signal if this is the LAST available TP for it.
  let reachedIdx = -1;
  for (let i = tps.length - 1; i >= 0; i--) {
    const reached = dir === "BUY" ? livePrice >= tps[i] : livePrice <= tps[i];
    if (reached) {
      reachedIdx = i;
      break;
    }
  }
  const newTpLevel = reachedIdx + 1; // 1-based count of TP levels reached so far
  const oldTpLevel: number = active.tp_alert_level || 0;

  if (newTpLevel > oldTpLevel) {
    const res = await advanceTp(admin, pair, decimals, active, newTpLevel);
    if (res.status === "fired" && res.closed) {
      return { pair: pair.key, source: active.source, action: "closed", hit_level: `tp${newTpLevel}`, still_active: false };
    }
    active.tp_alert_level = newTpLevel; // keep local copy in sync for the BE check below
  }

  // Not fully closed -- check the per-pair timeout before BE (XAU=20min, others=60min).
  // Timeout stays fully automatic (no manual button) -- it's inherently a "nothing
  // conclusive happened" state, not something an admin would declare on demand.
  const ageMin = (Date.now() - new Date(active.created_at).getTime()) / 60000;
  const timeoutMins = timeoutMinutesFor(pair.key);
  if (ageMin >= timeoutMins) {
    await admin
      .from("qco2_signals")
      .update({ status: "timeout", hit_level: "timeout", closed_at: new Date().toISOString() })
      .eq("id", active.id);

    await sendSignalAlert(active.audience, buildTimeoutMessage(timeoutMins));
    return { pair: pair.key, source: active.source, action: "timeout", age_min: Math.round(ageMin), still_active: false };
  }

  // Check running pips for Break-Even alert thresholds (20 / 50 / 70) -- loop calls
  // the SAME advanceBe() the admin's manual BE button uses, one step at a time,
  // while the live pips still qualify for the next threshold (handles a fast move
  // that jumps past 20 AND 50 in a single tick, firing both).
  const pipsRunning =
    dir === "BUY" ? (livePrice - active.entry) / pair.pipUnit : (active.entry - livePrice) / pair.pipUnit;

  let guard = 0;
  while (guard++ < BE_THRESHOLDS.length) {
    const currentLevel: number = active.be_alert_level || 0;
    const nextThreshold = BE_THRESHOLDS.find((t) => t > currentLevel);
    if (!nextThreshold || pipsRunning < nextThreshold) break;
    const res = await advanceBe(admin, pair, decimals, active, livePrice);
    if (res.status !== "fired") break;
    active.be_alert_level = res.threshold;
  }

  return { pair: pair.key, source: active.source, action: "monitoring", live_price: livePrice, pips_running: Math.round(pipsRunning), still_active: true };
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

  // 1. Fetch ALL active signals on this pair regardless of source -- auto AND
  // manual (bot/admin-input) signals get the exact same real-time TP/SL/BE/timeout
  // monitoring + alerts, routed to the right channel(s) via each row's own audience.
  const { data: activeRows } = await admin
    .from("qco2_signals")
    .select("*")
    .eq("pair", pair.label)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const rows = activeRows || [];

  const livePrice = pair.useLiveTickerFor ? await getLiveXauUsd() : await fetchOkxLastPrice(pair.dataInstId);

  let manualMonitoring: any[] = [];
  if (rows.length > 0) {
    const monitorResults = [];
    let hasActiveAuto = false;
    for (const row of rows) {
      const r = await monitorOneSignal(admin, pair, decimals, livePrice, row);
      monitorResults.push(r);
      if (row.source === "auto" && r.still_active) hasActiveAuto = true;
    }

    if (hasActiveAuto) {
      // An auto signal is still running -- keep the existing cooldown (no new
      // auto eval while one is open) and just report the monitoring results.
      return monitorResults.length === 1 ? monitorResults[0] : { pair: pair.key, action: "monitoring", sub: monitorResults };
    }
    // No active AUTO signal (only manual ones, if any, still open) -- keep these
    // monitoring results so they're not silently discarded (fixed 2026-07-20:
    // previously a fresh eval below would overwrite the reported "action", making
    // it look like manual signals were never being monitored even though the
    // TP/SL/BE alerts were firing correctly in the background).
    manualMonitoring = monitorResults;
  }

  // 1b. 30-minute cooldown after the last AUTO signal closed for this pair (owner
  // request 2026-07-20: "kalo udah kena TP jangan ngirim lagi sampe timeout 30menit").
  // Applies after a real TP/SL hit only -- NOT after a timeout (owner 2026-07-20:
  // "kalo dah 20menit ga nyentuh langsung kasih time out alert signal baru" -- a
  // timeout means nothing conclusive happened, so the pair should be free to
  // re-evaluate immediately on the next tick instead of waiting another 30min).
  const { data: lastClosedAuto } = await admin
    .from("qco2_signals")
    .select("closed_at")
    .eq("pair", pair.label)
    .eq("source", "auto")
    .in("status", ["tp_hit", "sl_hit"])
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastClosedAuto?.closed_at) {
    const minsSinceClose = (Date.now() - new Date(lastClosedAuto.closed_at).getTime()) / 60000;
    if (minsSinceClose < AUTO_COOLDOWN_MINUTES) {
      return {
        pair: pair.key,
        action: "no_trigger",
        reason: `Cooldown ${Math.ceil(AUTO_COOLDOWN_MINUTES - minsSinceClose)} menit lagi setelah sinyal auto terakhir ditutup`,
        confidence: 0,
        ...(manualMonitoring.length ? { manual_monitoring: manualMonitoring } : {}),
      };
    }
  }

  // 2. No active AUTO signal, cooldown cleared — evaluate a fresh trigger.
  // XAUUSD gets its own dedicated "Aggressive Scalping" engine (PSAR + EMA3/7 +
  // StochRSI(5,3,3), owner-specified 2026-07-20, "khusus xau, paling agresif") on
  // M1 data only. BTC/ETH/SOL keep using the Institutional SMC v3 model unchanged.
  const isXauAggressive = pair.key === "XAUUSD";

  let result: { direction: "BUY" | "SELL" | null; confidence: number; reasoning: string; atr: number; blockReason?: string };
  let strategyMode: string;

  if (isXauAggressive) {
    const [m1Aggr, m3Aggr, m5Aggr] = await Promise.all([
      fetchOkxCandles(pair.dataInstId, "1m", 150),
      fetchOkxCandles(pair.dataInstId, "3m", 60),
      fetchOkxCandles(pair.dataInstId, "5m", 60),
    ]);
    result = evaluateXauAggressive(m1Aggr, m3Aggr, m5Aggr, newsBlackout, pair.pipUnit, livePrice);
    strategyMode = "xau_aggressive_scalp_m1";
  } else {
    const [m5, m1] = await Promise.all([
      fetchOkxCandles(pair.dataInstId, "5m", 300),
      fetchOkxCandles(pair.dataInstId, "1m", 100),
    ]);
    result = evaluateInstitutional(m5, m1, newsBlackout, engineSettings, pair.pipUnit);
    strategyMode = "institutional_smc_v3";
  }

  if (!result.direction) {
    return {
      pair: pair.key,
      action: "no_trigger",
      reason: result.blockReason || result.reasoning || "no_trigger",
      confidence: result.confidence,
      ...(manualMonitoring.length ? { manual_monitoring: manualMonitoring } : {}),
    };
  }

  const entry = livePrice;

  // XAU Aggressive uses a FIXED pip risk model (owner spec 2026-07-20, "TP/SL kedeketan,
  // ga sesuai pasar buat agresif" -- ATR-based sizing was producing SL/TP too close
  // together): SL is ALWAYS 50 pips. TP1=30, TP2=50, TP3=70, TP4(max)=100 pips -- note
  // TP1 < SL is intentional (owner wants a fast partial-profit lock before the wider
  // runner targets), not a mistake. Other pairs keep the existing ATR-based sizing.
  let sl: number;
  let tps: number[];
  if (isXauAggressive) {
    const slPips = 50;
    const tpPipsList = [30, 50, 70, 100];
    const slDistance = slPips * pair.pipUnit;
    sl = result.direction === "BUY" ? entry - slDistance : entry + slDistance;
    tps =
      result.direction === "BUY"
        ? tpPipsList.map((p) => entry + p * pair.pipUnit)
        : tpPipsList.map((p) => entry - p * pair.pipUnit);
  } else {
    const slDistance = result.atr * riskSettings.atrSlMultiplier;
    sl = result.direction === "BUY" ? entry - slDistance : entry + slDistance;
    tps =
      result.direction === "BUY"
        ? riskSettings.rrTargets.map((rr) => entry + slDistance * rr)
        : riskSettings.rrTargets.map((rr) => entry - slDistance * rr);
  }

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
      tp4: tps[3] ?? null,
      pip_unit: pair.pipUnit,
      source: "auto",
      status: "active",
      be_alert_level: 0,
      audience: "vip",
      confidence: result.confidence,
      reasoning: result.reasoning,
      strategy_mode: strategyMode,
    })
    .select()
    .single();

  if (error) return { pair: pair.key, action: "error", error: error.message };

  const message = buildInstitutionalSignalMessage(pair, result.direction, entry, sl, tps, decimals, "none", result.confidence, result.reasoning, []);
  await sendToChannel(vipChannelId(), message);
  await fanOutAlerts(admin, created.id, pair.label, result.direction, result.confidence, message.replace(/<[^>]+>/g, "")).catch(() => null);

  return {
    pair: pair.key,
    action: "created",
    id: created.id,
    direction: result.direction,
    entry,
    confidence: result.confidence,
    ...(manualMonitoring.length ? { manual_monitoring: manualMonitoring } : {}),
  };
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
