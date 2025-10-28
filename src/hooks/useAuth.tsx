import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import type { User } from "@supabase/supabase-js";

const EXTERNAL_AUTH_URL = "https://www.jaxtrax.net/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    const checkSession = async () => {
      // First, try to get existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        setLoading(false);
        return;
      }

      // If no session, wait a moment before redirecting (allows cookies to be read)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check again after waiting
      const { data: { session: retrySession } } = await supabase.auth.getSession();
      
      if (retrySession) {
        setUser(retrySession.user);
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
