import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOtpEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

function gen6Digit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const purpose = (body.purpose || "register").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Masukkan alamat email yang valid." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // If purpose is register, block if an already-confirmed profile/auth user exists.
    if (purpose === "register") {
      const { data: existing } = await admin.auth.admin.listUsers();
      const already = existing?.users?.find((u) => u.email?.toLowerCase() === email);
      if (already) {
        return NextResponse.json(
          { success: false, message: "Email ini sudah terdaftar. Silakan masuk (login).", alreadyRegistered: true },
          { status: 409 }
        );
      }
    }

    // Cooldown: block resend within 45s of the last code for this email+purpose.
    const { data: recent } = await admin
      .from("qco2_otp_codes")
      .select("created_at")
      .eq("email", email)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const elapsedMs = Date.now() - new Date(recent.created_at).getTime();
      const cooldownMs = 45_000;
      if (elapsedMs < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return NextResponse.json(
          { success: false, message: `Tunggu ${waitSec} detik lagi sebelum minta kode baru.`, cooldownSeconds: waitSec },
          { status: 429 }
        );
      }
    }

    const code = gen6Digit();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await admin.from("qco2_otp_codes").insert({
      email,
      code,
      purpose,
      expires_at,
    });

    if (insertError) {
      return NextResponse.json({ success: false, message: insertError.message }, { status: 500 });
    }

    await sendOtpEmail(email, code);

    return NextResponse.json({ success: true, message: "Kode OTP telah dikirim ke email kamu." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengirim kode OTP. Coba lagi.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
