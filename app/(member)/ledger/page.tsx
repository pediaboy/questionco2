"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { Receipt, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Invoice {
  id: string;
  invoice_id: string;
  tier: string;
  amount: number;
  status: string;
  created_at: string;
}

const STATUS_META: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; label: string }> = {
  confirmed: { icon: CheckCircle2, color: "text-emerald-400", label: "LUNAS" },
  pending: { icon: Clock, color: "text-amber-400", label: "PENDING" },
  rejected: { icon: XCircle, color: "text-rose-400", label: "DITOLAK" },
};

export default function LedgerPage() {
  const { accessToken } = useMemberAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/member/invoices", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvoices(d.items || []);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const formatRupiah = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);

  const totalPaid = invoices.filter((i) => i.status === "confirmed").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ FINANCIAL // LEDGER ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Riwayat <span className="text-cyan-300 text-glow-cyan">Transaksi</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Riwayat pembayaran dan aktivitas langganan akun Anda.</p>
      </div>

      <div className="chamfer-sm border border-cyan-400/20 bg-[#0b0f18] p-4 mb-5 text-center">
        <p className="text-[9px] tracking-widest text-white/40 uppercase mb-1">Total Terkonfirmasi</p>
        <p className="text-2xl font-bold font-mono text-cyan-300">{formatRupiah(totalPaid)}</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-white/5 animate-pulse chamfer-sm" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-10 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <Receipt size={20} className="text-white/20 mx-auto mb-2" />
          <span className="text-[11px] text-slate-500 font-mono">[ BELUM ADA TRANSAKSI ]</span>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const meta = STATUS_META[inv.status] || STATUS_META.pending;
            const Icon = meta.icon;
            return (
              <div key={inv.id} className="chamfer-sm border border-white/10 bg-[#0b0f18] p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white font-mono text-[12px] font-bold">{inv.invoice_id}</span>
                  <span className={`flex items-center gap-1 text-[10px] font-bold font-mono ${meta.color}`}>
                    <Icon size={11} /> {meta.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-[11px]">{inv.tier}</span>
                  <span className="text-white font-mono font-bold text-[13px]">{formatRupiah(inv.amount)}</span>
                </div>
                <p className="text-white/25 text-[10px] font-mono mt-1">
                  {new Date(inv.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
