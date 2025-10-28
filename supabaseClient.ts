import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kvnxbwefougjfaozrepm.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bnhid2Vmb3VnamZhb3pyZXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc1NTYsImV4cCI6MjA3NzI1MzU1Nn0.9ptHhkQUEFe68zafUd92Vh1yPnYKEpgEP4XYbeGMvaU";

// Helper to get cookie value
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "supabase.auth.token",
  },
});

// Promise that resolves when session restoration is complete
export const sessionRestorePromise = (async () => {
  const accessToken = getCookie('my-access-token');
  const refreshToken = getCookie('my-refresh-token');

  if (accessToken && refreshToken) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.error("Error restoring session from cookies:", error);
      } else {
        console.log("Session restored from cookies");
      }
    } catch (err) {
      console.error("Failed to restore session:", err);
    }
  }
})();

supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth event:", event, session);
  if (event === "SIGNED_OUT") {
    document.cookie = `my-access-token=; Domain=.jaxtrax.net; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    document.cookie = `my-refresh-token=; Domain=.jaxtrax.net; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT`;
  } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    const maxAge = 100 * 365 * 24 * 60 * 60;
    document.cookie = `my-access-token=${session.access_token}; Domain=.jaxtrax.net; Path=/; Max-Age=${maxAge}`;
    document.cookie = `my-refresh-token=${session.refresh_token}; Domain=.jaxtrax.net; Path=/; Max-Age=${maxAge}`;
  }
});
