import { useState } from "react";
import type { Meal } from "@/types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import EditMealDialog from "./EditMealDialog";

interface MealsListProps {
  meals: Meal[];
  onMealUpdate: () => void;
  onMealDelete: () => void;
  disabled?: boolean;
}

const MealsList = ({ meals, onMealUpdate, onMealDelete, disabled }: MealsListProps) => {
  const { toast } = useToast();
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  const deleteMeal = async (id: string) => {
    try {
      await supabase.from("meals").delete().eq("id", id);
      toast({
        title: "Success",
        description: "Meal deleted",
      });
      onMealDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete meal",
        variant: "destructive",
      });
    }
  };

  const mealsByType = {
    Breakfast: meals.filter((m) => m.meal_type === "Breakfast"),
    Lunch: meals.filter((m) => m.meal_type === "Lunch"),
    Dinner: meals.filter((m) => m.meal_type === "Dinner"),
    Snack: meals.filter((m) => m.meal_type === "Snack"),
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-[#002855]">Today's Log</h2>
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {meals.length === 0 ? (
          <p className="text-center text-gray-500 p-8">No meals logged yet</p>
        ) : (
          <>
            {Object.entries(mealsByType).map(([type, typeMeals]) =>
              typeMeals.length > 0 ? (
                <div key={type} className="border-b border-gray-200 last:border-b-0">
                  <div className="bg-[#002855] px-4 py-2">
                    <h3 className="text-white font-semibold">{type}</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {typeMeals.map((meal) => (
                      <div key={meal.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{meal.food_name}</h4>
                            <p className="text-sm text-gray-600">{meal.quantity}</p>
                            <div className="mt-2 text-xs text-gray-500 space-x-4">
                              <span>{Math.round(meal.calories)} cal</span>
                              <span>P: {Math.round(meal.protein)}g</span>
                              <span>C: {Math.round(meal.carbs)}g</span>
                              <span>F: {Math.round(meal.fats)}g</span>
                              <span>Fiber: {Math.round(meal.fiber)}g</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingMeal(meal)}
                              disabled={disabled}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteMeal(meal.id)}
                              disabled={disabled}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </>
        )}
      </div>

      {editingMeal && (
        <EditMealDialog
          meal={editingMeal}
          open={!!editingMeal}
          onOpenChange={(open) => !open && setEditingMeal(null)}
          onSave={onMealUpdate}
        />
      )}
    </div>
  );
};

export default MealsList;
