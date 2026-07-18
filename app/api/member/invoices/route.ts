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
    return NextResponse.json(
      { success: false, message: "Sesi tidak valid" },
      { status: 401 }
    );
  }

  const admin = getSupabaseAdmin();

  // 1. Look up the user's email from qco2_profiles table
  const { data: profile, error: profileErr } = await admin
    .from("qco2_profiles")
    .select("email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json(
      { success: false, error: profileErr.message },
      { status: 500 }
    );
  }

  if (!profile || !profile.email) {
    return NextResponse.json(
      { success: false, message: "Profil atau email tidak ditemukan" },
      { status: 404 }
    );
  }

  // 2. Query qco2_invoices table for that email
  const { data: invoices, error: invErr } = await admin
    .from("qco2_invoices")
    .select("*")
    .eq("email", profile.email)
    .order("created_at", { ascending: false });

  if (invErr) {
    return NextResponse.json(
      { success: false, error: invErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, items: invoices || [] });
}
