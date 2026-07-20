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

  // 1. Get current member's referral code
  const { data: profile, error: profileErr } = await admin
    .from("qco2_profiles")
    .select("id, referral_code")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
  }
  if (!profile || !profile.referral_code) {
    return NextResponse.json({ success: true, count: 0, referrals: [] });
  }

  // 2. Count real referred members from qco2_profiles where referred_by = referral_code
  const { data: referrals, error: refErr, count } = await admin
    .from("qco2_profiles")
    .select("id, email, full_name, created_at", { count: "exact" })
    .eq("referred_by", profile.referral_code)
    .order("created_at", { ascending: false });

  if (refErr) {
    return NextResponse.json({ success: false, message: refErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    count: count ?? referrals?.length ?? 0,
    referrals: referrals || [],
  });
}
