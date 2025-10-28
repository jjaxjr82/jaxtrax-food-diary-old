import { useEffect, useState } from "react";
import { supabase, sessionRestorePromise } from "../../supabaseClient";
import type { User } from "@supabase/supabase-js";

const EXTERNAL_AUTH_URL = "https://www.jaxtrax.net/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    const checkSession = async () => {
      // CRITICAL: Wait for cookie-based session restoration to complete first
      await sessionRestorePromise;
      
      // Now check for session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        setLoading(false);
        return;
      }

      // Still no session, start redirect countdown
      setLoading(false);
      const countdown = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            window.location.href = EXTERNAL_AUTH_URL;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = EXTERNAL_AUTH_URL;
  };

  return { user, loading, signOut, redirectCountdown };
};
