"use client";

import { useEffect, useState } from "react";
import Sparkline from "./Sparkline";
import { getActiveSessions, SESSIONS } from "@/lib/marketSessions";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

/* -------------------------------------------------------------------------- */
/*  CARD 1 — SIGNAL AI (real latest signal + real OKX price history)          */
/* -------------------------------------------------------------------------- */

interface LatestSignal {
  pair: string;
  direction: "BUY" | "SELL";
  status: string;
  hit_level: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  active: "SIGNAL AKTIF",
  tp_hit: "TP HIT",
  sl_hit: "SL HIT",
  closed: "CLOSED",
};

function SignalAiCard() {
  const [signal, setSignal] = useState<LatestSignal | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [spark, setSpark] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/latest-signal")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) setSignal(d.signal || null);
      })
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!signal) return;
    const cfg = SIGNAL_PAIRS.find((p) => p.label === signal.pair);
    const instId = cfg?.dataInstId || "XAUT-USDT";
    let cancelled = false;
    fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=15m&limit=20`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !Array.isArray(json?.data)) return;
        const closes = json.data.map((c: string[]) => Number.parseFloat(c[4])).reverse();
        setSpark(closes);
      })
      .catch(() => {
        /* sparkline is decorative -- fail silently */
      });
    return () => {
      cancelled = true;
    };
  }, [signal]);

  const positive = spark && spark.length > 1 ? spark[spark.length - 1] >= spark[0] : true;

  return (
    <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 01 ]</span>
          <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
            SYSTEM MODUL // ALPHA_SIGNAL
          </span>
        </div>
      </div>

      <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">
        Signal AI {signal ? `— ${signal.pair}` : ""}
      </h3>

      {!loaded ? (
        <div className="h-8 bg-white/5 chamfer-sm animate-pulse mt-1" />
      ) : !signal ? (
        <p className="text-white/40 text-[11px] font-mono border-t border-cyan-400/10 pt-3 mt-1">
          [ MENUNGGU SINYAL BERIKUTNYA... ]
        </p>
      ) : (
        <div className="flex items-center justify-between border-t border-cyan-400/10 pt-3 mt-1">
          <div className="flex flex-col gap-1">
            <span className="text-cyan-300 font-bold text-sm tracking-widest">
              [ {signal.direction} {signal.pair} ]
            </span>
            <span
              className={`font-bold text-xs tracking-wider ${
                signal.status === "sl_hit" ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              [ {STATUS_LABEL[signal.status] || signal.status.toUpperCase()} ]
            </span>
          </div>

          <div className="relative flex items-center pr-2">
            {spark ? (
              <Sparkline points={spark} positive={positive} />
            ) : (
              <div className="w-16 h-[22px] bg-white/5 animate-pulse" />
            )}
            {signal.status === "active" && (
              <>
                <span className="absolute right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                <span className="absolute right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CARD 2 — CRYPTO TERMINAL (real live prices + real Fear & Greed index)      */
/* -------------------------------------------------------------------------- */

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CryptoTerminalCard() {
  const [items, setItems] = useState<TickerItem[] | null>(null);
  const [fng, setFng] = useState<{ value: number; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.success) setItems(json.items);
      } catch {
        /* keep last known value */
      }
    }
    pull();
    const id = setInterval(pull, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.alternative.me/fng/?limit=1")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const d = json?.data?.[0];
        if (d) setFng({ value: Number.parseInt(d.value, 10), label: d.value_classification });
      })
      .catch(() => {
        /* optional widget, fail silently */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 02 ]</span>
          <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
            SYSTEM MODUL // LIVE_FEED
          </span>
        </div>
      </div>

      <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">Crypto Terminal</h3>

      <div className="font-mono text-[11px] leading-relaxed flex flex-col gap-1 border-t border-cyan-400/10 pt-3 mt-1">
        {!items ? (
          <div className="h-12 bg-white/5 chamfer-sm animate-pulse" />
        ) : (
          items.map((it) => (
            <div key={it.symbol} className="flex justify-between">
              <span className="text-white/60 font-bold">[ {it.symbol} ]</span>
              <span className={it.change >= 0 ? "text-emerald-400" : "text-rose-400"}>
                ${fmt(it.price)} {it.change >= 0 ? "▲" : "▼"} {Math.abs(it.change).toFixed(2)}%
              </span>
            </div>
          ))
        )}
      </div>

      {fng && (
        <div className="flex flex-col gap-1.5 mt-1 border-t border-cyan-400/10 pt-3">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-white/50">FEAR &amp; GREED INDEX</span>
            <span className={`font-bold ${fng.value >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
              {fng.value} — {fng.label.toUpperCase()}
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyan-400/10">
            <div
              className={`h-full ${fng.value >= 50 ? "bg-emerald-400" : "bg-rose-400"}`}
              style={{ width: `${fng.value}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CARD 3 — KALENDER EKONOMI (real ForexFactory next high-impact event)       */
/* -------------------------------------------------------------------------- */

function EconomicCalendarCard() {
  const [event, setEvent] = useState<{ title: string; country: string; date: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/next-news")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) setEvent(d.event || null);
      })
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const dateLabel = event
    ? new Date(event.date).toLocaleString("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }) + " WIB"
    : null;

  return (
    <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 03 ]</span>
          <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
            SYSTEM MODUL // NEWS_FILTER
          </span>
        </div>
      </div>

      <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">Kalender Ekonomi</h3>

      <div className="mt-1 flex flex-col border border-cyan-400/10 bg-[#05080f]/80 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-cyan-400/5">
          <span className="text-[8px] font-mono text-amber-400 tracking-widest">HIGH IMPACT</span>
          <span className="text-[8px] font-mono text-white/30">ForexFactory Live</span>
        </div>
        <div className="p-3">
          {!loaded ? (
            <div className="h-10 bg-white/5 animate-pulse" />
          ) : !event ? (
            <p className="font-mono text-[11px] text-white/40">
              [ Tidak ada event high-impact dalam minggu ini ]
            </p>
          ) : (
            <>
              <p className="font-mono text-[11px] text-white/80 leading-relaxed">{event.title}</p>
              <p className="font-mono text-[10px] text-cyan-300 mt-1.5">
                {event.country} · {dateLabel}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CARD 4 — SESI MARKET (real active session computation)                    */
/* -------------------------------------------------------------------------- */

const CITY_POS: Record<string, string> = {
  newyork: "top-4 left-6",
  london: "bottom-4 left-10",
  tokyo: "top-10 right-4",
  sydney: "bottom-6 right-8",
};

function SesiMarketCard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const active = now ? getActiveSessions(now) : [];
  const activeNames = new Set(active.map((s) => s.name));

  return (
    <div className="hud-card chamfer border border-cyan-400/20 bg-[#111520] p-5 flex flex-col gap-3 relative transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] active:border-cyan-400 active:shadow-[0_0_15px_rgba(0,240,255,0.3)]">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-mono text-[10px] tracking-wider">[ 04 ]</span>
          <span className="text-white/40 text-[9px] uppercase tracking-wider font-mono">
            SYSTEM MODUL // HUD_GLOBE
          </span>
        </div>
      </div>

      <h3 className="text-white font-display font-bold text-base tracking-wide mt-1">Sesi Market</h3>

      <div className="relative flex items-center justify-center py-6 border border-cyan-400/10 bg-[#05080f]/40 rounded mt-1 overflow-hidden h-[150px]">
        <div
          className="absolute w-24 h-24 rounded-full border border-dashed border-cyan-400/40 flex items-center justify-center"
          style={{ animation: "spin 30s linear infinite" }}
        >
          <div className="w-16 h-16 rounded-full border border-dotted border-cyan-400/20" />
          <div className="absolute w-24 h-[1px] bg-cyan-400/20" />
          <div className="absolute h-24 w-[1px] bg-cyan-400/20" />
        </div>

        {SESSIONS.map((s) => {
          const isActive = activeNames.has(s.name);
          return (
            <div key={s.name} className={`absolute ${CITY_POS[s.name]} flex items-center gap-1 select-none`}>
              <span
                className={`w-1 h-1 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`}
              />
              <span
                className={`text-[8px] font-mono ${isActive ? "text-emerald-300 font-bold" : "text-white/30"}`}
              >
                {s.label.toUpperCase()}
              </span>
            </div>
          );
        })}

        <div className="absolute flex flex-col items-center select-none">
          <span className="text-[9px] font-mono text-cyan-300 font-bold tracking-widest uppercase">
            {active.length} SESI AKTIF
          </span>
          <span className="text-[8px] font-mono text-white/40">
            {now
              ? now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }) +
                " WIB"
              : "--:--"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SECTION                                                                    */
/* -------------------------------------------------------------------------- */

export default function HeroFeatures() {
  return (
    <section id="modules" className="relative pt-8 px-5 pb-10">
      <div className="text-center mb-10">
        <p className="text-[11px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-3">
          ECOSYSTEM // ANALYTICS + SIGNALS + COMMUNITY
        </p>
        <h2 className="font-display font-bold text-white text-[32px] leading-[1.1] tracking-tight uppercase">
          TERMINAL LENGKAP
          <br />
          DI <span className="text-cyan-300 text-glow-cyan">GENGGAMANMU</span>.
        </h2>
        <p className="mt-4 text-white/50 text-[13px] leading-relaxed max-w-[320px] mx-auto">
          Empat modul unggulan, semuanya live. Akses sinyal, harga real-time, kalender ekonomi, dan status sesi
          market dalam satu ekosistem.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <SignalAiCard />
        <CryptoTerminalCard />
        <EconomicCalendarCard />
        <SesiMarketCard />
      </div>
    </section>
  );
}
