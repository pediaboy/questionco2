import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateUniqueReferralCode } from "@/lib/referral";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    const refCode = (body.ref || "").trim().toUpperCase() || null;

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
        // Self-heal: the auth user may already exist from a previous partial/failed
        // attempt (e.g. profile insert failed last time, orphaning the account).
        // Since OTP ownership is already verified above, it's safe to recover it here
        // instead of leaving the user permanently stuck.
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingUser = !listErr
          ? list?.users.find((u) => (u.email || "").toLowerCase() === email)
          : undefined;

        if (!existingUser) {
          return NextResponse.json(
            { success: false, message: "Email ini sudah terdaftar. Silakan masuk (login)." },
            { status: 409 }
          );
        }

        const { data: existingProfile } = await admin
          .from("qco2_profiles")
          .select("id")
          .eq("auth_user_id", existingUser.id)
          .maybeSingle();

        if (existingProfile) {
          // Fully registered already — just point them to login.
          return NextResponse.json(
            { success: false, message: "Email ini sudah terdaftar. Silakan masuk (login)." },
            { status: 409 }
          );
        }

        // Orphaned auth user with no profile: repair it now — set the password they
        // just chose and create the missing profile row so they can finally log in.
        await admin.auth.admin.updateUserById(existingUser.id, { password, email_confirm: true });

        const { error: repairProfileErr } = await admin.from("qco2_profiles").insert({
          auth_user_id: existingUser.id,
          email,
          role: "free_member",
          tier: null,
          expired_at: null,
        });

        if (repairProfileErr) {
          return NextResponse.json({ success: false, message: repairProfileErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Akun berhasil dipulihkan. Silakan login." });
      }

      return NextResponse.json({ success: false, message: msg || "Gagal membuat akun." }, { status: 500 });
    }

    const ownReferralCode = await generateUniqueReferralCode(email);

    const { error: profileErr } = await admin.from("qco2_profiles").insert({
      auth_user_id: created.user.id,
      email,
      role: "free_member",
      tier: null,
      expired_at: null,
      referral_code: ownReferralCode,
      referred_by: refCode,
    });

    if (profileErr) {
      return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
    }

    // Credit the referrer (if the ref code is real) -- real tracked referral,
    // not a fabricated counter. Fails silently so registration never breaks
    // because of a bad/expired ref code.
    if (refCode) {
      const { data: referrer } = await admin
        .from("qco2_profiles")
        .select("auth_user_id")
        .eq("referral_code", refCode)
        .maybeSingle();
      if (referrer?.auth_user_id) {
        await admin.from("qco2_referrals").insert({
          referrer_auth_user_id: referrer.auth_user_id,
          referred_auth_user_id: created.user.id,
          referred_email: email,
          status: "registered",
        });
      }
    }

    return NextResponse.json({ success: true, message: "Akun berhasil dibuat. Silakan login." });
  } catch {
    return NextResponse.json({ success: false, message: "Gagal menyelesaikan pendaftaran. Coba lagi." }, { status: 500 });
  }
}
