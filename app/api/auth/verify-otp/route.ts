import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const purpose = (body.purpose || "register").trim();

    if (!email || !code) {
      return NextResponse.json({ success: false, message: "Email dan kode wajib diisi." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: row, error } = await admin
      .from("qco2_otp_codes")
      .select("*")
      .eq("email", email)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ success: false, message: "Kode tidak ditemukan. Minta kode baru." }, { status: 400 });
    }

    if (row.verified) {
      return NextResponse.json({ success: true, message: "Kode sudah pernah diverifikasi." });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, message: "Kode sudah kedaluwarsa. Minta kode baru." }, { status: 400 });
    }

    if (row.attempts >= 5) {
      return NextResponse.json({ success: false, message: "Terlalu banyak percobaan. Minta kode baru." }, { status: 429 });
    }

    if (row.code !== code) {
      await admin
        .from("qco2_otp_codes")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      return NextResponse.json({ success: false, message: "Kode OTP salah." }, { status: 400 });
    }

    await admin.from("qco2_otp_codes").update({ verified: true }).eq("id", row.id);

    return NextResponse.json({ success: true, message: "Verifikasi berhasil." });
  } catch {
    return NextResponse.json({ success: false, message: "Gagal memverifikasi kode. Coba lagi." }, { status: 500 });
  }
}
