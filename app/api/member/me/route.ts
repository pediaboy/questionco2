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

function serialize(profile: Record<string, unknown>) {
  const isVip =
    profile.role === "vip_member" &&
    profile.expired_at &&
    new Date(profile.expired_at as string) > new Date();

  return {
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
    telegram_username: profile.telegram_username ?? "",
    total_lot: profile.total_lot ?? 0,
    broker_registered: !!profile.broker_registered,
    referral_code: (profile.referral_code as string) ?? "",
    referred_by: (profile.referred_by as string) ?? "",
  };
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileErr } = await admin
    .from("qco2_profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ success: false, message: "Profil tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json({ success: true, profile: serialize(profile) });
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json();
  const { telegram_username } = body as { telegram_username?: string };

  const admin = getSupabaseAdmin();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (telegram_username !== undefined) update.telegram_username = telegram_username;

  const { data, error } = await admin
    .from("qco2_profiles")
    .update(update)
    .eq("auth_user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, profile: serialize(data) });
}
