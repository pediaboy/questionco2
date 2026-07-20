import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

export async function GET(req: NextRequest) {
  const admin = getSupabaseAdmin();
  const token = getToken(req);
  let isVip = false;
  if (token) {
    const { data } = await admin.auth.getUser(token);
    if (data?.user) {
      const { data: profile } = await admin.from("qco2_profiles").select("is_vip").eq("auth_user_id", data.user.id).maybeSingle();
      isVip = !!profile?.is_vip;
    }
  }

  const { searchParams } = new URL(req.url);
  const pair = searchParams.get("pair");
  const status = searchParams.get("status");
  const limit = Math.min(200, Number(searchParams.get("limit")) || 100);

  let query = admin.from("qco2_signals").select("*").order("created_at", { ascending: false }).limit(limit);
  if (pair) query = query.eq("pair", pair);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  // Non-VIP viewers only see public-audience signals in full; VIP ones are masked (not removed --
  // members should still know a VIP signal existed and its outcome once closed, per how /dashboard/sinyal works).
  const rows = (data || []).map((row) => {
    if (row.audience === "public" || isVip) return row;
    return { ...row, entry: null, stop_loss: null, take_profit: null, tp2: null, tp3: null, tp4: null, locked: true };
  });

  return NextResponse.json({ success: true, signals: rows, is_vip: isVip });
}
