import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SIGNAL_PAIRS } from "@/lib/signalPairs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const { data: settings, error } = await admin
      .from("qco2_engine_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const responseData = {
      success: true,
      confidence_min: settings?.confidence_min ?? 75,
      active_pairs: settings?.active_pairs ?? SIGNAL_PAIRS.map((p) => p.key),
      atr_sl_multiplier: settings?.atr_sl_multiplier ?? 1.5,
      rr_targets: settings?.rr_targets ?? [2, 3, 4, 6],
    };

    return NextResponse.json(responseData);
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
