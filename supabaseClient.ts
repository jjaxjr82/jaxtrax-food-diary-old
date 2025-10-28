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
    cookieOptions: {
      domain: ".jaxtrax.net",
      sameSite: "lax",
      secure: true,
    },
  },
});
