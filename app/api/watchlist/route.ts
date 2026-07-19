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
  const { data, error } = await admin
    .from("qco2_watchlist")
    .select("id, pair, created_at")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, items: data || [] });
}

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json();
  const pair = (body.pair || "").trim().toUpperCase();
  if (!pair) return NextResponse.json({ success: false, message: "Pair wajib diisi" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("qco2_watchlist")
    .select("id")
    .eq("auth_user_id", user.id)
    .limit(50);
  if (existing && existing.length >= 20) {
    return NextResponse.json({ success: false, message: "Maksimal 20 pair di watchlist" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("qco2_watchlist")
    .insert({ auth_user_id: user.id, pair })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: false, message: "Pair sudah ada di watchlist" }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, item: data });
}

export async function DELETE(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, message: "id wajib diisi" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("qco2_watchlist").delete().eq("id", id).eq("auth_user_id", user.id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
