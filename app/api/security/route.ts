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

// GET: real login history for the Security Center page (last 10 real logins).
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_login_logs")
    .select("ip, user_agent, success, created_at")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    last_sign_in_at: user.last_sign_in_at,
    logins: data || [],
  });
}

// POST: records a real login event (called right after a successful sign-in
// from the login page). Captures real IP/User-Agent from request headers --
// no fabricated device/location data.
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  const { error } = await admin.from("qco2_login_logs").insert({
    auth_user_id: user.id,
    email: user.email,
    ip,
    user_agent: userAgent,
    success: true,
  });

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
