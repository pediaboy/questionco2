"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, RefreshCw, Check, X } from "lucide-react";

type Invoice = {
  id: string;
  invoice_id: string;
  email: string;
  tier: string;
  amount: number;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  email: string;
  role: string;
  tier: string | null;
  expired_at: string | null;
};

function daysLeft(expired_at: string | null) {
  if (!expired_at) return null;
  const diff = new Date(expired_at).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, profRes] = await Promise.all([
      fetch("/api/admin/invoices").then((r) => r.json()),
      fetch("/api/admin/profiles").then((r) => r.json()),
    ]);
    if (invRes.success) setInvoices(invRes.invoices);
    if (profRes.success) setProfiles(profRes.profiles);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (user === "admin" && pass === "lastquestion2026") {
      setAuthed(true);
    } else {
      alert("Kredensial salah");
    }
  }

  async function confirmInvoice(inv: Invoice) {
    if (!confirm(`Konfirmasi invoice ${inv.invoice_id} untuk ${inv.email}?`)) return;
    const res = await fetch("/api/admin/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inv.id, status: "confirmed", days: 30 }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function rejectInvoice(inv: Invoice) {
    const res = await fetch("/api/admin/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inv.id, status: "rejected" }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function overrideExtend(p: Profile) {
    const days = prompt("Perpanjang berapa hari dari sekarang?", "30");
    if (!days) return;
    const expiredAt = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch("/api/admin/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, role: "vip_member", expired_at: expiredAt }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  if (!authed) {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-6">
        <p className="text-[10.5px] tracking-[0.3em] text-cyan-300/70 font-semibold mb-2 text-center">
          [ ADMIN // CONTROL PANEL ]
        </p>
        <h1 className="font-display font-bold text-white text-xl text-center mb-6 uppercase">
          Restricted Access
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            placeholder="USERNAME"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="chamfer-sm bg-[#0b0f18] border border-cyan-400/25 px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none"
          />
          <input
            type="password"
            placeholder="PASSWORD"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="chamfer-sm bg-[#0b0f18] border border-cyan-400/25 px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none"
          />
          <button className="chamfer-btn bg-cyan-400 text-black font-bold text-[13px] tracking-wide py-3 mt-2 flex items-center justify-center gap-2">
            <ShieldCheck size={16} /> MASUK
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-white text-xl uppercase">Admin Panel</h1>
        <button onClick={load} className="text-cyan-300 flex items-center gap-1.5 text-xs">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">
        [ INVOICES — PENDING VERIFICATION ]
      </h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 mb-8 overflow-x-auto">
        <table className="w-full text-[12px] text-left">
          <thead>
            <tr className="text-white/40 border-b border-cyan-400/15">
              <th className="p-3">Invoice</th>
              <th className="p-3">Email</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Jumlah</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-cyan-400/10 text-white/80">
                <td className="p-3 font-mono">{inv.invoice_id}</td>
                <td className="p-3">{inv.email}</td>
                <td className="p-3">{inv.tier}</td>
                <td className="p-3">Rp {inv.amount.toLocaleString("id-ID")}</td>
                <td className="p-3">
                  <span
                    className={
                      inv.status === "confirmed"
                        ? "text-emerald-400"
                        : inv.status === "rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="p-3">
                  {inv.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => confirmInvoice(inv)} className="text-emerald-400">
                        <Check size={16} />
                      </button>
                      <button onClick={() => rejectInvoice(inv)} className="text-red-400">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-white/30">
                  Belum ada invoice
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">
        [ MEMBERS — EXPIRING SOON FIRST ]
      </h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 overflow-x-auto">
        <table className="w-full text-[12px] text-left">
          <thead>
            <tr className="text-white/40 border-b border-cyan-400/15">
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Expired</th>
              <th className="p-3">Sisa Hari</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => {
              const dl = daysLeft(p.expired_at);
              return (
                <tr key={p.id} className="border-b border-cyan-400/10 text-white/80">
                  <td className="p-3">{p.email}</td>
                  <td className="p-3">
                    <span className={p.role === "vip_member" ? "text-yellow-400" : "text-white/50"}>
                      {p.role}
                    </span>
                  </td>
                  <td className="p-3">{p.tier || "-"}</td>
                  <td className="p-3">
                    {p.expired_at ? new Date(p.expired_at).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="p-3">
                    {dl !== null ? (
                      <span className={dl <= 7 ? "text-red-400 font-bold" : "text-white/60"}>
                        {dl}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3">
                    <button onClick={() => overrideExtend(p)} className="text-cyan-300 underline text-[11px]">
                      Extend
                    </button>
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-white/30">
                  Belum ada member
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
