import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

export async function GET(req: NextRequest) {
  const admin = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "id wajib diisi" }, { status: 400 });

  const token = getToken(req);
  let isVip = false;
  if (token) {
    const { data } = await admin.auth.getUser(token);
    if (data?.user) {
      const { data: profile } = await admin.from("qco2_profiles").select("is_vip").eq("auth_user_id", data.user.id).maybeSingle();
      isVip = !!profile?.is_vip;
    }
  }

  const { data: signal, error } = await admin.from("qco2_signals").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  if (!signal) return NextResponse.json({ success: false, message: "Sinyal tidak ditemukan" }, { status: 404 });

  if (signal.audience !== "public" && !isVip) {
    return NextResponse.json({ success: true, locked: true, signal: { pair: signal.pair, direction: signal.direction, status: signal.status, created_at: signal.created_at, audience: signal.audience } });
  }

  // Real engine-execution log rows around the time this signal was created, for the
  // same pair -- gives the actual tick-by-tick reasoning that led up to (or followed) it.
  const { data: nearbyLogs } = await admin
    .from("qco2_engine_logs")
    .select("action, confidence, direction, reasoning, created_at")
    .eq("pair", signal.pair)
    .gte("created_at", new Date(new Date(signal.created_at).getTime() - 30 * 60000).toISOString())
    .lte("created_at", new Date(new Date(signal.created_at).getTime() + 5 * 60000).toISOString())
    .order("created_at", { ascending: true });

  return NextResponse.json({ success: true, locked: false, signal, engine_logs: nearbyLogs || [] });
}
