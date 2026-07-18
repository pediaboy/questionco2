import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ success: false, message: "No token" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userRes?.user) {
    return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });
  }

  const { data: profile, error: profileErr } = await admin
    .from("qco2_profiles")
    .select("*")
    .eq("auth_user_id", userRes.user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ success: false, message: "Profil tidak ditemukan" }, { status: 404 });
  }

  const isVip = profile.role === "vip_member" && profile.expired_at && new Date(profile.expired_at) > new Date();

  return NextResponse.json({
    success: true,
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      tier: profile.tier,
      expired_at: profile.expired_at,
      is_vip: isVip,
      win_rate: profile.win_rate ?? 0,
      total_trade: profile.total_trade ?? 0,
      profit_pips: profile.profit_pips ?? 0,
      kelas_completed: profile.kelas_completed ?? 0,
    },
  });
}
