import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import type { User } from "@supabase/supabase-js";

const EXTERNAL_AUTH_URL = "https://www.jaxtrax.net/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No session found, redirect to external auth
        window.location.href = EXTERNAL_AUTH_URL;
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // Session lost, redirect to external auth
        window.location.href = EXTERNAL_AUTH_URL;
        return;
      }
      setUser(session.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = EXTERNAL_AUTH_URL;
  };

  return { user, loading, signOut };
};
