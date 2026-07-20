"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, Check, X, RotateCcw, Edit2, Trash2, BarChart3, UserPlus, KeyRound, Trophy, Radio, ListPlus, Cpu, ShieldAlert, SlidersHorizontal, Terminal } from "lucide-react";
import { isAdminAuthed, setAdminAuthed, ADMIN_USER, ADMIN_PASS } from "@/lib/adminAuth";

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
  profit_pips?: number | null;
  win_rate?: number | null;
  total_trade?: number | null;
};

type QuickMenuItem = {
  id: string;
  label: string;
  icon_key: string;
  href: string;
  sort_order: number;
  active: boolean;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
};

function daysLeft(expired_at: string | null) {
  if (!expired_at) return null;
  const diff = new Date(expired_at).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  // New Account form state
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPass, setNewAccPass] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccLoading, setNewAccLoading] = useState(false);
  const [newAccMessage, setNewAccMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [quickMenuItems, setQuickMenuItems] = useState<QuickMenuItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPinned, setAnnPinned] = useState(false);

  // Global Stats State
  const [winRate, setWinRate] = useState<string>("");
  const [totalTrade, setTotalTrade] = useState<string>("");
  const [profitPips, setProfitPips] = useState<string>("");
  const [kelasCompleted, setKelasCompleted] = useState<string>("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsMessage, setStatsMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, profRes, qmRes, annRes, statsRes] = await Promise.all([
      fetch("/api/admin/invoices").then((r) => r.json()),
      fetch("/api/admin/profiles").then((r) => r.json()),
      fetch("/api/admin/quick-menu").then((r) => r.json().catch(() => ({ success: false, items: [] }))),
      fetch("/api/admin/announcements").then((r) => r.json().catch(() => ({ success: false, items: [] }))),
      fetch("/api/admin/global-stats").then((r) => r.json().catch(() => ({ success: false, stats: null }))),
    ]);
    if (invRes.success) setInvoices(invRes.invoices);
    if (profRes.success) setProfiles(profRes.profiles);
    if (qmRes.success) setQuickMenuItems(qmRes.items);
    if (annRes.success) setAnnouncements(annRes.items);
    if (statsRes.success && statsRes.stats) {
      setWinRate(statsRes.stats.win_rate?.toString() ?? "");
      setTotalTrade(statsRes.stats.total_trade?.toString() ?? "");
      setProfitPips(statsRes.stats.profit_pips?.toString() ?? "");
      setKelasCompleted(statsRes.stats.kelas_completed?.toString() ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  useEffect(() => {
    if (isAdminAuthed()) setAuthed(true);
    setCheckedSession(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      setAdminAuthed(true);
      setAuthed(true);
    } else {
      alert("Kredensial salah");
    }
  }

  function handleLogout() {
    setAdminAuthed(false);
    setAuthed(false);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setNewAccLoading(true);
    setNewAccMessage(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAccEmail, password: newAccPass, full_name: newAccName }),
      });
      const json = await res.json();
      if (json.success) {
        setNewAccMessage({ text: `Akun ${newAccEmail} berhasil dibuat & langsung aktif.`, type: "success" });
        setNewAccEmail("");
        setNewAccPass("");
        setNewAccName("");
        load();
      } else {
        setNewAccMessage({ text: "Gagal: " + json.error, type: "error" });
      }
    } catch (err: any) {
      setNewAccMessage({ text: "Gagal: " + err.message, type: "error" });
    } finally {
      setNewAccLoading(false);
    }
  }

  async function editAccountCredentials(p: Profile) {
    const newEmail = prompt("Edit email member:", p.email);
    if (newEmail === null) return;
    const newPassword = prompt("Set password baru (kosongkan jika tidak ingin ganti):", "");
    if (newPassword === null) return;

    const res = await fetch("/api/admin/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_id: p.id,
        email: newEmail !== p.email ? newEmail : undefined,
        password: newPassword ? newPassword : undefined,
      }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    alert("Kredensial berhasil diperbarui.");
    load();
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

  async function handleResetStats(p: Profile) {
    if (!confirm(`Reset statistik trading untuk ${p.email}?`)) return;
    const res = await fetch("/api/admin/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, reset_stats: true }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function editLeaderboardStats(p: Profile) {
    const profitInput = prompt(
      `Edit Profit/Loss (pips) untuk ${p.email}:`,
      (p.profit_pips ?? 0).toString()
    );
    if (profitInput === null) return; // cancelled
    const winRateInput = prompt(
      `Edit Win Rate (%) untuk ${p.email}:`,
      (p.win_rate ?? 0).toString()
    );
    if (winRateInput === null) return;
    const totalTradeInput = prompt(
      `Edit Total Trade untuk ${p.email}:`,
      (p.total_trade ?? 0).toString()
    );
    if (totalTradeInput === null) return;

    const res = await fetch("/api/admin/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: p.id,
        profit_pips: Number(profitInput),
        win_rate: Number(winRateInput),
        total_trade: Number(totalTradeInput),
      }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function toggleQuickMenu(id: string, active: boolean) {
    const res = await fetch("/api/admin/quick-menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function editQuickMenu(id: string, currentLabel: string, currentHref: string) {
    const label = prompt("Edit label menu:", currentLabel);
    if (label === null) return; // cancelled
    const href = prompt("Edit href menu:", currentHref);
    if (href === null) return; // cancelled

    const res = await fetch("/api/admin/quick-menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, label, href }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("Hapus pengumuman ini?")) return;
    const res = await fetch(`/api/admin/announcements?id=${id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    load();
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: annTitle, body: annBody, pinned: annPinned }),
    });
    const json = await res.json();
    if (!json.success) return alert("Gagal: " + json.error);
    setAnnTitle("");
    setAnnBody("");
    setAnnPinned(false);
    load();
  }

  async function handleUpdateStats(e: React.FormEvent) {
    e.preventDefault();
    setStatsLoading(true);
    setStatsMessage(null);
    try {
      const res = await fetch("/api/admin/global-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          win_rate: winRate === "" ? null : Number(winRate),
          total_trade: totalTrade === "" ? null : Number(totalTrade),
          profit_pips: profitPips === "" ? null : Number(profitPips),
          kelas_completed: kelasCompleted === "" ? null : Number(kelasCompleted),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatsMessage({ text: "Statistik global berhasil diperbarui!", type: "success" });
        if (json.stats) {
          setWinRate(json.stats.win_rate?.toString() ?? "");
          setTotalTrade(json.stats.total_trade?.toString() ?? "");
          setProfitPips(json.stats.profit_pips?.toString() ?? "");
          setKelasCompleted(json.stats.kelas_completed?.toString() ?? "");
        }
      } else {
        setStatsMessage({ text: "Gagal: " + (json.message || "Unknown error"), type: "error" });
      }
    } catch (err: any) {
      setStatsMessage({ text: "Gagal: " + err.message, type: "error" });
    } finally {
      setStatsLoading(false);
    }
  }

  if (!checkedSession) {
    return null;
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
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display font-bold text-white text-xl uppercase">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/leaderboard" className="text-yellow-400 flex items-center gap-1.5 text-xs">
            <Trophy size={14} /> Leaderboard
          </Link>
          <Link href="/admin/sinyal" className="text-emerald-400 flex items-center gap-1.5 text-xs">
            <Radio size={14} /> Sinyal
          </Link>
          <Link href="/admin/entry-member" className="text-cyan-300 flex items-center gap-1.5 text-xs">
            <ListPlus size={14} /> Entry
          </Link>
          <button onClick={load} className="text-cyan-300 flex items-center gap-1.5 text-xs">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400 text-xs">
            Logout
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10 flex-wrap">
        <Link href="/engine-settings" className="text-cyan-300 flex items-center gap-1.5 text-[11px]">
          <Cpu size={13} /> Engine Config
        </Link>
        <Link href="/risk-management" className="text-cyan-300 flex items-center gap-1.5 text-[11px]">
          <ShieldAlert size={13} /> Risk Params
        </Link>
        <Link href="/strategy-editor" className="text-cyan-300 flex items-center gap-1.5 text-[11px]">
          <SlidersHorizontal size={13} /> Strategy Editor
        </Link>
        <Link href="/system-logs" className="text-cyan-300 flex items-center gap-1.5 text-[11px]">
          <Terminal size={13} /> System Logs
        </Link>
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
        [ TAMBAH AKUN MANUAL — LANGSUNG AKTIF, TANPA OTP ]
      </h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 mb-8 p-4">
        <p className="text-[10.5px] text-white/40 mb-3 leading-relaxed">
          Buat akun member baru secara langsung — email otomatis terverifikasi (tidak perlu OTP), member bisa langsung login pakai email &amp; password yang kamu set di sini.
        </p>
        <form onSubmit={handleCreateAccount} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="USERNAME / NAMA"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm"
            />
            <input
              type="email"
              required
              placeholder="EMAIL"
              value={newAccEmail}
              onChange={(e) => setNewAccEmail(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm"
            />
            <input
              type="text"
              required
              placeholder="PASSWORD (min. 6 karakter)"
              value={newAccPass}
              onChange={(e) => setNewAccPass(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm"
            />
          </div>

          {newAccMessage && (
            <div
              className={`text-xs font-mono font-bold ${
                newAccMessage.type === "success" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              [ {newAccMessage.text} ]
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={newAccLoading}
              className="chamfer-btn bg-cyan-400 text-black font-bold text-xs tracking-wider px-4 py-2 hover:bg-cyan-300 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <UserPlus size={14} /> {newAccLoading ? "MEMBUAT..." : "BUAT AKUN"}
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">
        [ MEMBERS — EXPIRING SOON FIRST ]
      </h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 overflow-x-auto mb-8">
        <table className="w-full text-[12px] text-left">
          <thead>
            <tr className="text-white/40 border-b border-cyan-400/15">
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Expired</th>
              <th className="p-3">Sisa Hari</th>
              <th className="p-3">Pips</th>
              <th className="p-3">Win Rate</th>
              <th className="p-3">Trade</th>
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
                  <td className="p-3 font-mono">
                    <span className={(p.profit_pips ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {(p.profit_pips ?? 0) >= 0 ? "+" : ""}
                      {p.profit_pips ?? 0}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-cyan-300">{p.win_rate ?? 0}%</td>
                  <td className="p-3 font-mono text-white/60">{p.total_trade ?? 0}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => overrideExtend(p)} className="text-cyan-300 underline text-[11px]">
                        Extend
                      </button>
                      <button
                        onClick={() => editLeaderboardStats(p)}
                        title="Edit statistik leaderboard (Profit Pips / Win Rate / Total Trade)"
                        className="text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5 text-[11px]"
                      >
                        <BarChart3 size={13} /> Leaderboard
                      </button>
                      <button
                        onClick={() => editAccountCredentials(p)}
                        title="Set email / username / password akun ini secara langsung"
                        className="text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-0.5 text-[11px]"
                      >
                        <KeyRound size={13} /> Akun
                      </button>
                      <button
                        onClick={() => handleResetStats(p)}
                        title="Reset statistik trading"
                        className="text-red-400 hover:text-red-300 flex items-center gap-0.5 text-[11px]"
                      >
                        <RotateCcw size={13} /> Reset
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-white/30">
                  Belum ada member
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">
        [ QUICK MENU MANAGEMENT ]
      </h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 mb-8 overflow-x-auto">
        <table className="w-full text-[12px] text-left">
          <thead>
            <tr className="text-white/40 border-b border-cyan-400/15">
              <th className="p-3">Label</th>
              <th className="p-3">Icon Key</th>
              <th className="p-3">Href</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {quickMenuItems.map((item) => (
              <tr key={item.id} className="border-b border-cyan-400/10 text-white/80">
                <td className="p-3 font-semibold text-cyan-300">{item.label}</td>
                <td className="p-3 font-mono text-white/60">{item.icon_key}</td>
                <td className="p-3 font-mono text-white/60">{item.href}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggleQuickMenu(item.id, !item.active)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      item.active
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                        : "bg-red-950/40 border-red-500/40 text-red-400"
                    }`}
                  >
                    {item.active ? "ACTIVE" : "INACTIVE"}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => editQuickMenu(item.id, item.label, item.href)}
                    className="text-cyan-300 hover:underline flex items-center gap-1"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {quickMenuItems.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-white/30">
                  Belum ada menu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">
        [ ANNOUNCEMENTS MANAGEMENT ]
      </h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 mb-6 p-4">
        {/* List */}
        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="border-b border-cyan-400/10 pb-3 last:border-0 last:pb-0 flex items-start justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-xs">{ann.title}</h3>
                  {ann.pinned && (
                    <span className="text-[8px] bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 px-1 py-0.2 rounded font-mono font-bold">
                      PINNED
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/60 mt-1 whitespace-pre-wrap font-sans">{ann.body}</p>
                <span className="text-[9px] text-white/30 font-mono mt-1 block">
                  {new Date(ann.created_at).toLocaleString("id-ID")}
                </span>
              </div>
              <button
                onClick={() => deleteAnnouncement(ann.id)}
                className="text-red-400 hover:text-red-300 shrink-0 p-1"
                title="Hapus Pengumuman"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-center text-white/30 text-xs py-4 font-mono">[ BELUM ADA PENGUMUMAN ]</p>
          )}
        </div>

        {/* Form separator */}
        <div className="border-t border-cyan-400/15 pt-4">
          <h3 className="text-[10px] text-cyan-300 font-bold tracking-wider font-mono mb-3 uppercase">
            [ POST NEW ANNOUNCEMENT ]
          </h3>
          <form onSubmit={handlePostAnnouncement} className="space-y-3">
            <input
              type="text"
              required
              placeholder="JUDUL PENGUMUMAN"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm"
            />
            <textarea
              required
              rows={3}
              placeholder="ISI PENGUMUMAN..."
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-sans resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="w-3.5 h-3.5 accent-cyan-400 bg-transparent border-cyan-400/20"
                />
                Pin pengumuman ini di atas
              </label>
              <button
                type="submit"
                className="chamfer-btn bg-cyan-400 text-black font-bold text-xs tracking-wider px-4 py-2 hover:bg-cyan-300"
              >
                SUBMIT PENGUMUMAN
              </button>
            </div>
          </form>
        </div>
      </div>

      <h2 className="text-white/70 text-sm font-bold mb-3 tracking-wide">
        [ STATISTIK GLOBAL ]
      </h2>
      <div className="border border-cyan-400/20 chamfer-sm bg-[#0b0f18]/70 mb-8 p-4">
        <form onSubmit={handleUpdateStats} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-cyan-300 font-bold tracking-wider font-mono mb-1 uppercase">
                Win Rate (%)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="WIN RATE"
                value={winRate}
                onChange={(e) => setWinRate(e.target.value)}
                className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-cyan-300 font-bold tracking-wider font-mono mb-1 uppercase">
                Total Trade
              </label>
              <input
                type="number"
                required
                placeholder="TOTAL TRADE"
                value={totalTrade}
                onChange={(e) => setTotalTrade(e.target.value)}
                className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-cyan-300 font-bold tracking-wider font-mono mb-1 uppercase">
                Profit / Loss (pips)
              </label>
              <input
                type="number"
                required
                placeholder="PROFIT / LOSS (PIPS)"
                value={profitPips}
                onChange={(e) => setProfitPips(e.target.value)}
                className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-cyan-300 font-bold tracking-wider font-mono mb-1 uppercase">
                Kelas Selesai
              </label>
              <input
                type="number"
                required
                placeholder="KELAS SELESAI"
                value={kelasCompleted}
                onChange={(e) => setKelasCompleted(e.target.value)}
                className="w-full bg-[#05080f] border border-cyan-400/25 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/70 rounded-sm font-mono"
              />
            </div>
          </div>

          {statsMessage && (
            <div
              className={`text-xs font-mono font-bold ${
                statsMessage.type === "success" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              [ {statsMessage.text} ]
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={statsLoading}
              className="chamfer-btn bg-cyan-400 text-black font-bold text-xs tracking-wider px-4 py-2 hover:bg-cyan-300 disabled:opacity-50 transition-colors"
            >
              {statsLoading ? "UPDATING..." : "[ UPDATE STATS ]"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
