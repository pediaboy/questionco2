"use client"

/**
 * LASTQUESTION :: Live Market Terminal & Whale Flow
 * Premium Cyberpunk HUD :: Real-time Binance WebSocket streams (no dummy data)
 *
 * Streams used:
 *  - wss://data-stream.binance.vision/stream?streams=...   (spot ticker prices)
 *  - wss://fstream.binance.com/ws  ->  !forceOrder@arr      (liquidations)
 *                                  ->  btcusdt@aggTrade      (whale trades)
 *
 * NOTE: these are connected DIRECTLY from the user's browser (client-side),
 * not proxied through our own server -- Binance blocks cloud/datacenter IPs
 * (confirmed 451 "restricted location" from our Vercel/sandbox region), but
 * a visitor's own residential connection is a different network path and can
 * usually reach these public market-data endpoints fine.
 */

import type React from "react"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

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

const WHALE_THRESHOLD_USD = 100_000
const MAX_LOGS = 30

const TRACKED: { symbol: string; label: string }[] = [
  { symbol: "BTCUSDT", label: "BTC" },
  { symbol: "ETHUSDT", label: "ETH" },
  { symbol: "SOLUSDT", label: "SOL" },
]

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

function priceDecimals(symbol: string) {
  return symbol.startsWith("BTC") || symbol.startsWith("ETH") ? 2 : 3
}

/* -------------------------------------------------------------------------- */
/*  RECONNECTING WEBSOCKET HOOK                                               */
/* -------------------------------------------------------------------------- */

function useBinanceSocket(
  url: string,
  onMessage: (data: unknown) => void,
  opts?: { subscribe?: Record<string, unknown> },
) {
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting")
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const subscribeRef = useRef(opts?.subscribe)
  subscribeRef.current = opts?.subscribe

  useEffect(() => {
    let ws: WebSocket | null = null
    let retry = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closedByUnmount = false

    const connect = () => {
      setStatus((s) => (s === "online" ? s : "connecting"))
      try {
        ws = new WebSocket(url)
      } catch {
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        retry = 0
        setStatus("online")
        if (subscribeRef.current && ws) {
          ws.send(JSON.stringify(subscribeRef.current))
        }
      }

      ws.onmessage = (evt) => {
        try {
          onMessageRef.current(JSON.parse(evt.data))
        } catch {
          /* ignore malformed frames */
        }
      }

      ws.onerror = () => {
        ws?.close()
      }

      ws.onclose = () => {
        if (closedByUnmount) return
        setStatus("offline")
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (closedByUnmount) return
      // exponential backoff capped at 10s
      const delay = Math.min(1000 * 2 ** retry, 10_000)
      retry += 1
      reconnectTimer = setTimeout(connect, delay)
    }

    connect()

    return () => {
      closedByUnmount = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return status
}

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
  const text = fmtUSD(value, priceDecimals(symbol), priceDecimals(symbol))
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
      className="relative flex min-w-[190px] flex-1 items-center gap-3 border-r px-4 py-3 transition-colors duration-150"
      style={{ borderColor: COLOR.iron, backgroundColor: flashBg }}
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-[0.25em]" style={{ color: COLOR.cyan }}>
          {t.label}
        </span>
        <span className="text-[9px] tracking-widest text-slate-500">USDT</span>
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
      TRACKED.map((t) => [
        t.symbol,
        { symbol: t.symbol, label: t.label, price: 0, prevPrice: 0, changePct: 0, direction: "flat" as Direction },
      ]),
    ),
  )
  const [logs, setLogs] = useState<LogEntry[]>([])
  const newestIdRef = useRef<string | null>(null)

  /* ---- Ticker stream (spot) ----
     Targeted combined stream for just the tracked symbols. This avoids the
     multi-megabyte !ticker@arr firehose that gets throttled/closed. */
  const handleTicker = useCallback((msg: unknown) => {
    // Combined stream frames arrive as { stream, data }; raw frames as the object itself.
    const m = msg as Record<string, unknown>
    const items: Array<Record<string, string>> = Array.isArray(msg)
      ? (msg as Array<Record<string, string>>)
      : m && m.data
        ? [m.data as Record<string, string>]
        : m && m.s
          ? [m as unknown as Record<string, string>]
          : []
    if (items.length === 0) return

    const wanted = new Set(TRACKED.map((t) => t.symbol))
    setTickers((prev) => {
      let changed = false
      const next = { ...prev }
      for (const item of items) {
        const sym = item.s
        if (!wanted.has(sym)) continue
        const price = Number.parseFloat(item.c)
        const changePct = Number.parseFloat(item.P)
        const old = prev[sym]
        if (!old) continue
        const direction: Direction = price > old.price ? "up" : price < old.price ? "down" : "flat"
        next[sym] = { ...old, prevPrice: old.price, price, changePct, direction }
        changed = true
      }
      return changed ? next : prev
    })
  }, [])

  const spotStreamUrl = useMemo(() => {
    // Binance's official public market-data endpoint (not geo-restricted like
    // stream.binance.com). Targeted combined stream keeps payloads small.
    const streams = TRACKED.map((t) => `${t.symbol.toLowerCase()}@ticker`).join("/")
    return `wss://data-stream.binance.vision/stream?streams=${streams}`
  }, [])
  const tickerStatus = useBinanceSocket(spotStreamUrl, handleTicker)

  /* ---- Whale + Liquidation stream (futures) ---- */
  const pushLog = useCallback((entry: LogEntry) => {
    newestIdRef.current = entry.id
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS))
  }, [])

  const handleFutures = useCallback(
    (msg: unknown) => {
      const m = msg as Record<string, unknown>

      // aggTrade -> whale detection
      if (m.e === "aggTrade") {
        const price = Number.parseFloat(m.p as string)
        const qty = Number.parseFloat(m.q as string)
        const usd = price * qty
        if (usd < WHALE_THRESHOLD_USD) return
        const isBuyerMaker = m.m === true // true => seller aggressor (SELL), false => buyer aggressor (BUY)
        pushLog({
          id: `w-${m.a}-${m.T}`,
          time: nowTime(),
          kind: "WHALE",
          side: isBuyerMaker ? "SELL" : "BUY",
          symbol: "BTC",
          amount: qty.toFixed(3),
          usd: fmtUSD(usd, 0, 0),
          usdValue: usd,
        })
        return
      }

      // forceOrder -> liquidation
      if (m.e === "forceOrder" && m.o) {
        const o = m.o as Record<string, string>
        const price = Number.parseFloat(o.ap || o.p)
        const qty = Number.parseFloat(o.q)
        const usd = price * qty
        // Binance side: SELL order => a LONG got liquidated; BUY order => a SHORT got liquidated
        const liqSide = o.S === "SELL" ? "LONG" : "SHORT"
        pushLog({
          id: `l-${o.s}-${o.T}-${o.q}`,
          time: nowTime(),
          kind: liqSide === "SHORT" ? "LIQ_SHORT" : "LIQ_LONG",
          side: liqSide,
          symbol: o.s.replace("USDT", "USDT"),
          amount: qty.toFixed(3),
          usd: fmtUSD(usd, 0, 0),
          usdValue: usd,
        })
      }
    },
    [pushLog],
  )

  const futuresSub = useMemo(
    () => ({ method: "SUBSCRIBE", params: ["!forceOrder@arr", "btcusdt@aggTrade"], id: 1 }),
    [],
  )
  const futuresStatus = useBinanceSocket("wss://fstream.binance.com/ws", handleFutures, {
    subscribe: futuresSub,
  })

  const orderedTickers = TRACKED.map((t) => tickers[t.symbol])

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
              <StatusLed status={tickerStatus} label="SPOT" />
              <StatusLed status={futuresStatus} label="FUTURES" />
            </div>
          </div>

          {/* ---------------- 1. TICKER BAR ---------------- */}
          <div className="flex flex-wrap border-b" style={{ borderColor: COLOR.iron }}>
            {orderedTickers.map((t) => (
              <TickerCell key={t.symbol} t={t} />
            ))}
            <div className="hidden flex-1 items-center px-4 md:flex">
              <span className="text-[10px] tracking-[0.3em] text-slate-600">
                {"> "}STREAMING BINANCE :: REAL-TIME
              </span>
            </div>
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
