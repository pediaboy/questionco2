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

  // 1. Get current member's profile id
  const { data: profile, error: profileErr } = await admin
    .from("qco2_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ success: false, message: "Profil tidak ditemukan" }, { status: 404 });
  }

  // 2. Fetch lot entries for this profile
  const { data: entries, error: entErr } = await admin
    .from("qco2_lot_entries")
    .select("id, pair, lot_size, price, direction, is_auto, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (entErr) {
    return NextResponse.json({ success: false, message: entErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    entries: entries || [],
  });
}
