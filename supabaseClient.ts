import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://kvnxbwefougjfaozrepm.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bnhid2Vmb3VnamZhb3pyZXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc1NTYsImV4cCI6MjA3NzI1MzU1Nn0.9ptHhkQUEFe68zafUd92Vh1yPnYKEpgEP4XYbeGMvaU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "supabase.auth.token",
  },
});
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    // Delete cookies
    document.cookie = `my-access-token=; Domain=.jaxtrax.net; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
    document.cookie = `my-refresh-token=; Domain=.jaxtrax.net; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
  } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    // Set cookies
    const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years
    document.cookie = `my-access-token=${session.access_token}; Domain=.jaxtrax.net; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
    document.cookie = `my-refresh-token=${session.refresh_token}; Domain=.jaxtrax.net; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
  }
});
