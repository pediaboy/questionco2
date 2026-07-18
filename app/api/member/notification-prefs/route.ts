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
  if (!user) {
    return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  
  // Try to get notification preferences
  const { data: prefs, error: getErr } = await admin
    .from("qco2_notification_prefs")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (getErr) {
    return NextResponse.json({ success: false, message: getErr.message }, { status: 500 });
  }

  if (prefs) {
    return NextResponse.json({ success: true, prefs });
  }

  // If not exists, insert a default record
  const { data: newPrefs, error: insertErr } = await admin
    .from("qco2_notification_prefs")
    .insert({
      auth_user_id: user.id,
      signal_alerts: true,
      announcement_alerts: true,
      promo_alerts: true,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ success: false, message: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, prefs: newPrefs });
}

export async function PATCH(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });
  }

  const body = await req.json();
  const { signal_alerts, announcement_alerts, promo_alerts } = body as {
    signal_alerts?: boolean;
    announcement_alerts?: boolean;
    promo_alerts?: boolean;
  };

  const admin = getSupabaseAdmin();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (signal_alerts !== undefined) update.signal_alerts = signal_alerts;
  if (announcement_alerts !== undefined) update.announcement_alerts = announcement_alerts;
  if (promo_alerts !== undefined) update.promo_alerts = promo_alerts;

  const { data, error } = await admin
    .from("qco2_notification_prefs")
    .update(update)
    .eq("auth_user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, prefs: data });
}
