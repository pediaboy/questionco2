import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ success: false, message: "Sesi tidak valid" }, { status: 401 });
  }

  const body = await req.json();
  const { valetax_account_no, valetax_email } = body as {
    valetax_account_no?: string;
    valetax_email?: string;
  };

  if (!valetax_account_no || !valetax_email) {
    return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("qco2_vip_verifications")
    .insert({
      auth_user_id: userData.user.id,
      email: userData.user.email,
      valetax_account_no,
      valetax_email,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, item: data });
}
