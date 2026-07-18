"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

type Tier = {
  id: string;
  label: string;
  tag: string;
  price: number;
  renewal: number;
  benefits: string[];
  recommended?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "advanced",
    label: "ADVANCED",
    tag: "[ ENTRY LEVEL ]",
    price: 300000,
    renewal: 80000,
    benefits: ["Akses 3 Channel VIP", "Sinyal 3x Sehari", "Grup Diskusi"],
  },
  {
    id: "elite",
    label: "ELITE COMMANDER",
    tag: "[ BEST VALUE - RECOMMENDED ]",
    price: 500000,
    renewal: 80000,
    benefits: [
      "Semua fitur Advanced",
      "Akses Indikator TradingView Premium",
      "Sesi Zoom Private Mingguan",
      "Prioritas Balasan Admin",
    ],
    recommended: true,
  },
];

function rupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function VipPricing() {
  const [selected, setSelected] = useState<string>("elite");
  const [loading, setLoading] = useState(false);

  const active = TIERS.find((t) => t.id === selected)!;

  async function handleInitialize() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: active.label, amount: active.price }),
      });
      const json = await res.json();
      const invoiceId = json?.invoice?.invoice_id || "PENDING-MANUAL";

      const waNumber = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "6289663874700";
      const msg = encodeURIComponent(
        `Halo Admin LASTQUESTION.CO, saya ingin upgrade ke *${active.label}*.\n\nInvoice ID: ${invoiceId}\nHarga: ${rupiah(
          active.price
        )}\n\nMohon info rekening/QRIS pembayaran & konfirmasi setelah transfer. Terima kasih.`
      );
      window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank");
    } catch {
      const waNumber = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "6289663874700";
      const msg = encodeURIComponent(
        `Halo Admin LASTQUESTION.CO, saya ingin upgrade ke *${active.label}* (${rupiah(active.price)}).`
      );
      window.open(`https://wa.me/${waNumber}?text=${msg}`, "_blank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {TIERS.map((t) => {
        const isSelected = t.id === selected;
        return (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className="hud-card chamfer relative text-left border p-5 transition-all"
            style={{
              borderColor: isSelected ? "rgba(255,215,0,0.85)" : "rgba(192,192,192,0.35)",
              background: isSelected
                ? "linear-gradient(135deg, rgba(255,215,0,0.08), #0b0f18)"
                : "#0b0f18",
              boxShadow: isSelected ? "0 0 22px rgba(255,215,0,0.35)" : "none",
            }}
          >
            <p
              className={`text-[10.5px] tracking-[0.2em] font-semibold mb-2 ${
                t.recommended ? "animate-pulse" : ""
              }`}
              style={{ color: isSelected ? "#FFD700" : "#9CA3AF" }}
            >
              {t.tag}
            </p>
            <p className="font-display font-bold text-white text-[15px] tracking-wide mb-1">
              TIER: {t.label}
            </p>
            <p className="font-mono font-bold text-white text-[26px] tracking-tight">
              {rupiah(t.price)}
            </p>

            <div className="mt-2 inline-block border border-dashed border-yellow-500/40 px-2.5 py-1">
              <span className="text-[10.5px] text-yellow-400/90 font-semibold tracking-wide">
                RENEWAL: {rupiah(t.renewal)} / Bulan
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-1.5">
              {t.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[12px] text-white/60">
                  <span className="text-cyan-300 font-bold mt-[1px]">{">"}</span>
                  {b}
                </li>
              ))}
            </ul>

            {isSelected && (
              <div className="absolute top-3 right-3 text-[10px] font-bold tracking-widest" style={{ color: "#FFD700" }}>
                ● SELECTED
              </div>
            )}
          </button>
        );
      })}

      <button
        onClick={handleInitialize}
        disabled={loading}
        className="chamfer-btn mt-2 w-full flex items-center justify-center gap-2 font-display font-bold text-[14px] tracking-[0.1em] py-4 disabled:opacity-60"
        style={{
          background: "linear-gradient(90deg, #FFD700, #ffb700)",
          color: "#05080F",
        }}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            INITIALIZE PAYMENT <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-[10px] text-white/30 text-center leading-relaxed">
        Setelah transfer, kirim bukti pembayaran via WhatsApp untuk verifikasi manual.
        Status VIP aktif dalam maks. 15 menit setelah dikonfirmasi admin.
      </p>
    </div>
  );
}
