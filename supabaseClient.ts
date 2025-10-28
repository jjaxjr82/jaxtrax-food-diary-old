import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kvnxbwefougjfaozrepm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bnhid2Vmb3VnZmFvenJlcG0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwNjg5NDg4MywiZXhwIjoxNzA5NDg2ODgzfQ.B92j8nXeQXQ8Q1rJpM5a6B4v3sZ4kQm81qH7Q_SA8Zg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "supabase.auth.token",
    cookieOptions: {
      domain: ".jaxtrax.net",
      sameSite: "lax",
      secure: true
    }
  }
});
