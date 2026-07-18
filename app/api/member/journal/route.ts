import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

async function requireUser(req: NextRequest) {
  const token = getToken(req);
  if (!token) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_journal")
    .select("*")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json();
  const { pair, direction, result, pips, notes } = body as {
    pair?: string;
    direction?: string;
    result?: string;
    pips?: number;
    notes?: string;
  };
  if (!pair || !direction || !result) {
    return NextResponse.json({ success: false, message: "Pair, arah, dan hasil wajib diisi" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_journal")
    .insert({
      auth_user_id: user.id,
      pair,
      direction,
      result,
      pips: pips ?? 0,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // keep profile aggregate stats in sync
  const { data: entries } = await admin
    .from("qco2_journal")
    .select("result, pips")
    .eq("auth_user_id", user.id);

  if (entries && entries.length > 0) {
    const total = entries.length;
    const wins = entries.filter((e) => e.result === "win").length;
    const totalPips = entries.reduce((sum, e) => sum + Number(e.pips || 0), 0);
    const winRate = Math.round((wins / total) * 1000) / 10;

    await admin
      .from("qco2_profiles")
      .update({ win_rate: winRate, total_trade: total, profit_pips: totalPips })
      .eq("auth_user_id", user.id);
  }

  return NextResponse.json({ success: true, item: data });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("qco2_journal")
    .delete()
    .eq("id", id)
    .eq("auth_user_id", user.id);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
