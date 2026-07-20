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
  const [{ data: rule }, { data: notifs }] = await Promise.all([
    admin.from("qco2_alert_rules").select("*").eq("user_id", user.id).maybeSingle(),
    admin.from("qco2_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  return NextResponse.json({
    success: true,
    rule: rule || { min_confidence: 76, pairs: "all", enabled: true },
    notifications: notifs || [],
  });
}

export async function PUT(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json();
  const min_confidence = Math.max(0, Math.min(100, Number(body.min_confidence) || 76));
  const pairs = body.pairs === "all" ? "all" : Array.isArray(body.pairs) ? body.pairs : "all";
  const enabled = body.enabled !== false;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_alert_rules")
    .upsert({ user_id: user.id, min_confidence, pairs, enabled, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, rule: data });
}
