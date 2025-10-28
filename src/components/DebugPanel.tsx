import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Card } from "@/components/ui/card";

export const DebugPanel = () => {
  const [session, setSession] = useState<any>(null);
  const [cookies, setCookies] = useState<string>("");

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();
    setCookies(document.cookie);

    // Refresh every 2 seconds
    const interval = setInterval(() => {
      fetchSession();
      setCookies(document.cookie);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4 mb-4 bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700">
      <h3 className="font-bold text-lg mb-2">🐛 Debug Panel</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-1">Supabase Session:</h4>
          <pre className="text-xs bg-white dark:bg-black p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold mb-1">Cookies:</h4>
          <pre className="text-xs bg-white dark:bg-black p-2 rounded overflow-auto">
            {cookies || "(no cookies)"}
          </pre>
        </div>
      </div>
    </Card>
  );
};
