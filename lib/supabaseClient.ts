import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// "Remember Me" storage adapter -- session key lives in EITHER localStorage
// (persists across browser restarts, until explicit logout) or sessionStorage
// (cleared when the browser/tab closes), decided by the `qco2_remember` flag
// written by the login page's checkbox. Defaults to remembered (localStorage)
// when the flag hasn't been set yet, matching normal expectations for a
// returning visitor. supabase.auth.signOut() calls removeItem(), which always
// wipes BOTH backends -- so logout reliably ends the session regardless of
// which one was active.
const REMEMBER_FLAG = "qco2_remember";

function isRemembered(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(REMEMBER_FLAG) !== "0";
}

const rememberMeStorage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return null;
    return isRemembered() ? window.localStorage.getItem(key) : window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    if (isRemembered()) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: rememberMeStorage,
  },
});

/** Call right before signInWithPassword so the session write respects the checkbox. */
export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_FLAG, remember ? "1" : "0");
}
