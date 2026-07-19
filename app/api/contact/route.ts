import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Public contact form -- no login required. Stored in the same real ticket
// table as logged-in support tickets (auth_user_id left null), so admin sees
// one unified inbox instead of two disconnected systems.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const subject = (body.subject || "Pesan dari Contact Form").trim();
  const message = (body.message || "").trim();

  if (!email || !message) {
    return NextResponse.json({ success: false, message: "Email dan pesan wajib diisi" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("qco2_support_tickets").insert({
    auth_user_id: null,
    name: name || null,
    email,
    subject,
    message,
    status: "open",
  });

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
