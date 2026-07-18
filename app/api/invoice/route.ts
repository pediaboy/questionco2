import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function genInvoiceId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `QCO-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, tier, amount } = body as {
      email?: string;
      tier?: string;
      amount?: number;
    };

    if (!tier || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing tier or amount" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    const invoice_id = genInvoiceId();

    const { data, error } = await admin
      .from("qco2_invoices")
      .insert({
        invoice_id,
        email: email || "guest@lastquestion.co",
        tier,
        amount,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, invoice: data });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
