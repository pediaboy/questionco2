import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateUniqueReferralCode } from "@/lib/referral";

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

// Returns the member's real referral code (generating one on first request)
// plus real counts of referred signups pulled from qco2_referrals.
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileErr } = await admin
    .from("qco2_profiles")
    .select("id, referral_code, email, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileErr) return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
  if (!profile) return NextResponse.json({ success: false, message: "Profil tidak ditemukan" }, { status: 404 });

  let code = profile.referral_code;
  if (!code) {
    code = await generateUniqueReferralCode(profile.full_name || profile.email);
    const { error: updErr } = await admin.from("qco2_profiles").update({ referral_code: code }).eq("id", profile.id);
    if (updErr) return NextResponse.json({ success: false, message: updErr.message }, { status: 500 });
  }

  const { data: referrals, error: refErr } = await admin
    .from("qco2_referrals")
    .select("referred_email, status, created_at")
    .eq("referrer_auth_user_id", user.id)
    .order("created_at", { ascending: false });

  if (refErr) return NextResponse.json({ success: false, message: refErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    referral_code: code,
    total_referred: referrals?.length || 0,
    referrals: referrals || [],
  });
}
