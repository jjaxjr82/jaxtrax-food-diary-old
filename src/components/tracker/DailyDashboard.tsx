import { useState, useEffect } from "react";
import type { DailyStats } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  useEffect(() => {
    setWeight(dailyStats?.weight?.toString() || "");
    setCaloriesBurned(dailyStats?.calories_burned?.toString() || "");
    setCurrentGoal(dailyStats?.weekly_goal || "lose1");
  }, [dailyStats]);

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
    const BASE_TDEE = 2026;
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
  
  // Macronutrient goals based on specification
  const proteinGoal = lastKnownWeight ? lastKnownWeight * 0.8 : null;
  const carbsGoal = lastKnownWeight ? (calorieGoal * 0.50) / 4 : null;
  const fatsGoal = lastKnownWeight ? (calorieGoal * 0.30) / 9 : null;
  const fiberGoal = lastKnownWeight ? (calorieGoal / 1000) * 14 : null;

  const goalOptions = [
    { value: "gain2", label: "Gain 2 lbs/week" },
    { value: "gain1", label: "Gain 1 lb/week" },
    { value: "maintain", label: "Maintain weight" },
    { value: "lose1", label: "Lose 1 lb/week" },
    { value: "lose2", label: "Lose 2 lbs/week" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#002855]">Daily Dashboard</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Weekly Goal:</span>
          <Select value={currentGoal} onValueChange={setCurrentGoal}>
            <SelectTrigger className="w-[180px]">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Calories</span>
          <div className="text-2xl font-bold text-[#002855]">
            {totals.calories.toFixed(0)}/{calorieGoal}
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Protein</span>
          <div className="text-2xl font-bold text-[#002855]">
            {totals.protein.toFixed(0)}/{proteinGoal ? proteinGoal.toFixed(0) : "--"}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Carbs</span>
          <div className="text-2xl font-bold text-[#002855]">
            {totals.carbs.toFixed(0)}/{carbsGoal ? carbsGoal.toFixed(0) : "--"}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Fats</span>
          <div className="text-2xl font-bold text-[#002855]">
            {totals.fats.toFixed(0)}/{fatsGoal ? fatsGoal.toFixed(0) : "--"}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Fiber</span>
          <div className="text-2xl font-bold text-[#002855]">
            {totals.fiber.toFixed(0)}/{fiberGoal ? fiberGoal.toFixed(0) : "--"}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Burned</span>
          <span className="text-2xl font-bold text-[#CE1141]">
            {dailyStats?.calories_burned ? dailyStats.calories_burned.toFixed(0) : "--"}
          </span>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (lbs)
            </label>
            <Input
              type="number"
              step="0.1"
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calories Burned
            </label>
            <Input
              type="number"
              placeholder="Enter calories"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
            />
          </div>
          <div>
            <Button onClick={handleSaveStats} className="w-full">
              Save Stats
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyDashboard;
