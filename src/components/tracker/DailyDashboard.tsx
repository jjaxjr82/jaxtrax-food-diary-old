import { useState, useEffect } from "react";
import type { DailyStats, UserSettings } from "@/types";
import { supabase } from "../../../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Scale, Flame, Settings } from "lucide-react";
import SettingsModal from "./SettingsModal";

interface DailyDashboardProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
  };
  dailyStats: DailyStats | null;
  weeklyGoal: string;
  userId: string;
  selectedDate: string;
  onUpdate: () => void;
}

const DailyDashboard = ({ totals, dailyStats, weeklyGoal, userId, selectedDate, onUpdate }: DailyDashboardProps) => {
  const { toast } = useToast();
  const [weight, setWeight] = useState(dailyStats?.weight?.toString() || "");
  const [caloriesBurned, setCaloriesBurned] = useState(dailyStats?.calories_burned?.toString() || "");
  const [currentGoal, setCurrentGoal] = useState(weeklyGoal);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setWeight(dailyStats?.weight?.toString() || "");
    setCaloriesBurned(dailyStats?.calories_burned?.toString() || "");
    setCurrentGoal(dailyStats?.weekly_goal || "lose1");
  }, [dailyStats]);

  useEffect(() => {
    fetchUserSettings();
  }, [userId]);

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      setUserSettings(data);
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  };

  const handleSaveStats = async () => {
    try {
      const { error } = await supabase
        .from("daily_stats")
        .upsert({
          user_id: userId,
          date: selectedDate,
          weight: weight ? parseFloat(weight) : null,
          calories_burned: caloriesBurned ? parseFloat(caloriesBurned) : null,
          weekly_goal: currentGoal,
        }, {
          onConflict: "user_id,date"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily stats updated",
      });
      onUpdate();
    } catch (error) {
      console.error("Error saving stats:", error);
      toast({
        title: "Error",
        description: "Failed to save stats",
        variant: "destructive",
      });
    }
  };

  const getCalorieGoal = () => {
    const BASE_TDEE = userSettings?.base_tdee || 2026;
    const burnedCalories = caloriesBurned ? parseFloat(caloriesBurned) : 0;
    const adjustedTDEE = BASE_TDEE + burnedCalories;
    
    const goals: Record<string, number> = {
      gain2: adjustedTDEE + 1000,
      gain1: adjustedTDEE + 500,
      maintain: adjustedTDEE,
      lose1: adjustedTDEE - 500,
      lose2: adjustedTDEE - 1000,
    };
    return goals[currentGoal] || adjustedTDEE;
  };

  const calorieGoal = getCalorieGoal();
  const lastKnownWeight = weight ? parseFloat(weight) : null;
  
  // Macronutrient goals based on user settings
  const proteinGoal = lastKnownWeight ? lastKnownWeight * (userSettings?.protein_per_lb || 0.8) : null;
  const carbsGoal = lastKnownWeight ? (calorieGoal * ((userSettings?.carbs_percentage || 50) / 100)) / 4 : null;
  const fatsGoal = lastKnownWeight ? (calorieGoal * ((userSettings?.fats_percentage || 30) / 100)) / 9 : null;
  const fiberGoal = lastKnownWeight ? (calorieGoal / 1000) * (userSettings?.fiber_per_1000_cal || 14) : null;

  const goalOptions = [
    { value: "gain2", label: "Gain 2 lbs/week" },
    { value: "gain1", label: "Gain 1 lb/week" },
    { value: "maintain", label: "Maintain weight" },
    { value: "lose1", label: "Lose 1 lb/week" },
    { value: "lose2", label: "Lose 2 lbs/week" },
  ];

  const getProgressPercentage = (current: number, goal: number | null) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-success";
    if (percentage >= 70) return "bg-warning";
    return "bg-primary";
  };

  const macroCards = [
    { label: "Calories", current: totals.calories, goal: calorieGoal, unit: "", icon: Flame },
    { label: "Protein", current: totals.protein, goal: proteinGoal, unit: "g", icon: TrendingUp },
    { label: "Carbs", current: totals.carbs, goal: carbsGoal, unit: "g", icon: TrendingUp },
    { label: "Fats", current: totals.fats, goal: fatsGoal, unit: "g", icon: TrendingUp },
    { label: "Fiber", current: totals.fiber, goal: fiberGoal, unit: "g", icon: TrendingUp },
  ];

  return (
    <div className="bg-card/60 backdrop-blur-md rounded-2xl shadow-elegant-lg border border-border/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          Daily Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Nutrition Goals
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Weekly Goal:</span>
          <Select value={currentGoal} onValueChange={setCurrentGoal}>
            <SelectTrigger className="w-[180px] border-border/50 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {goalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Macro Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {macroCards.map((macro) => {
          const percentage = getProgressPercentage(macro.current, macro.goal);
          const progressColor = getProgressColor(percentage);
          
          return (
            <div key={macro.label} className="bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/30 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {macro.label}
                </span>
                <macro.icon className="h-4 w-4 text-primary/60" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">
                  {macro.current.toFixed(0)}
                  <span className="text-base font-normal text-muted-foreground">
                    /{macro.goal ? macro.goal.toFixed(0) : "--"}
                    {macro.unit}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${progressColor} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Burned Calories Card */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Calories Burned Today</span>
        </div>
        <div className="text-3xl font-bold text-primary">
          {dailyStats?.calories_burned ? dailyStats.calories_burned.toFixed(0) : "0"}
        </div>
      </div>
      
      {/* Stats Input Section */}
      <div className="pt-6 border-t border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Weight (lbs)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="999"
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 999)) {
                  setWeight(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveStats();
                }
              }}
              className="border-border/50 bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Calories Burned
            </label>
            <Input
              type="number"
              min="0"
              max="9999"
              placeholder="Enter calories"
              value={caloriesBurned}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 9999)) {
                  setCaloriesBurned(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveStats();
                }
              }}
              className="border-border/50 bg-background/50"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleSaveStats} 
              className="w-full shadow-md hover:shadow-lg transition-shadow"
            >
              Save Stats
            </Button>
          </div>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userId={userId}
        onSettingsUpdate={fetchUserSettings}
      />
    </div>
  );
};

export default DailyDashboard;
