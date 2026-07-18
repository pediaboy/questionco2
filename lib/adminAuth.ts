"use client";

// Shared client-side admin session flag so navigating between /admin sub-pages
// (e.g. /admin -> /admin/leaderboard) doesn't force a re-login every time.
// NOTE: this mirrors the existing hardcoded-credential pattern already used in
// app/admin/page.tsx — not a real auth system, just a lightweight gate.
const KEY = "qco2_admin_authed";

export function isAdminAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}

export function setAdminAuthed(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) sessionStorage.setItem(KEY, "1");
  else sessionStorage.removeItem(KEY);
}

export const ADMIN_USER = "admin";
export const ADMIN_PASS = "lastquestion2026";
