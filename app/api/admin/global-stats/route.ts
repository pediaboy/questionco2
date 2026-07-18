import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("global_statistics").select("*").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, stats: data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { win_rate, total_trade, profit_pips, kelas_completed } = body as {
    win_rate?: number;
    total_trade?: number;
    profit_pips?: number;
    kelas_completed?: number;
  };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("global_statistics")
    .update({
      win_rate,
      total_trade,
      profit_pips,
      kelas_completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, stats: data });
}
