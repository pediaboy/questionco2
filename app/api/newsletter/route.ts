import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ success: false, message: "Email tidak valid" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("qco2_newsletter_subscribers").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: true, message: "Email sudah terdaftar." });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
