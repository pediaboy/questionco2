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

// GET: the logged-in member's own real ticket history + status.
export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_support_tickets")
    .select("id, subject, message, status, created_at, updated_at")
    .eq("auth_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, tickets: data || [] });
}

// POST: create a new ticket, tied to the logged-in member's account.
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const body = await req.json();
  const subject = (body.subject || "").trim();
  const message = (body.message || "").trim();
  if (!subject || !message) {
    return NextResponse.json({ success: false, message: "Subject dan pesan wajib diisi" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_support_tickets")
    .insert({
      auth_user_id: user.id,
      email: user.email,
      subject,
      message,
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, ticket: data });
}
