import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "../../../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import type { Meal } from "@/types";

interface CreateRecipeModalProps {
  meals: Meal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateRecipeModal = ({ meals, open, onOpenChange, onSuccess }: CreateRecipeModalProps) => {
  const { toast } = useToast();
  const [recipeName, setRecipeName] = useState("");
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());

  const handleToggleMeal = (mealId: string) => {
    const newSelected = new Set(selectedMealIds);
    if (newSelected.has(mealId)) {
      newSelected.delete(mealId);
    } else {
      newSelected.add(mealId);
    }
    setSelectedMealIds(newSelected);
  };

  const selectedMeals = meals.filter((m) => selectedMealIds.has(m.id));

  const totals = selectedMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
      fiber: acc.fiber + meal.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  );

  const handleCreate = async () => {
    if (!recipeName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a recipe name",
        variant: "destructive",
      });
      return;
    }

    if (selectedMealIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one food item",
        variant: "destructive",
      });
      return;
    }

    try {
      // Helper function to ensure Title Case
      const toTitleCase = (str: string) => {
        return str
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      const ingredients = selectedMeals.map((m) => ({
        food_name: m.food_name,
        quantity: m.quantity,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fats: m.fats,
        fiber: m.fiber,
      }));

      const { error } = await supabase.from("recipes").insert({
        user_id: selectedMeals[0].user_id,
        recipe_name: toTitleCase(recipeName),
        ingredients,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fats: totals.fats,
        total_fiber: totals.fiber,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recipe created successfully",
      });

      setRecipeName("");
      setSelectedMealIds(new Set());
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast({
        title: "Error",
        description: "Failed to create recipe",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recipe from Meals</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Recipe Name</Label>
            <Input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g., My Morning Protein Bowl"
            />
          </div>

          <div>
            <Label>Select Food Items</Label>
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted">
                  <Checkbox
                    checked={selectedMealIds.has(meal.id)}
                    onCheckedChange={() => handleToggleMeal(meal.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{meal.food_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {meal.quantity} • {Math.round(meal.calories)} cal
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedMealIds.size > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Recipe Totals</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: {Math.round(totals.calories)}</div>
                <div>Protein: {totals.protein.toFixed(1)}g</div>
                <div>Carbs: {totals.carbs.toFixed(1)}g</div>
                <div>Fats: {totals.fats.toFixed(1)}g</div>
                <div>Fiber: {totals.fiber.toFixed(1)}g</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Recipe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRecipeModal;
