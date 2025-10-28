import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Sparkles, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AIFoodPlannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const AIFoodPlannerModal = ({ open, onOpenChange, userId }: AIFoodPlannerModalProps) => {
  const [excludedFoods, setExcludedFoods] = useState<any[]>([]);
  const [ingredientsOnHand, setIngredientsOnHand] = useState<any[]>([]);
  const [newFood, setNewFood] = useState("");
  const [newIngredient, setNewIngredient] = useState("");
  const [newIngredientQty, setNewIngredientQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState("lunch");
  const [suggestions, setSuggestions] = useState("");
  const [userSettings, setUserSettings] = useState<any>(null);
  const [targetMacros, setTargetMacros] = useState({ calories: 500, protein: 30, carbs: 60, fats: 15 });
  const [todaysMeals, setTodaysMeals] = useState<any[]>([]);
  const [comboOpen, setComboOpen] = useState(false);
  const { toast } = useToast();

  // Common foods and allergens for autocomplete
  const commonFoods = [
    // Allergens & Dietary Restrictions
    "Peanuts", "Tree Nuts (almonds, walnuts, cashews)", "Dairy (milk, cheese, yogurt)", 
    "Eggs", "Soy", "Wheat", "Gluten", "Shellfish (shrimp, crab, lobster)", 
    "Fish (salmon, tuna, cod)", "Sesame", "Corn", "Coconut",
    
    // Meats & Proteins
    "Red Meat (beef, pork, lamb)", "Chicken", "Turkey", "Bacon", "Sausage",
    "Deli Meats", "Hot Dogs", "Beans", "Lentils", "Tofu",
    
    // Condiments & Sauces
    "Mayonnaise", "Ketchup", "Mustard", "BBQ Sauce", "Soy Sauce", 
    "Hot Sauce", "Ranch Dressing", "Blue Cheese", "Caesar Dressing",
    "Vinegar", "Honey Mustard", "Teriyaki Sauce",
    
    // Vegetables
    "Mushrooms", "Tomatoes", "Onions", "Garlic", "Bell Peppers",
    "Broccoli", "Cauliflower", "Brussels Sprouts", "Cabbage", "Kale",
    "Spinach", "Lettuce", "Celery", "Carrots", "Cucumbers",
    
    // Fruits
    "Avocado", "Bananas", "Citrus Fruits (oranges, lemons)", 
    "Berries (strawberries, blueberries)", "Apples", "Grapes", "Melons",
    
    // Grains & Carbs
    "Rice", "Pasta", "Bread", "Oats", "Quinoa", "Barley",
    
    // Sweeteners & Sweets
    "Sugar", "Artificial Sweeteners", "Chocolate", "Candy", "Desserts",
    
    // Beverages
    "Coffee", "Tea", "Alcohol", "Energy Drinks", "Soda",
    
    // Other
    "Spicy Foods", "Fried Foods", "Fast Food", "Processed Foods",
    "Pickles", "Olives", "Cottage Cheese", "Cream Cheese"
  ].sort();

  useEffect(() => {
    if (open) {
      fetchExcludedFoods();
      fetchIngredientsOnHand();
      fetchUserSettings();
      fetchTodaysMeals();
    }
  }, [open, userId]);

  const fetchExcludedFoods = async () => {
    const { data } = await supabase
      .from("excluded_foods")
      .select("*")
      .eq("user_id", userId)
      .order("food_name");

    if (data) {
      setExcludedFoods(data);
    }
  };

  const fetchIngredientsOnHand = async () => {
    const { data } = await supabase
      .from("ingredients_on_hand")
      .select("*")
      .eq("user_id", userId)
      .order("ingredient_name");

    if (data) {
      setIngredientsOnHand(data);
    }
  };

  const fetchTodaysMeals = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    if (data) {
      setTodaysMeals(data);
    }
  };

  const fetchUserSettings = async () => {
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setUserSettings(data);
    } else {
      const defaults = {
        base_tdee: 2026,
        protein_per_lb: 0.8,
        carbs_percentage: 50,
        fats_percentage: 30,
        fiber_per_1000_cal: 14,
      };
      setUserSettings(defaults);
    }
  };

  useEffect(() => {
    if (userSettings && todaysMeals) {
      const calculatedTargets = calculateMealTargets(userSettings, todaysMeals);
      setTargetMacros(calculatedTargets);
    }
  }, [userSettings, todaysMeals, mealType]);

  const calculateMealTargets = (settings: any, meals: any[]) => {
    if (!settings) return { calories: 500, protein: 30, carbs: 60, fats: 15 };

    const baseTdee = settings.base_tdee || 2000;
    const proteinPerLb = settings.protein_per_lb || 0.8;
    const carbsPercentage = settings.carbs_percentage || 50;
    const fatsPercentage = settings.fats_percentage || 30;

    // Calculate daily targets
    const weight = 160;
    const dailyCalories = baseTdee;
    const dailyProtein = weight * proteinPerLb;
    const dailyCarbs = (baseTdee * (carbsPercentage / 100)) / 4;
    const dailyFats = (baseTdee * (fatsPercentage / 100)) / 9;

    // Typical meal distribution percentages
    const mealDistribution: { [key: string]: number } = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.35,
      snack: 0.05,
    };

    // Calculate what's already been consumed today
    const consumed = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (Number(meal.calories) || 0),
        protein: acc.protein + (Number(meal.protein) || 0),
        carbs: acc.carbs + (Number(meal.carbs) || 0),
        fats: acc.fats + (Number(meal.fats) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Calculate remaining macros for the day
    const remaining = {
      calories: Math.max(0, dailyCalories - consumed.calories),
      protein: Math.max(0, dailyProtein - consumed.protein),
      carbs: Math.max(0, dailyCarbs - consumed.carbs),
      fats: Math.max(0, dailyFats - consumed.fats),
    };

    // Get the distribution for the selected meal type
    const mealPercentage = mealDistribution[mealType] || 0.33;

    // If there's still enough budget, use the typical meal percentage
    // Otherwise, suggest what's remaining
    const targetCalories = Math.min(
      Math.round(dailyCalories * mealPercentage),
      remaining.calories
    );

    const targetProtein = Math.min(
      Math.round(dailyProtein * mealPercentage),
      remaining.protein
    );

    const targetCarbs = Math.min(
      Math.round(dailyCarbs * mealPercentage),
      remaining.carbs
    );

    const targetFats = Math.min(
      Math.round(dailyFats * mealPercentage),
      remaining.fats
    );

    return {
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fats: targetFats,
    };
  };

  const handleAddExcluded = async (foodName?: string) => {
    const foodToAdd = foodName || newFood.trim();
    if (!foodToAdd) return;

    // Validate input length
    if (foodToAdd.length > 100) {
      toast({
        title: "Error",
        description: "Food name must be less than 100 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("excluded_foods")
      .insert({
        user_id: userId,
        food_name: foodToAdd,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add excluded food",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Added ${foodToAdd} to excluded foods`,
      });
      setNewFood("");
      setComboOpen(false);
      fetchExcludedFoods();
    }
    setLoading(false);
  };

  const handleRemoveExcluded = async (id: string, foodName: string) => {
    const { error } = await supabase
      .from("excluded_foods")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove excluded food",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Removed ${foodName} from excluded foods`,
      });
      fetchExcludedFoods();
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) return;

    if (newIngredient.length > 100) {
      toast({
        title: "Error",
        description: "Ingredient name must be less than 100 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("ingredients_on_hand")
      .insert({
        user_id: userId,
        ingredient_name: newIngredient.trim(),
        quantity: newIngredientQty.trim() || null,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add ingredient",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Added ${newIngredient} to ingredients`,
      });
      setNewIngredient("");
      setNewIngredientQty("");
      fetchIngredientsOnHand();
    }
    setLoading(false);
  };

  const handleRemoveIngredient = async (id: string, ingredientName: string) => {
    const { error } = await supabase
      .from("ingredients_on_hand")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove ingredient",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Removed ${ingredientName} from ingredients`,
      });
      fetchIngredientsOnHand();
    }
  };

  const handleGetSuggestions = async () => {
    setLoading(true);
    setSuggestions("");

    try {
      const { data, error } = await supabase.functions.invoke("suggest-meals", {
        body: {
          userId,
          mealType,
          targetCalories: targetMacros.calories,
          targetProtein: targetMacros.protein,
          targetCarbs: targetMacros.carbs,
          targetFats: targetMacros.fats,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast({
            title: "Rate Limit Reached",
            description: "Please wait a moment before requesting more suggestions.",
            variant: "destructive",
          });
        } else if (data.error.includes("Payment required")) {
          toast({
            title: "Credits Required",
            description: "Please add credits to your workspace to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setSuggestions(data.suggestions);
    } catch (error: any) {
      console.error("Error getting meal suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to get meal suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Meal Planner
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Get Suggestions</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="excluded">Excluded Foods</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Meal Type</label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Macros for This Meal</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Calories</label>
                    <Input
                      type="number"
                      value={targetMacros.calories}
                      onChange={(e) => setTargetMacros({ ...targetMacros, calories: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Protein (g)</label>
                    <Input
                      type="number"
                      value={targetMacros.protein}
                      onChange={(e) => setTargetMacros({ ...targetMacros, protein: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Carbs (g)</label>
                    <Input
                      type="number"
                      value={targetMacros.carbs}
                      onChange={(e) => setTargetMacros({ ...targetMacros, carbs: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Fats (g)</label>
                    <Input
                      type="number"
                      value={targetMacros.fats}
                      onChange={(e) => setTargetMacros({ ...targetMacros, fats: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGetSuggestions}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Meal Suggestions
                </>
              )}
            </Button>

            {suggestions && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="whitespace-pre-wrap text-sm">{suggestions}</div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Track what ingredients you have on hand - AI will prioritize using these
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ingredient (e.g., chicken breast)"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Qty (optional)"
                value={newIngredientQty}
                onChange={(e) => setNewIngredientQty(e.target.value)}
                className="w-32"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddIngredient();
                  }
                }}
              />
              <Button onClick={handleAddIngredient} disabled={loading || !newIngredient.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {ingredientsOnHand.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No ingredients added yet
                </p>
              ) : (
                ingredientsOnHand.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{ingredient.ingredient_name}</span>
                      {ingredient.quantity && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({ingredient.quantity})
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveIngredient(ingredient.id, ingredient.ingredient_name)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="excluded" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Foods you don't eat - AI suggestions will avoid these
            </p>
            
            <div className="flex gap-2">
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="flex-1 justify-between"
                  >
                    {newFood || "Select or type a food..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search or type a food..." 
                      value={newFood}
                      onValueChange={setNewFood}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {newFood && (
                          <div className="py-2 px-3 text-sm">
                            Press Enter or Add to use "{newFood}"
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup heading="Common Foods & Allergens">
                        {commonFoods
                          .filter(food => 
                            food.toLowerCase().includes(newFood.toLowerCase())
                          )
                          .map((food) => (
                            <CommandItem
                              key={food}
                              value={food}
                              onSelect={(value) => {
                                setNewFood(value);
                                handleAddExcluded(value);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  excludedFoods.some(f => f.food_name.toLowerCase() === food.toLowerCase())
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {food}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => handleAddExcluded()} 
                disabled={loading || !newFood.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {excludedFoods.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No excluded foods yet
                </p>
              ) : (
                excludedFoods.map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
                  >
                    <span className="font-medium">{food.food_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExcluded(food.id, food.food_name)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AIFoodPlannerModal;
