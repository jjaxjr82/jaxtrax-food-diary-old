import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { Meal } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PendingConfirmationProps {
  meals: Meal[];
  onUpdate: () => void;
}

const PendingConfirmation = ({ meals, onUpdate }: PendingConfirmationProps) => {
  const { toast } = useToast();
  const unconfirmedMeals = meals.filter((m) => !m.is_confirmed);

  const handleConfirm = async (meal: Meal) => {
    try {
      // Update meal to confirmed
      const { error: mealError } = await supabase
        .from("meals")
        .update({ is_confirmed: true })
        .eq("id", meal.id);

      if (mealError) throw mealError;

      // Calculate single-serving nutrition (normalize to base quantity)
      const servingData = {
        user_id: meal.user_id,
        food_name: meal.food_name,
        quantity: meal.quantity,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        fiber: meal.fiber,
      };

      // Check if this food already exists in confirmed foods
      const { data: existing } = await supabase
        .from("confirmed_foods")
        .select("id")
        .eq("user_id", meal.user_id)
        .eq("food_name", meal.food_name)
        .eq("quantity", meal.quantity)
        .maybeSingle();

      if (!existing) {
        // Add to confirmed foods library
        const { error: confirmError } = await supabase
          .from("confirmed_foods")
          .insert(servingData);

        if (confirmError) throw confirmError;
      }

      toast({
        title: "Success",
        description: "Food confirmed and added to library",
      });
      onUpdate();
    } catch (error) {
      console.error("Error confirming food:", error);
      toast({
        title: "Error",
        description: "Failed to confirm food",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (mealId: string) => {
    try {
      const { error } = await supabase.from("meals").delete().eq("id", mealId);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Food removed",
      });
      onUpdate();
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast({
        title: "Error",
        description: "Failed to delete food",
        variant: "destructive",
      });
    }
  };

  if (unconfirmedMeals.length === 0) return null;

  return (
    <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-amber-900">
        Pending Confirmation ({unconfirmedMeals.length})
      </h2>
      <p className="text-sm text-amber-800 mb-4">
        Review these AI-parsed foods. Confirm to save them to your library for faster future logging.
      </p>
      <div className="space-y-3">
        {unconfirmedMeals.map((meal) => (
          <div
            key={meal.id}
            className="bg-white rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{meal.food_name}</div>
              <div className="text-sm text-gray-600">
                {meal.quantity} • {meal.meal_type}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(meal.calories)}cal • {Math.round(meal.protein)}g protein •{" "}
                {Math.round(meal.carbs)}g carbs • {Math.round(meal.fats)}g fats
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleConfirm(meal)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(meal.id)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingConfirmation;
