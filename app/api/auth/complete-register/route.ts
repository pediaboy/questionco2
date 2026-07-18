import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();

    if (!email || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Email tidak valid atau password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // Require that this email has a verified OTP record for purpose=register.
    const { data: otpRow } = await admin
      .from("qco2_otp_codes")
      .select("verified, created_at")
      .eq("email", email)
      .eq("purpose", "register")
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow) {
      return NextResponse.json(
        { success: false, message: "Email belum diverifikasi dengan OTP. Ulangi proses pendaftaran." },
        { status: 400 }
      );
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr || !created?.user) {
      const msg = createErr?.message || "";
      if (/already been registered|already exists/i.test(msg)) {
        return NextResponse.json(
          { success: false, message: "Email ini sudah terdaftar. Silakan masuk (login)." },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, message: msg || "Gagal membuat akun." }, { status: 500 });
    }

    const { error: profileErr } = await admin.from("qco2_profiles").insert({
      auth_user_id: created.user.id,
      email,
      role: "free_member",
      tier: null,
      expired_at: null,
    });

    if (profileErr) {
      return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Akun berhasil dibuat. Silakan login." });
  } catch {
    return NextResponse.json({ success: false, message: "Gagal menyelesaikan pendaftaran. Coba lagi." }, { status: 500 });
  }
}
