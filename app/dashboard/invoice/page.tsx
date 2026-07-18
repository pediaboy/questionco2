"use client";

import React, { useEffect, useState } from "react";
import { useMemberAuth } from "@/lib/MemberAuthContext";
import { FileText, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  invoice_id: string;
  tier: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function InvoicePage() {
  const { accessToken } = useMemberAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/member/invoices", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setInvoices(data.items);
        } else {
          setError("Gagal memuat invoice");
        }
      } else {
        setError("Gagal memuat invoice");
      }
    } catch (err) {
      console.error(err);
      setError("Error memuat invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchInvoices();
    }
  }, [accessToken]);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-mono block">
          [ SUBSCRIPTION // INVOICES ]
        </span>
        <h2 className="text-xl font-bold font-display text-white mt-1">
          Riwayat <span className="text-cyan-300 text-glow-cyan">Invoice</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-1">Daftar tagihan dan status langganan VIP Anda.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-black/40 border border-white/5 chamfer-sm animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-black/30 border border-dashed border-red-500/20 chamfer-sm">
          <span className="text-xs text-red-400 font-mono">[ {error} ]</span>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-black/30 border border-dashed border-white/10 chamfer-sm">
          <FileText size={20} className="text-slate-600 mx-auto mb-2" strokeWidth={1.5} />
          <span className="text-xs text-slate-500 font-mono">[ BELUM ADA TRANSAKSI ]</span>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const isConfirmed = inv.status === "confirmed";
            const isPending = inv.status === "pending";
            let statusColor = "text-yellow-400";
            let statusBg = "bg-yellow-950/20 border-yellow-500/20";
            let statusText = "PENDING";

            if (isConfirmed) {
              statusColor = "text-emerald-400";
              statusBg = "bg-emerald-950/20 border-emerald-500/20";
              statusText = "TERKONFIRMASI";
            } else if (inv.status === "failed" || inv.status === "cancelled") {
              statusColor = "text-rose-400";
              statusBg = "bg-rose-950/20 border-rose-500/20";
              statusText = inv.status.toUpperCase();
            }

            return (
              <div
                key={inv.id}
                className="chamfer-sm bg-[#0b0f18]/60 border border-white/10 p-4 relative flex flex-col justify-between"
              >
                {/* Tactical Corner Accents */}
                <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t border-l border-cyan-400/40" />
                <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b border-r border-cyan-400/40" />

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-white block">
                      {inv.invoice_id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                      Tier: <span className="text-cyan-300 font-bold uppercase">{inv.tier}</span>
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[8.5px] font-bold tracking-wider font-mono border rounded-none ${statusBg} ${statusColor}`}
                  >
                    [ {statusText} ]
                  </span>
                </div>

                <div className="flex items-end justify-between mt-2 pt-2 border-t border-dashed border-white/5">
                  <div>
                    <span className="text-[9px] text-[#94A3B8] uppercase tracking-wider font-mono block">
                      TANGGAL
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(inv.created_at)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-[#94A3B8] uppercase tracking-wider font-mono block">
                      TOTAL BAYAR
                    </span>
                    <span className="font-mono font-bold text-sm text-cyan-300">
                      {formatRupiah(inv.amount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
