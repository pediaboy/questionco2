import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

// Saves (or refreshes) a browser push subscription -- called from the Settings page
// right after the member grants Notification permission and the service worker
// subscribes to the push manager. Linking to auth_user_id is best-effort (works even
// if somehow called without a token, since a device can outlive a single session).
export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  const body = await req.json();
  const sub = body?.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ success: false, message: "Subscription tidak valid" }, { status: 400 });
  }

  let authUserId: string | null = null;
  const token = getToken(req);
  if (token) {
    const { data } = await admin.auth.getUser(token);
    if (data?.user) authUserId = data.user.id;
  }

  const { error } = await admin
    .from("qco2_push_subscriptions")
    .upsert(
      {
        auth_user_id: authUserId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth_key: sub.keys.auth,
      },
      { onConflict: "endpoint" }
    );

  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = getSupabaseAdmin();
  const body = await req.json();
  const endpoint = body?.endpoint as string | undefined;
  if (!endpoint) return NextResponse.json({ success: false, message: "endpoint wajib diisi" }, { status: 400 });

  const { error } = await admin.from("qco2_push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
