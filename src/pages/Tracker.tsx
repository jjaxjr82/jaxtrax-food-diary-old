import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Meal, DailyStats } from "@/types";
import DailyDashboard from "@/components/tracker/DailyDashboard";
import SupplementsSection from "@/components/tracker/SupplementsSection";
import AddMealSection from "@/components/tracker/AddMealSection";
import MealsList from "@/components/tracker/MealsList";
import TrackerHeader from "@/components/tracker/TrackerHeader";

const Tracker = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDailyData();
    }
  }, [user, selectedDate]);

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

      // Fetch daily stats
      const { data: statsData, error: statsError } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", selectedDate)
        .single();

      if (statsError && statsError.code !== "PGRST116") throw statsError;
      setDailyStats(statsData);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <TrackerHeader
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          signOut={signOut}
        />

        <DailyDashboard
          totals={totals}
          dailyStats={dailyStats}
          weeklyGoal={dailyStats?.weekly_goal || "lose1"}
        />

        <SupplementsSection
          userId={user?.id || ""}
          selectedDate={selectedDate}
          meals={meals}
          onSupplementToggle={fetchDailyData}
        />

        <AddMealSection
          userId={user?.id || ""}
          selectedDate={selectedDate}
          onMealAdded={fetchDailyData}
        />

        <MealsList
          meals={meals}
          onMealUpdate={fetchDailyData}
          onMealDelete={fetchDailyData}
        />
      </div>
    </div>
  );
};

export default Tracker;
