import type { DailyStats } from "@/types";

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
}

const DailyDashboard = ({ totals, dailyStats, weeklyGoal }: DailyDashboardProps) => {
  const getCalorieGoal = () => {
    const baseCalories = 1526;
    const goals: Record<string, number> = {
      gain2: baseCalories + 1000,
      gain1: baseCalories + 500,
      maintain: baseCalories,
      lose1: baseCalories - 500,
      lose2: baseCalories - 1000,
    };
    return goals[weeklyGoal] || baseCalories;
  };

  const calorieGoal = getCalorieGoal();
  const proteinGoal = Math.round(calorieGoal * 0.3 / 4);
  const carbsGoal = Math.round(calorieGoal * 0.4 / 4);
  const fatsGoal = Math.round(calorieGoal * 0.3 / 9);
  const fiberGoal = 30;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-[#002855]">Daily Dashboard</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Calories</span>
          <div className="text-2xl font-bold text-[#002855]">
            {Math.round(totals.calories)}/{calorieGoal}
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Protein</span>
          <div className="text-2xl font-bold text-[#002855]">
            {Math.round(totals.protein)}/{proteinGoal}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Carbs</span>
          <div className="text-2xl font-bold text-[#002855]">
            {Math.round(totals.carbs)}/{carbsGoal}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Fats</span>
          <div className="text-2xl font-bold text-[#002855]">
            {Math.round(totals.fats)}/{fatsGoal}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Fiber</span>
          <div className="text-2xl font-bold text-[#002855]">
            {Math.round(totals.fiber)}/{fiberGoal}g
          </div>
        </div>
        <div className="text-center bg-gray-50 p-4 rounded-lg">
          <span className="text-sm text-gray-500 block">Burned</span>
          <span className="text-2xl font-bold text-[#CE1141]">
            {dailyStats?.calories_burned ? Math.round(dailyStats.calories_burned) : "--"}
          </span>
        </div>
      </div>
      {dailyStats?.weight && (
        <div className="text-center mt-4">
          <span className="text-sm text-gray-500">Current Weight: </span>
          <span className="font-medium text-gray-800">{dailyStats.weight} lbs</span>
        </div>
      )}
    </div>
  );
};

export default DailyDashboard;
