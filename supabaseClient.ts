import { supabase } from "@/integrations/supabase/client";

// Set up cookie syncing for cross-domain authentication
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

// Export the supabase client
export { supabase };
