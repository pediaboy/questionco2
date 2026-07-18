import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_profiles")
    .select("*")
    .order("expired_at", { ascending: true, nullsFirst: false });

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, profiles: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, role, expired_at, tier } = body as {
    id?: string;
    role?: string;
    expired_at?: string;
    tier?: string;
  };

  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (role) update.role = role;
  if (expired_at) update.expired_at = expired_at;
  if (tier) update.tier = tier;

  const { data, error } = await admin
    .from("qco2_profiles")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, profile: data });
}
