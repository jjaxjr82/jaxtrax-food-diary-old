import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";
import type { Meal } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EditMealDialog from "./EditMealDialog";

interface PendingConfirmationProps {
  meals: Meal[];
  onUpdate: () => void;
}

const PendingConfirmation = ({ meals, onUpdate }: PendingConfirmationProps) => {
  const { toast } = useToast();
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
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
    <>
      <div className="bg-card/60 backdrop-blur-md rounded-2xl border-2 border-warning/30 p-6 mb-6 shadow-elegant">
        <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse"></span>
          Pending Confirmation ({unconfirmedMeals.length})
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Review these AI-parsed foods. Confirm to save them to your library for faster future logging.
        </p>
        <div className="space-y-3">
          {unconfirmedMeals.map((meal) => (
            <div
              key={meal.id}
              className="bg-background/80 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-foreground">{meal.food_name}</div>
                <div className="text-sm text-muted-foreground">
                  {meal.quantity} • {meal.meal_type}
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-x-2">
                  <span>{Math.round(meal.calories)}cal</span>
                  <span>•</span>
                  <span>{Math.round(meal.protein)}g protein</span>
                  <span>•</span>
                  <span>{Math.round(meal.carbs)}g carbs</span>
                  <span>•</span>
                  <span>{Math.round(meal.fats)}g fats</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingMeal(meal)}
                  className="hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirm(meal)}
                  className="bg-success hover:bg-success/90"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(meal.id)}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditMealDialog
        meal={editingMeal}
        open={!!editingMeal}
        onOpenChange={(open) => !open && setEditingMeal(null)}
        onSave={onUpdate}
      />
    </>
  );
};

export default PendingConfirmation;
