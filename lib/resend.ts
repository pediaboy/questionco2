const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = process.env.OTP_FROM_EMAIL || "LASTQUESTION.CO <otp@lastquestion.store>";

export async function sendOtpEmail(to: string, code: string) {
  const html = `
  <div style="background:#05080F;padding:40px 20px;font-family:monospace;color:#E2E8F0;">
    <div style="max-width:420px;margin:0 auto;border:1px solid rgba(0,240,255,0.3);padding:32px 24px;">
      <p style="color:#00F0FF;letter-spacing:2px;font-size:12px;margin:0 0 16px;">[ LASTQUESTION.CO // SECURITY VERIFICATION ]</p>
      <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">Kode Verifikasi Kamu</h1>
      <p style="color:#94A3B8;font-size:13px;margin:0 0 24px;">Masukkan kode 6-digit ini untuk menyelesaikan pendaftaran akun LASTQUESTION.CO. Kode berlaku selama 10 menit.</p>
      <div style="background:rgba(0,240,255,0.08);border:1px dashed rgba(0,240,255,0.5);padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;letter-spacing:12px;color:#00F0FF;font-weight:bold;">${code}</span>
      </div>
      <p style="color:#64748B;font-size:11px;margin:0;">Jika kamu tidak meminta kode ini, abaikan email ini. Jangan bagikan kode ini ke siapa pun termasuk pihak yang mengaku sebagai admin.</p>
    </div>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `${code} adalah kode verifikasi LASTQUESTION.CO kamu`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${errText}`);
  }

  return res.json();
}
