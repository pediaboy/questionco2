import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateApiKey } from "@/lib/referral";

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
    .from("qco2_profiles")
    .select("api_key")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, api_key: data?.api_key || null });
}

// Generates (or regenerates) a real API key for this member, stored server-side.
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const key = generateApiKey();
  const { error } = await admin.from("qco2_profiles").update({ api_key: key }).eq("auth_user_id", user.id);

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, api_key: key });
}
