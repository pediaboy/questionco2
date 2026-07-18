import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Admin-only: create a REAL account directly (auth user + profile), fully email-confirmed,
// no OTP flow needed. Lets the admin set email/username/password by hand.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    const full_name = (body.full_name || "").trim() || null;

    if (!email || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Email tidak valid atau password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr || !created?.user) {
      return NextResponse.json(
        { success: false, error: createErr?.message || "Gagal membuat akun di Supabase Auth." },
        { status: 500 }
      );
    }

    const { data: profile, error: profileErr } = await admin
      .from("qco2_profiles")
      .insert({
        auth_user_id: created.user.id,
        email,
        full_name,
        role: "free_member",
        tier: null,
        expired_at: null,
      })
      .select()
      .single();

    if (profileErr) {
      return NextResponse.json({ success: false, error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Admin-only: update an existing REAL account's email / username / password directly.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, email, password, full_name } = body as {
      profile_id?: string;
      email?: string;
      password?: string;
      full_name?: string;
    };

    if (!profile_id) {
      return NextResponse.json({ success: false, error: "Missing profile_id" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: profileRow, error: findErr } = await admin
      .from("qco2_profiles")
      .select("id, auth_user_id, email")
      .eq("id", profile_id)
      .single();

    if (findErr || !profileRow) {
      return NextResponse.json({ success: false, error: "Profil tidak ditemukan." }, { status: 404 });
    }

    // Update Supabase Auth (email / password) if this profile has a real auth user.
    if (profileRow.auth_user_id && (email || password)) {
      const authUpdate: Record<string, unknown> = { email_confirm: true };
      if (email) authUpdate.email = email.trim().toLowerCase();
      if (password) authUpdate.password = password.trim();

      const { error: authErr } = await admin.auth.admin.updateUserById(profileRow.auth_user_id, authUpdate);
      if (authErr) {
        return NextResponse.json({ success: false, error: authErr.message }, { status: 500 });
      }
    }

    const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (email) profileUpdate.email = email.trim().toLowerCase();
    if (full_name !== undefined) profileUpdate.full_name = full_name;

    const { data: updated, error: updateErr } = await admin
      .from("qco2_profiles")
      .update(profileUpdate)
      .eq("id", profile_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
