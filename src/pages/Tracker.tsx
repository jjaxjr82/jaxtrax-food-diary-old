import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import type { Meal, DailyStats } from "@/types";
import DailyDashboard from "@/components/tracker/DailyDashboard";
import SupplementsSection from "@/components/tracker/SupplementsSection";
import AddMealSection from "@/components/tracker/AddMealSection";
import MealsList from "@/components/tracker/MealsList";
import TrackerHeader from "@/components/tracker/TrackerHeader";
import PendingConfirmation from "@/components/tracker/PendingConfirmation";
import { DebugPanel } from "@/components/DebugPanel";
import { getTodayInEastern } from "@/lib/dateUtils";

const Tracker = () => {
  const { user, loading: authLoading, redirectCountdown } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(getTodayInEastern());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockDay, setLockDay] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDailyData();
    }
  }, [user, selectedDate]);

  // Real-time updates for meals
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('meals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchDailyData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedDate]); // Added selectedDate to dependencies

  const fetchDailyData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch meals
      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", selectedDate)
        .order("created_at", { ascending: true });

      if (mealsError) throw mealsError;
      setMeals((mealsData || []) as Meal[]);

      // Fetch daily stats for current date
      const { data: statsData, error: statsError } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", selectedDate)
        .maybeSingle();

      if (statsError && statsError.code !== "PGRST116") throw statsError;

      // If no weight for today, fetch the most recent weight
      let currentStats = statsData;
      if (!statsData?.weight) {
        const { data: lastWeightData } = await supabase
          .from("daily_stats")
          .select("weight")
          .eq("user_id", user.id)
          .not("weight", "is", null)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastWeightData?.weight) {
          currentStats = statsData 
            ? { ...statsData, weight: lastWeightData.weight }
            : { weight: lastWeightData.weight } as any;
        }
      }

      setDailyStats(currentStats || null);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + Number(meal.calories),
      protein: acc.protein + Number(meal.protein),
      carbs: acc.carbs + Number(meal.carbs),
      fats: acc.fats + Number(meal.fats),
      fiber: acc.fiber + Number(meal.fiber),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  );

  // Show redirect message if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8 rounded-lg bg-card border shadow-lg max-w-md">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">
            Redirecting to JAXTRAX authentication in {redirectCountdown} seconds...
          </p>
          <div className="pt-4">
            <a 
              href="https://www.jaxtrax.net/auth" 
              className="text-primary hover:underline"
            >
              Click here if not redirected automatically
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleResetData = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to reset ALL data? This cannot be undone!")) return;

    try {
      await supabase.from("meals").delete().eq("user_id", user.id);
      await supabase.from("daily_stats").delete().eq("user_id", user.id);
      await supabase.from("confirmed_foods").delete().eq("user_id", user.id);
      await supabase.from("recipes").delete().eq("user_id", user.id);
      
      toast({
        title: "Success",
        description: "All data has been reset",
      });
      fetchDailyData();
    } catch (error) {
      console.error("Error resetting data:", error);
      toast({
        title: "Error",
        description: "Failed to reset data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <TrackerHeader
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          signOut={async () => {
            await supabase.auth.signOut();
            window.location.href = "https://www.jaxtrax.net/auth";
          }}
          userId={user?.id || ""}
          onResetData={handleResetData}
          lockDay={lockDay}
          onLockDayChange={setLockDay}
        />

        <DebugPanel />

        <div className="animate-slide-up space-y-6">
          <DailyDashboard
            totals={totals}
            dailyStats={dailyStats}
            weeklyGoal={dailyStats?.weekly_goal || "lose1"}
            userId={user?.id || ""}
            selectedDate={selectedDate}
            onUpdate={fetchDailyData}
          />

          <SupplementsSection
            userId={user?.id || ""}
            selectedDate={selectedDate}
            meals={meals}
            onSupplementToggle={fetchDailyData}
            disabled={lockDay}
          />

          <PendingConfirmation
            meals={meals}
            onUpdate={fetchDailyData}
          />

          <AddMealSection
            userId={user?.id || ""}
            selectedDate={selectedDate}
            onMealAdded={fetchDailyData}
            disabled={lockDay}
          />

          <MealsList
            meals={meals}
            onMealUpdate={fetchDailyData}
            onMealDelete={fetchDailyData}
            disabled={lockDay}
            userId={user?.id || ""}
            selectedDate={selectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default Tracker;
