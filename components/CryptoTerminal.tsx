"use client"

/**
 * LASTQUESTION :: Live Market Terminal & Whale Flow
 * Premium Cyberpunk HUD :: Real-time WebSocket streams (no dummy data)
 *
 * Data sources (both public, no API key required):
 *  - wss://data-stream.binance.vision/stream?streams=...   (spot ticker prices + aggTrade whale detection)
 *  - wss://ws.okx.com:8443/ws/v5/public  -> "liquidation-orders" channel (SWAP liquidations)
 *
 * NOTE: everything here connects DIRECTLY from the user's browser (client-side),
 * not proxied through our own server. Binance SPOT market data works fine from
 * both server and client. Binance FUTURES (fstream.binance.com) was tested and
 * is silently blocked/restricted from our infra (connects + acks a subscribe,
 * but never delivers actual trade/liquidation data) -- likely the same kind of
 * regional restriction Binance applies more strictly to derivatives products.
 * So liquidations are sourced from OKX's public liquidation-orders feed instead
 * (same reliable provider already used elsewhere on this site), while whale
 * trades are detected from Binance's public SPOT aggTrade stream.
 *
 * XAU is not a real Binance pair -- PAXGUSDT (PAX Gold, a tokenized gold asset)
 * is used as a live price proxy, same approach as the XAUT proxy used by the
 * auto-signal engine elsewhere in this project.
 */

import type React from "react"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useReconnectingSocket } from "@/lib/useReconnectingSocket"
import { TERMINAL_PAIRS, priceDecimalsFor } from "@/lib/terminalPairs"
import OrderBookPanel from "@/components/OrderBookPanel"

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type Direction = "up" | "down" | "flat"

interface TickerState {
  symbol: string
  label: string
  price: number
  prevPrice: number
  changePct: number
  direction: Direction
}

type LogKind = "WHALE" | "LIQ_SHORT" | "LIQ_LONG"

interface LogEntry {
  id: string
  time: string
  kind: LogKind
  side: string
  symbol: string
  amount: string
  usd: string
  usdValue: number
}

/* -------------------------------------------------------------------------- */
/*  CONSTANTS                                                                 */
/* -------------------------------------------------------------------------- */

const WHALE_THRESHOLD_USD = 50_000
const MAX_LOGS = 30

const COLOR = {
  green: "#00FF66",
  red: "#FF0044",
  gold: "#FFC53D",
  cyan: "#00F0FF",
  iron: "#1E293B",
  abyss: "#05080F",
}

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

function fmtUSD(n: number, min = 2, max = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  })
}

function nowTime() {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":")
}

/* -------------------------------------------------------------------------- */
/*  RECONNECTING WEBSOCKET HOOK                                               */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/*  CHAMFER / CLIP-PATH STYLE (chamfered corners, no border-radius)           */
/* -------------------------------------------------------------------------- */

const chamfer = (size = 14): React.CSSProperties => ({
  clipPath: `polygon(${size}px 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%, 0 ${size}px)`,
})

/* -------------------------------------------------------------------------- */
/*  SLOT-MACHINE DIGIT                                                        */
/* -------------------------------------------------------------------------- */

function SlotChar({ char }: { char: string }) {
  // Non-digit chars (".", ",") don't animate
  if (!/\d/.test(char)) {
    return <span className="inline-block">{char}</span>
  }
  return (
    <span className="relative inline-block overflow-hidden" style={{ height: "1em", width: "0.62ch" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function SlotPrice({ value, symbol, color }: { value: number; symbol: string; color: string }) {
  const text = fmtUSD(value, priceDecimalsFor(symbol), priceDecimalsFor(symbol))
  return (
    <span className="flex tabular-nums font-mono" style={{ color }}>
      {text.split("").map((c, i) => (
        <SlotChar key={`${i}-${c}`} char={c} />
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  TICKER CELL                                                               */
/* -------------------------------------------------------------------------- */

function TickerCell({ t }: { t: TickerState }) {
  const [flash, setFlash] = useState<Direction>("flat")
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (t.direction === "flat") return
    setFlash(t.direction)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash("flat"), 380)
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [t.price, t.direction])

  const up = t.changePct >= 0
  const flashBg =
    flash === "up"
      ? "rgba(0,255,102,0.14)"
      : flash === "down"
        ? "rgba(255,0,68,0.14)"
        : "transparent"

  return (
    <div
      className="relative flex min-w-[150px] flex-1 items-center gap-3 border-r px-3 py-3 transition-colors duration-150"
      style={{ borderColor: COLOR.iron, backgroundColor: flashBg }}
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: COLOR.cyan }}>
          {t.label}
        </span>
        <span className="text-[9px] tracking-widest text-slate-500">
          {t.symbol === "PAXGUSDT" ? "GOLD PROXY" : "USDT"}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-base font-bold leading-none">
          <SlotPrice value={t.price} symbol={t.symbol} color={up ? COLOR.green : COLOR.red} />
        </span>
        <span
          className="mt-1 text-[10px] font-semibold tabular-nums"
          style={{ color: up ? COLOR.green : COLOR.red }}
        >
          {up ? "▲" : "▼"} {up ? "+" : ""}
          {t.changePct.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  TYPEWRITER TEXT (for new log lines)                                       */
/* -------------------------------------------------------------------------- */

function Typewriter({ text, color, speed = 0.012 }: { text: string; color: string; speed?: number }) {
  const chars = useMemo(() => text.split(""), [text])
  return (
    <span style={{ color }} className="whitespace-pre">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * speed, duration: 0.01 }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  LOG ROW                                                                   */
/* -------------------------------------------------------------------------- */

function tagFor(kind: LogKind) {
  switch (kind) {
    case "WHALE":
      return { label: "WHALE ALERT", color: COLOR.gold }
    case "LIQ_SHORT":
      return { label: "LIQUIDATION", color: COLOR.red }
    case "LIQ_LONG":
      return { label: "LIQUIDATION", color: COLOR.green }
  }
}

function LogRow({ entry, index, isNew }: { entry: LogEntry; index: number; isNew: boolean }) {
  // fade older rows progressively; rows past index 5 fade toward gone
  const fadeSteps = [1, 1, 0.85, 0.7, 0.55, 0.4]
  const opacity = index < fadeSteps.length ? fadeSteps[index] : Math.max(0.12, 0.4 - (index - 5) * 0.06)

  const tag = tagFor(entry.kind)
  const sideColor = entry.side.startsWith("BUY") || entry.side === "LONG" ? COLOR.green : COLOR.red

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, x: -12 } : false}
      animate={{ opacity }}
      transition={{ layout: { duration: 0.28, ease: "easeOut" }, opacity: { duration: 0.4 } }}
      className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-2 border-b px-3 py-1.5 font-mono text-[11px] leading-tight md:text-xs"
      style={{ borderColor: "rgba(30,41,59,0.5)" }}
    >
      <span className="text-slate-500">[ {entry.time} ]</span>

      <span className="flex items-center gap-1 font-semibold" style={{ color: tag.color }}>
        <span className="text-slate-600">::</span>
        <span>[ {isNew ? <Typewriter text={tag.label} color={tag.color} /> : tag.label} ]</span>
      </span>

      <span className="flex items-center gap-1 truncate">
        <span className="text-slate-600">::</span>
        <span style={{ color: sideColor }} className="font-semibold">
          {entry.side}
        </span>
        <span className="text-slate-400">{entry.amount}</span>
        <span className="text-slate-500">{entry.symbol}</span>
      </span>

      <span className="flex items-center gap-1 justify-self-end tabular-nums font-semibold" style={{ color: tag.color }}>
        <span className="text-slate-600">::</span>${entry.usd}
      </span>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */
/*  STATUS LED                                                                */
/* -------------------------------------------------------------------------- */

function StatusLed({ status, label }: { status: "connecting" | "online" | "offline"; label: string }) {
  const c = status === "online" ? COLOR.green : status === "connecting" ? COLOR.gold : COLOR.red
  return (
    <div className="flex items-center gap-2">
      <motion.span
        className="inline-block h-2 w-2"
        style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }}
        animate={status === "online" ? { opacity: [1, 0.35, 1] } : { opacity: 1 }}
        transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY }}
      />
      <span className="text-[10px] tracking-[0.2em] text-slate-400">
        {label} <span style={{ color: c }}>{status.toUpperCase()}</span>
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */

export default function CryptoTerminal() {
  const [tickers, setTickers] = useState<Record<string, TickerState>>(() =>
    Object.fromEntries(
      TERMINAL_PAIRS.map((t) => [
        t.symbol,
        { symbol: t.symbol, label: t.label, price: 0, prevPrice: 0, changePct: 0, direction: "flat" as Direction },
      ]),
    ),
  )
  const [logs, setLogs] = useState<LogEntry[]>([])
  const newestIdRef = useRef<string | null>(null)

  // Map of "BTC-USDT-SWAP" -> ctVal (contract face value in base coin units),
  // fetched once from OKX's public instruments endpoint so liquidation USD
  // values can be computed correctly (contract sizing differs per instrument).
  const ctValMapRef = useRef<Record<string, number>>({})
  useEffect(() => {
    let cancelled = false
    fetch("https://www.okx.com/api/v5/public/instruments?instType=SWAP")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !Array.isArray(json?.data)) return
        const map: Record<string, number> = {}
        for (const inst of json.data) {
          if (inst.instId && inst.ctVal) map[inst.instId] = Number.parseFloat(inst.ctVal)
        }
        ctValMapRef.current = map
      })
      .catch(() => {
        /* non-fatal: liquidation USD values just won't compute until this loads */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const pushLog = useCallback((entry: LogEntry) => {
    newestIdRef.current = entry.id
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS))
  }, [])

  /* ---- Combined Binance SPOT stream: live prices (@ticker) + whale trades (@aggTrade) ---- */
  const bySymbol = useMemo(() => new Map(TERMINAL_PAIRS.map((t) => [t.symbol, t])), [])

  const handleBinance = useCallback(
    (msg: unknown) => {
      const m = msg as { stream?: string; data?: Record<string, unknown> }
      const data = m?.data
      if (!data) return
      const e = data.e as string

      if (e === "24hrTicker") {
        const sym = data.s as string
        const cfg = bySymbol.get(sym)
        if (!cfg) return
        const price = Number.parseFloat(data.c as string)
        const changePct = Number.parseFloat(data.P as string)
        setTickers((prev) => {
          const old = prev[sym]
          if (!old) return prev
          const direction: Direction = price > old.price ? "up" : price < old.price ? "down" : "flat"
          return { ...prev, [sym]: { ...old, prevPrice: old.price, price, changePct, direction } }
        })
        return
      }

      if (e === "aggTrade") {
        const sym = data.s as string
        const cfg = bySymbol.get(sym)
        if (!cfg) return
        const price = Number.parseFloat(data.p as string)
        const qty = Number.parseFloat(data.q as string)
        const usd = price * qty
        if (usd < WHALE_THRESHOLD_USD) return
        const isBuyerMaker = data.m === true // true => seller aggressor (SELL), false => buyer aggressor (BUY)
        pushLog({
          id: `w-${data.a}-${data.T}`,
          time: nowTime(),
          kind: "WHALE",
          side: isBuyerMaker ? "SELL" : "BUY",
          symbol: cfg.label,
          amount: qty.toFixed(qty < 1 ? 4 : 2),
          usd: fmtUSD(usd, 0, 0),
          usdValue: usd,
        })
      }
    },
    [bySymbol, pushLog],
  )

  const binanceStreamUrl = useMemo(() => {
    const streams = TERMINAL_PAIRS.flatMap((t) => [`${t.symbol.toLowerCase()}@ticker`, `${t.symbol.toLowerCase()}@aggTrade`]).join(
      "/",
    )
    return `wss://data-stream.binance.vision/stream?streams=${streams}`
  }, [])
  const tickerStatus = useReconnectingSocket(binanceStreamUrl, handleBinance)

  /* ---- OKX public liquidation-orders feed (SWAP) ---- */
  const baseByFamily = useMemo(() => {
    const map = new Map<string, { label: string; symbol: string }>()
    for (const t of TERMINAL_PAIRS) {
      if (t.base === "PAXG") continue // no gold perpetual on OKX to match against
      map.set(`${t.base}-USDT`, { label: t.label, symbol: t.symbol })
    }
    return map
  }, [])

  const handleOkxLiquidation = useCallback(
    (msg: unknown) => {
      const m = msg as { arg?: { channel?: string }; data?: Array<Record<string, unknown>> }
      if (m?.arg?.channel !== "liquidation-orders" || !Array.isArray(m.data)) return

      for (const item of m.data) {
        const instFamily = item.instFamily as string
        const instId = item.instId as string
        const cfg = baseByFamily.get(instFamily)
        if (!cfg) continue // only show liquidations for coins we track

        const ctVal = ctValMapRef.current[instId]
        const details = (item.details as Array<Record<string, string>>) || []
        for (const d of details) {
          const bkPx = Number.parseFloat(d.bkPx)
          const sz = Number.parseFloat(d.sz)
          if (!ctVal || !Number.isFinite(bkPx) || !Number.isFinite(sz)) continue
          const coinQty = sz * ctVal
          const usd = coinQty * bkPx
          // posSide "long" liquidated = forced sell (bearish); "short" liquidated = forced buy (bullish squeeze)
          const posSide = d.posSide === "long" ? "LONG" : "SHORT"
          pushLog({
            id: `l-${instId}-${d.ts}-${d.sz}`,
            time: nowTime(),
            kind: posSide === "SHORT" ? "LIQ_SHORT" : "LIQ_LONG",
            side: posSide,
            symbol: cfg.label,
            amount: `${coinQty.toFixed(coinQty < 1 ? 4 : 2)}`,
            usd: fmtUSD(usd, 0, 0),
            usdValue: usd,
          })
        }
      }
    },
    [baseByFamily, pushLog],
  )

  const okxSub = useMemo(
    () => ({ op: "subscribe", args: [{ channel: "liquidation-orders", instType: "SWAP" }] }),
    [],
  )
  const liqStatus = useReconnectingSocket("wss://ws.okx.com:8443/ws/v5/public", handleOkxLiquidation, {
    subscribe: okxSub,
  })

  const orderedTickers = TERMINAL_PAIRS.map((t) => tickers[t.symbol])

  return (
    <div
      className="relative w-full font-mono"
      style={{ backgroundColor: COLOR.abyss, color: "#CBD5E1" }}
    >
      {/* Outer HUD frame with neon corner glow */}
      <div
        className="relative border p-[1px]"
        style={{
          borderColor: COLOR.iron,
          boxShadow: `0 0 0 1px rgba(0,240,255,0.08), 0 0 30px rgba(0,240,255,0.08)`,
          ...chamfer(16),
        }}
      >
        {/* corner ticks */}
        <CornerTicks />

        <div style={{ backgroundColor: COLOR.abyss, ...chamfer(15) }} className="relative">
          {/* ---------------- HEADER BAR ---------------- */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2"
            style={{ borderColor: COLOR.iron }}
          >
            <div className="flex items-center gap-3">
              <Crosshair />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold tracking-[0.3em]" style={{ color: COLOR.cyan }}>
                  LASTQUESTION
                </span>
                <span className="text-[9px] tracking-[0.35em] text-slate-500">
                  LIVE MARKET TERMINAL // WHALE FLOW
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <StatusLed status={tickerStatus} label="PRICE" />
              <StatusLed status={liqStatus} label="LIQ" />
            </div>
          </div>

          {/* ---------------- 1. TICKER BAR ---------------- */}
          <div className="flex flex-wrap border-b" style={{ borderColor: COLOR.iron }}>
            {orderedTickers.map((t) => (
              <TickerCell key={t.symbol} t={t} />
            ))}
          </div>

          {/* ---------------- 2. TERMINAL LOG ---------------- */}
          <div className="relative">
            <div
              className="flex items-center justify-between border-b px-3 py-1.5"
              style={{ borderColor: COLOR.iron }}
            >
              <span className="text-[10px] tracking-[0.3em]" style={{ color: COLOR.cyan }}>
                {"//"} FLOW LOG
              </span>
              <span className="text-[10px] tracking-[0.2em] text-slate-500">
                THRESHOLD :: {">"} ${fmtUSD(WHALE_THRESHOLD_USD, 0, 0)}
              </span>
            </div>

            <div
              className="relative h-[340px] overflow-hidden"
              style={{
                maskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent 100%)",
              }}
            >
              {logs.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <span className="animate-pulse text-[11px] tracking-[0.3em] text-slate-600">
                    {"> "}AWAITING MARKET EVENTS<span className="ml-1">_</span>
                  </span>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {logs.map((entry, i) => (
                    <LogRow key={entry.id} entry={entry} index={i} isNew={entry.id === newestIdRef.current} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* ---------------- 3. ORDER BOOK ---------------- */}
          <div className="border-b" style={{ borderColor: COLOR.iron }}>
            <OrderBookPanel />
          </div>

          {/* ---------------- FOOTER ---------------- */}
          <div
            className="flex items-center justify-between border-t px-3 py-1.5"
            style={{ borderColor: COLOR.iron }}
          >
            <span className="text-[9px] tracking-[0.25em] text-slate-600">LASTQUESTION © INTEL GRID</span>
            <span className="flex items-center gap-2 text-[9px] tracking-[0.25em] text-slate-600">
              <span style={{ color: COLOR.gold }}>◇</span> WHALE
              <span style={{ color: COLOR.red }}>◇</span> LIQ SHORT
              <span style={{ color: COLOR.green }}>◇</span> LIQ LONG
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  DECORATIVE SVG BITS                                                       */
/* -------------------------------------------------------------------------- */

function Crosshair() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7" stroke={COLOR.cyan} strokeWidth="1.2" />
      <path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke={COLOR.cyan} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.6" fill={COLOR.cyan} />
    </svg>
  )
}

function CornerTicks() {
  const base = "pointer-events-none absolute h-4 w-4"
  const s = { borderColor: COLOR.cyan, filter: `drop-shadow(0 0 4px ${COLOR.cyan})` }
  return (
    <>
      <span className={`${base} left-0 top-0 border-l-2 border-t-2`} style={s} aria-hidden="true" />
      <span className={`${base} right-0 top-0 border-r-2 border-t-2`} style={s} aria-hidden="true" />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2`} style={s} aria-hidden="true" />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2`} style={s} aria-hidden="true" />
    </>
  )
}
