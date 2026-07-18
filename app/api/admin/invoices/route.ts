import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("qco2_invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, invoices: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, days } = body as { id?: string; status?: string; days?: number };
  if (!id || !status) {
    return NextResponse.json({ success: false, error: "Missing id/status" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: invoice, error: invErr } = await admin
    .from("qco2_invoices")
    .update({ status, confirmed_at: status === "confirmed" ? new Date().toISOString() : null })
    .eq("id", id)
    .select()
    .single();

  if (invErr) return NextResponse.json({ success: false, error: invErr.message }, { status: 500 });

  // On confirm: upsert the member's profile to vip_member with a fresh expiry.
  if (status === "confirmed" && invoice) {
    const durationDays = days || 30;
    const expiredAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await admin
      .from("qco2_profiles")
      .select("id")
      .eq("email", invoice.email)
      .maybeSingle();

    if (existing) {
      await admin
        .from("qco2_profiles")
        .update({
          role: "vip_member",
          tier: invoice.tier,
          expired_at: expiredAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await admin.from("qco2_profiles").insert({
        email: invoice.email,
        role: "vip_member",
        tier: invoice.tier,
        expired_at: expiredAt,
      });
    }
  }

  return NextResponse.json({ success: true, invoice });
}
