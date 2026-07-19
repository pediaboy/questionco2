// Referral code generation for the Affiliate Program. Codes are short,
// human-shareable (e.g. link.co/register?ref=RIZKY482), derived from the
// user's name/email plus a random suffix, with a DB-uniqueness retry loop.
import { getSupabaseAdmin } from "./supabaseAdmin";

function slugPart(input: string): string {
  const clean = (input || "trader").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (clean.slice(0, 6) || "TRADER").padEnd(3, "X");
}

export async function generateUniqueReferralCode(seed: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const base = slugPart(seed);
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = Math.floor(100 + Math.random() * 900); // 3 digits
    const candidate = `${base}${suffix}`;
    const { data } = await admin.from("qco2_profiles").select("id").eq("referral_code", candidate).maybeSingle();
    if (!data) return candidate;
  }
  // Extremely unlikely fallback: timestamp-based, guaranteed unique enough.
  return `${base}${Date.now().toString().slice(-5)}`;
}

export function generateApiKey(): string {
  const rand = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return `lq_live_${rand(8)}${rand(8)}${rand(8)}`;
}
