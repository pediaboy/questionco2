import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_profiles")
    .select("*")
    .order("expired_at", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, profiles: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const {
    id,
    role,
    expired_at,
    tier,
    reset_stats,
    win_rate,
    total_trade,
    profit_pips,
    kelas_completed,
  } = body as {
    id?: string;
    role?: string;
    expired_at?: string;
    tier?: string;
    reset_stats?: boolean;
    win_rate?: number;
    total_trade?: number;
    profit_pips?: number;
    kelas_completed?: number;
  };

  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (role) update.role = role;
  if (expired_at) update.expired_at = expired_at;
  if (tier) update.tier = tier;

  if (reset_stats) {
    update.win_rate = 0;
    update.total_trade = 0;
    update.profit_pips = 0;
    update.kelas_completed = 0;
  } else {
    if (win_rate !== undefined) update.win_rate = win_rate;
    if (total_trade !== undefined) update.total_trade = total_trade;
    if (profit_pips !== undefined) update.profit_pips = profit_pips;
    if (kelas_completed !== undefined) update.kelas_completed = kelas_completed;
  }

  const { data, error } = await admin
    .from("qco2_profiles")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, profile: data });
}
