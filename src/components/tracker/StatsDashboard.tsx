import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, Calendar, Award, Flame } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";

interface StatsDashboardProps {
  userId: string;
}

interface Stats {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFats: number;
  avgFiber: number;
  streak: number;
  weightChange: number | null;
  topFoods: { food_name: string; count: number }[];
  mealDistribution: { meal_type: string; count: number }[];
}

const StatsDashboard = ({ userId }: StatsDashboardProps) => {
  const [weeklyStats, setWeeklyStats] = useState<Stats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const weekAgo = format(subDays(now, 7), "yyyy-MM-dd");
      const monthAgo = format(subDays(now, 30), "yyyy-MM-dd");

      // Fetch weekly stats
      const weeklyData = await calculateStats(weekAgo, userId);
      setWeeklyStats(weeklyData);

      // Fetch monthly stats
      const monthlyData = await calculateStats(monthAgo, userId);
      setMonthlyStats(monthlyData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (fromDate: string, userId: string): Promise<Stats> => {
    // Fetch meals
    const { data: meals } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .gte("date", fromDate);

    // Calculate averages
    const totalDays = meals ? new Set(meals.map(m => m.date)).size : 0;
    const totalCalories = meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0;
    const totalProtein = meals?.reduce((sum, m) => sum + (m.protein || 0), 0) || 0;
    const totalCarbs = meals?.reduce((sum, m) => sum + (m.carbs || 0), 0) || 0;
    const totalFats = meals?.reduce((sum, m) => sum + (m.fats || 0), 0) || 0;
    const totalFiber = meals?.reduce((sum, m) => sum + (m.fiber || 0), 0) || 0;

    // Calculate streak
    const { data: allMeals } = await supabase
      .from("meals")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    let streak = 0;
    const uniqueDates = [...new Set(allMeals?.map(m => m.date) || [])].sort().reverse();
    const today = format(new Date(), "yyyy-MM-dd");
    
    if (uniqueDates[0] === today) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = format(subDays(parseISO(uniqueDates[i - 1]), 1), "yyyy-MM-dd");
        if (uniqueDates[i] === prevDate) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Top foods
    const foodCounts: { [key: string]: number } = {};
    meals?.forEach(m => {
      foodCounts[m.food_name] = (foodCounts[m.food_name] || 0) + 1;
    });
    const topFoods = Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([food_name, count]) => ({ food_name, count }));

    // Meal distribution
    const mealCounts: { [key: string]: number } = {};
    meals?.forEach(m => {
      mealCounts[m.meal_type] = (mealCounts[m.meal_type] || 0) + 1;
    });
    const mealDistribution = Object.entries(mealCounts)
      .map(([meal_type, count]) => ({ meal_type, count }));

    // Weight change
    const { data: weights } = await supabase
      .from("daily_stats")
      .select("weight, date")
      .eq("user_id", userId)
      .gte("date", fromDate)
      .not("weight", "is", null)
      .order("date", { ascending: true });

    const weightChange = weights && weights.length >= 2
      ? Number(weights[weights.length - 1].weight) - Number(weights[0].weight)
      : null;

    return {
      avgCalories: totalDays > 0 ? Math.round(totalCalories / totalDays) : 0,
      avgProtein: totalDays > 0 ? Math.round(totalProtein / totalDays) : 0,
      avgCarbs: totalDays > 0 ? Math.round(totalCarbs / totalDays) : 0,
      avgFats: totalDays > 0 ? Math.round(totalFats / totalDays) : 0,
      avgFiber: totalDays > 0 ? Math.round(totalFiber / totalDays) : 0,
      streak,
      weightChange,
      topFoods,
      mealDistribution,
    };
  };

  const currentStats = period === "week" ? weeklyStats : monthlyStats;

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  if (!currentStats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="week">Last 7 Days</TabsTrigger>
          <TabsTrigger value="month">Last 30 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="space-y-4 mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Avg Calories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{currentStats.avgCalories}</p>
                <p className="text-xs text-muted-foreground">kcal/day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{currentStats.streak}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>

            {currentStats.weightChange !== null && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {currentStats.weightChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : currentStats.weightChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    Weight Change
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {currentStats.weightChange > 0 ? "+" : ""}
                    {currentStats.weightChange.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">lbs</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Macros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Daily Macros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Protein</p>
                  <p className="text-xl font-semibold">{currentStats.avgProtein}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carbs</p>
                  <p className="text-xl font-semibold">{currentStats.avgCarbs}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fats</p>
                  <p className="text-xl font-semibold">{currentStats.avgFats}g</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fiber</p>
                  <p className="text-xl font-semibold">{currentStats.avgFiber}g</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Foods */}
          {currentStats.topFoods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most Logged Foods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentStats.topFoods.map((food, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm">{food.food_name}</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {food.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meal Distribution */}
          {currentStats.mealDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meal Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentStats.mealDistribution.map((meal, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{meal.meal_type}</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {meal.count} items
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StatsDashboard;
