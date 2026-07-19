import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface CheckResult {
  name: string;
  status: "operational" | "degraded" | "down";
  latency_ms: number;
}

async function timed(name: string, fn: () => Promise<boolean>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const ok = await fn();
    return { name, status: ok ? "operational" : "degraded", latency_ms: Date.now() - start };
  } catch {
    return { name, status: "down", latency_ms: Date.now() - start };
  }
}

// Live health checks -- every check below is a real ping performed right now,
// not a stored/fabricated uptime percentage. "Last checked" is always "now".
export async function GET() {
  const admin = getSupabaseAdmin();

  const checks = await Promise.all([
    timed("Database (Supabase)", async () => {
      const { error } = await admin.from("qco2_settings").select("id").limit(1);
      return !error;
    }),
    timed("Signal Data Feed (OKX)", async () => {
      const res = await fetch("https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT", {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      });
      return res.ok;
    }),
    timed("Price Feed (TradingView)", async () => {
      const res = await fetch("https://scanner.tradingview.com/crypto/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: { tickers: ["BINANCE:BTCUSDT"] }, columns: ["close"] }),
        cache: "no-store",
      });
      return res.ok;
    }),
    timed("Telegram Bot", async () => {
      const token = process.env.TELEGRAM_SIGNAL_BOT_TOKEN;
      if (!token) return false;
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { cache: "no-store" });
      const json = await res.json();
      return !!json?.ok;
    }),
  ]);

  const { data: lastSignal } = await admin
    .from("qco2_signals")
    .select("created_at, source")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const allOperational = checks.every((c) => c.status === "operational");

  return NextResponse.json({
    success: true,
    overall: allOperational ? "operational" : "degraded",
    checked_at: new Date().toISOString(),
    checks,
    last_signal_generated_at: lastSignal?.created_at || null,
  });
}
