import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Real public developer API, documented at /developer-hub and /api-docs.
// Authenticates via the member's own generated API key (see /profile ->
// /api/profile/api-key), passed as `x-api-key` header or `?api_key=` query
// param. Returns the same signal visibility rules as the web dashboard:
// VIP-only signals are only included for members whose role is vip_member
// with a non-expired subscription.
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") || new URL(req.url).searchParams.get("api_key");
  if (!apiKey) {
    return NextResponse.json({ success: false, message: "Missing API key (x-api-key header or ?api_key=)" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileErr } = await admin
    .from("qco2_profiles")
    .select("role, expired_at")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (profileErr) return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
  if (!profile) return NextResponse.json({ success: false, message: "Invalid API key" }, { status: 401 });

  const isVip = profile.role === "vip_member" && profile.expired_at && new Date(profile.expired_at) > new Date();

  let query = admin
    .from("qco2_signals")
    .select("pair, direction, entry, stop_loss, take_profit, tp2, tp3, tp4, status, source, audience, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!isVip) query = query.eq("audience", "public");

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true, tier: isVip ? "vip" : "free", signals: data || [] });
}
