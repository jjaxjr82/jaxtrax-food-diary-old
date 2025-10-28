import { useState, useEffect } from "react";
import type { Meal } from "@/types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Copy, Plus, Check, ChefHat, Calendar } from "lucide-react";
import EditMealDialog from "./EditMealDialog";
import CopyFoodItemModal from "./CopyFoodItemModal";
import CopyMealModal from "./CopyMealModal";
import QuickAddModal from "./QuickAddModal";
import CreateRecipeModal from "./CreateRecipeModal";
import { getDateInEastern } from "@/lib/dateUtils";

interface MealsListProps {
  meals: Meal[];
  onMealUpdate: () => void;
  onMealDelete: () => void;
  disabled?: boolean;
  userId: string;
  selectedDate: string;
}

const MealsList = ({ meals, onMealUpdate, onMealDelete, disabled, userId, selectedDate }: MealsListProps) => {
  const { toast } = useToast();
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [copyingFoodItem, setCopyingFoodItem] = useState<Meal | null>(null);
  const [copyingEntireMeal, setCopyingEntireMeal] = useState<{ open: boolean; mealType: string; meals: Meal[] }>({
    open: false,
    mealType: "",
    meals: [],
  });
  const [quickAddModal, setQuickAddModal] = useState<{ open: boolean; mealType: string }>({
    open: false,
    mealType: "Breakfast",
  });
  const [createRecipeModal, setCreateRecipeModal] = useState<{ open: boolean; mealType: string }>({
    open: false,
    mealType: "Breakfast",
  });
  const [yesterdayMeals, setYesterdayMeals] = useState<{ [key: string]: Meal[] }>({});

  useEffect(() => {
    fetchYesterdayMeals();
  }, [selectedDate, userId]);

  const fetchYesterdayMeals = async () => {
    const yesterdayStr = getDateInEastern(selectedDate, -1);

    const { data } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .eq("date", yesterdayStr);

    if (data) {
      const mealsData = data as Meal[];
      const grouped = {
        Breakfast: mealsData.filter((m) => m.meal_type === "Breakfast"),
        Lunch: mealsData.filter((m) => m.meal_type === "Lunch"),
        Dinner: mealsData.filter((m) => m.meal_type === "Dinner"),
        Snack: mealsData.filter((m) => m.meal_type === "Snack"),
      };
      setYesterdayMeals(grouped);
    }
  };

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

  const handleConfirmFood = async (meal: Meal) => {
    // Helper function to ensure Title Case
    const toTitleCase = (str: string) => {
      return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    try {
      const { error: mealError } = await supabase
        .from("meals")
        .update({ is_confirmed: true })
        .eq("id", meal.id);

      if (mealError) throw mealError;

      const { data: existing } = await supabase
        .from("confirmed_foods")
        .select("id")
        .eq("user_id", meal.user_id)
        .eq("food_name", meal.food_name)
        .eq("quantity", meal.quantity)
        .maybeSingle();

      if (!existing) {
        const { error: confirmError } = await supabase.from("confirmed_foods").insert({
          user_id: meal.user_id,
          food_name: toTitleCase(meal.food_name),
          quantity: meal.quantity,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          fiber: meal.fiber,
        });

        if (confirmError) throw confirmError;
      }

      toast({
        title: "Success",
        description: "Food confirmed and added to library",
      });
      onMealUpdate();
    } catch (error) {
      console.error("Error confirming food:", error);
      toast({
        title: "Error",
        description: "Failed to confirm food",
        variant: "destructive",
      });
    }
  };

  const handleCopyYesterday = async (mealType: string) => {
    try {
      const mealsToAdd = yesterdayMeals[mealType] || [];
      
      const insertData = mealsToAdd.map((m) => ({
        user_id: userId,
        date: selectedDate,
        meal_type: mealType,
        food_name: m.food_name,
        quantity: m.quantity,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fats: m.fats,
        fiber: m.fiber,
        is_confirmed: m.is_confirmed,
        is_supplement: m.is_supplement,
        is_recipe: m.is_recipe,
        recipe_id: m.recipe_id,
        supplement_id: m.supplement_id,
      }));

      const { error } = await supabase.from("meals").insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Yesterday's meals copied successfully",
      });

      onMealUpdate();
    } catch (error) {
      console.error("Error copying yesterday's meals:", error);
      toast({
        title: "Error",
        description: "Failed to copy meals",
        variant: "destructive",
      });
    }
  };

  const mealsByType = {
    Breakfast: meals.filter((m) => m.meal_type === "Breakfast" && m.is_confirmed),
    Lunch: meals.filter((m) => m.meal_type === "Lunch" && m.is_confirmed),
    Dinner: meals.filter((m) => m.meal_type === "Dinner" && m.is_confirmed),
    Snack: meals.filter((m) => m.meal_type === "Snack" && m.is_confirmed),
  };

  const calculateSubtotal = (typeMeals: Meal[]) => {
    return typeMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fats: acc.fats + meal.fats,
        fiber: acc.fiber + meal.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Today's Log</h2>
      <div className="bg-card rounded-xl shadow-md overflow-hidden">
        {meals.filter(m => m.is_confirmed).length === 0 ? (
          <p className="text-center text-muted-foreground p-8">No meals logged yet</p>
        ) : (
          <>
            {(Object.entries(mealsByType) as [string, Meal[]][]).map(([type, typeMeals]) => {
              const subtotal = calculateSubtotal(typeMeals);
              const hasYesterdayMeals = (yesterdayMeals[type] || []).length > 0;
              const isEmpty = typeMeals.length === 0;

              return (
                <div key={type} className="border-b border-border last:border-b-0">
                  <div className="bg-primary px-4 py-3 flex justify-between items-center">
                    <h3 className="text-primary-foreground font-semibold">{type}</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setQuickAddModal({ open: true, mealType: type })}
                        disabled={disabled}
                        className="h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Quick Add
                      </Button>
                      {isEmpty && hasYesterdayMeals && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopyYesterday(type)}
                          disabled={disabled}
                          className="h-8 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Yesterday
                        </Button>
                      )}
                      {!isEmpty && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setCopyingEntireMeal({ open: true, mealType: type, meals: typeMeals })}
                            disabled={disabled}
                            className="h-8 text-xs"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Copy Meal
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setCreateRecipeModal({ open: true, mealType: type })}
                            disabled={disabled}
                            className="h-8 text-xs"
                          >
                            <ChefHat className="h-3 w-3 mr-1" />
                            Create Recipe
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {typeMeals.length > 0 && (
                    <>
                      <div className="divide-y divide-border">
                        {typeMeals.map((meal) => (
                          <div key={meal.id} className="p-4 hover:bg-muted/50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{meal.food_name}</h4>
                                  {!meal.is_confirmed && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleConfirmFood(meal)}
                                      disabled={disabled}
                                      className="h-6"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{meal.quantity}</p>
                                <div className="mt-2 text-xs text-muted-foreground space-x-4">
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
                                  onClick={() => setCopyingFoodItem(meal)}
                                  disabled={disabled}
                                  title="Copy food item to another day/meal"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
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
                      
                      <div className="bg-muted/50 px-4 py-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{type} Subtotal:</span>
                          <div className="text-sm text-muted-foreground space-x-4">
                            <span className="font-medium">{Math.round(subtotal.calories)} cal</span>
                            <span>P: {subtotal.protein.toFixed(1)}g</span>
                            <span>C: {subtotal.carbs.toFixed(1)}g</span>
                            <span>F: {subtotal.fats.toFixed(1)}g</span>
                            <span>Fiber: {subtotal.fiber.toFixed(1)}g</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <EditMealDialog
        meal={editingMeal}
        open={!!editingMeal}
        onOpenChange={(open) => !open && setEditingMeal(null)}
        onSave={onMealUpdate}
      />

      <CopyFoodItemModal
        meal={copyingFoodItem}
        open={!!copyingFoodItem}
        onOpenChange={(open) => !open && setCopyingFoodItem(null)}
        onSuccess={onMealUpdate}
      />

      <CopyMealModal
        mealType={copyingEntireMeal.mealType}
        meals={copyingEntireMeal.meals}
        open={copyingEntireMeal.open}
        onOpenChange={(open) => setCopyingEntireMeal({ ...copyingEntireMeal, open })}
        onSuccess={onMealUpdate}
        userId={userId}
      />

      <QuickAddModal
        open={quickAddModal.open}
        onOpenChange={(open) => setQuickAddModal({ ...quickAddModal, open })}
        userId={userId}
        selectedDate={selectedDate}
        mealType={quickAddModal.mealType}
        onSuccess={onMealUpdate}
      />

      <CreateRecipeModal
        meals={mealsByType[createRecipeModal.mealType as keyof typeof mealsByType] || []}
        open={createRecipeModal.open}
        onOpenChange={(open) => setCreateRecipeModal({ ...createRecipeModal, open })}
        onSuccess={onMealUpdate}
      />
    </div>
  );
};

export default MealsList;
