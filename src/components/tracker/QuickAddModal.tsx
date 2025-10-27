import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ConfirmedFood, Recipe } from "@/types";

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  selectedDate: string;
  mealType: string;
  onSuccess: () => void;
}

const QuickAddModal = ({ open, onOpenChange, userId, selectedDate, mealType, onSuccess }: QuickAddModalProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [confirmedFoods, setConfirmedFoods] = useState<ConfirmedFood[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (open && userId) {
      fetchData();
    }
  }, [open, userId]);

  const fetchData = async () => {
    const { data: foodsData } = await supabase
      .from("confirmed_foods")
      .select("*")
      .eq("user_id", userId)
      .order("food_name");

    const { data: recipesData } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("recipe_name");

    setConfirmedFoods((foodsData || []) as ConfirmedFood[]);
    setRecipes((recipesData || []) as Recipe[]);
  };

  const handleAddFood = async (food: ConfirmedFood) => {
    try {
      const { error } = await supabase.from("meals").insert({
        user_id: userId,
        date: selectedDate,
        meal_type: mealType,
        food_name: food.food_name,
        quantity: food.quantity,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        fiber: food.fiber,
        is_confirmed: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Food added to log",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding food:", error);
      toast({
        title: "Error",
        description: "Failed to add food",
        variant: "destructive",
      });
    }
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    try {
      const { error } = await supabase.from("meals").insert({
        user_id: userId,
        date: selectedDate,
        meal_type: mealType,
        food_name: recipe.recipe_name,
        quantity: "1 serving",
        calories: recipe.total_calories,
        protein: recipe.total_protein,
        carbs: recipe.total_carbs,
        fats: recipe.total_fats,
        fiber: recipe.total_fiber,
        is_confirmed: true,
        is_recipe: true,
        recipe_id: recipe.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recipe added to log",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast({
        title: "Error",
        description: "Failed to add recipe",
        variant: "destructive",
      });
    }
  };

  const filteredFoods = confirmedFoods.filter((f) =>
    f.food_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecipes = recipes.filter((r) =>
    r.recipe_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add to {mealType}</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <Tabs defaultValue="foods">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="foods">Foods</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
          </TabsList>

          <TabsContent value="foods" className="space-y-2 max-h-96 overflow-y-auto">
            {filteredFoods.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No confirmed foods found</p>
            ) : (
              filteredFoods.map((food) => (
                <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted">
                  <div>
                    <div className="font-medium">{food.food_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {food.quantity} • {Math.round(food.calories)} cal • P: {food.protein.toFixed(1)}g
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddFood(food)}>
                    Add
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="recipes" className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRecipes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recipes found</p>
            ) : (
              filteredRecipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted">
                  <div>
                    <div className="font-medium">{recipe.recipe_name}</div>
                    <div className="text-sm text-muted-foreground">
                      1 serving • {Math.round(recipe.total_calories)} cal • P: {recipe.total_protein.toFixed(1)}g
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddRecipe(recipe)}>
                    Add
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddModal;
