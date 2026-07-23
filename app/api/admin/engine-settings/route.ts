import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("qco2_engine_settings").select("*").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, settings: data, all_pairs: SIGNAL_PAIRS.map((p) => ({ key: p.key, label: p.label })) });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const admin = getSupabaseAdmin();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.confidence_min === "number") update.confidence_min = Math.max(0, Math.min(100, Math.round(body.confidence_min)));
  if (typeof body.atr_sl_multiplier === "number") update.atr_sl_multiplier = Math.max(0.1, body.atr_sl_multiplier);
  if (Array.isArray(body.rr_targets) && body.rr_targets.length === 3) update.rr_targets = body.rr_targets;
  if (Array.isArray(body.active_pairs)) update.active_pairs = body.active_pairs;
  if (body.factor_weights && typeof body.factor_weights === "object") update.factor_weights = body.factor_weights;
  if (body.auto_signal_audience === "vip" || body.auto_signal_audience === "public") update.auto_signal_audience = body.auto_signal_audience;

  const { data, error } = await admin.from("qco2_engine_settings").update(update).eq("id", 1).select().single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, settings: data });
}
