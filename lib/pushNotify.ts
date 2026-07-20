import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails("mailto:admin@lastquestion.co", publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

async function dispatch(
  admin: ReturnType<typeof getSupabaseAdmin>,
  subs: { id: string; endpoint: string; p256dh: string; auth_key: string }[],
  payload: PushPayload
): Promise<{ sent: number; removed: number }> {
  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          body
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("qco2_push_subscriptions").delete().eq("id", s.id);
          removed += 1;
        }
      }
    })
  );

  return { sent, removed };
}

// Sends a real browser/OS push notification to every subscribed device (works even if
// the site tab isn't open, as long as the PWA/browser has an active push subscription --
// requires the member to have tapped the "Aktifkan Notifikasi" toggle in Settings, which
// registers a subscription via the service worker + VAPID key). Auto-cleans up dead
// subscriptions (410 Gone / 404) so the table doesn't accumulate stale devices.
export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  ensureConfigured();
  if (!configured) return { sent: 0, removed: 0 };

  const admin = getSupabaseAdmin();
  const { data: subs } = await admin.from("qco2_push_subscriptions").select("id, endpoint, p256dh, auth_key");
  if (!subs || subs.length === 0) return { sent: 0, removed: 0 };
  return dispatch(admin, subs, payload);
}

// Targeted variant -- only the given member's own subscribed device(s). Used for
// live-chat admin replies, so the notification clearly belongs to that one member's
// conversation instead of blasting every subscriber.
export async function sendPushToUser(authUserId: string, payload: PushPayload): Promise<{ sent: number; removed: number }> {
  ensureConfigured();
  if (!configured) return { sent: 0, removed: 0 };

  const admin = getSupabaseAdmin();
  const { data: subs } = await admin
    .from("qco2_push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("auth_user_id", authUserId);
  if (!subs || subs.length === 0) return { sent: 0, removed: 0 };
  return dispatch(admin, subs, payload);
}
