import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../../supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ConfirmedFood, Recipe } from "@/types";
import LogConfirmedFoodModal from "@/components/food-library/LogConfirmedFoodModal";
import EditConfirmedFoodModal from "@/components/food-library/EditConfirmedFoodModal";
import EditRecipeModal from "@/components/food-library/EditRecipeModal";
import AIFoodPlannerModal from "@/components/food-library/AIFoodPlannerModal";
import { getTodayInEastern } from "@/lib/dateUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FoodLibrary = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"foods" | "recipes">("foods");
  const [search, setSearch] = useState("");
  const [confirmedFoods, setConfirmedFoods] = useState<ConfirmedFood[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  
  // Modal states
  const [logFoodModal, setLogFoodModal] = useState<{ open: boolean; food: ConfirmedFood | null }>({
    open: false,
    food: null,
  });
  const [editFoodModal, setEditFoodModal] = useState<{ open: boolean; food: ConfirmedFood | null }>({
    open: false,
    food: null,
  });
  const [editRecipeModal, setEditRecipeModal] = useState<{ open: boolean; recipe: Recipe | null }>({
    open: false,
    recipe: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "food" | "recipe" | null;
    id: string | null;
    name: string;
  }>({ open: false, type: null, id: null, name: "" });
  const [aiPlannerOpen, setAiPlannerOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  const fetchData = async () => {
    if (!user) return;

    const { data: foodsData } = await supabase
      .from("confirmed_foods")
      .select("*")
      .eq("user_id", user.id);

    const { data: recipesData } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id);

    setConfirmedFoods((foodsData || []) as ConfirmedFood[]);
    setRecipes((recipesData || []) as Recipe[]);
  };

  const filteredFoods = confirmedFoods.filter((food) =>
    food.food_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.recipe_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogRecipe = async (recipe: Recipe) => {
    // Helper function to ensure Title Case
    const toTitleCase = (str: string) => {
      return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    try {
      const today = getTodayInEastern();

      const { error } = await supabase.from("meals").insert({
        user_id: user!.id,
        date: today,
        meal_type: "Snack",
        food_name: toTitleCase(recipe.recipe_name),
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
        description: "Recipe logged to daily tracker",
      });
    } catch (error) {
      console.error("Error logging recipe:", error);
      toast({
        title: "Error",
        description: "Failed to log recipe",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return;

    try {
      const table = deleteDialog.type === "food" ? "confirmed_foods" : "recipes";
      const { error } = await supabase.from(table).delete().eq("id", deleteDialog.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${deleteDialog.type === "food" ? "Food" : "Recipe"} deleted successfully`,
      });

      setDeleteDialog({ open: false, type: null, id: null, name: "" });
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 pb-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Tracker
            </Button>
            <div className="space-y-1">
              <h1 className="text-5xl font-impact leading-none tracking-tight uppercase text-gradient-red font-black">
                My Food Library
              </h1>
              <p className="text-sm text-muted-foreground">Your confirmed foods and recipes</p>
            </div>
            <Button
              onClick={() => setAiPlannerOpen(true)}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Meal Planner
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          {/* Search */}
          <div className="bg-card/60 backdrop-blur-md rounded-xl shadow-elegant border border-border/50 p-4">
            <Input
              type="text"
              placeholder="Search foods or recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border/50 bg-background/50"
            />
          </div>

          <div className="bg-card/60 backdrop-blur-md rounded-xl shadow-elegant-lg border border-border/50 overflow-hidden">
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setActiveTab("foods")}
                className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "foods"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                Confirmed Foods
              </button>
              <button
                onClick={() => setActiveTab("recipes")}
                className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === "recipes"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                Saved Recipes
              </button>
            </div>
            {activeTab === "foods" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Food Item</th>
                      <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                      <th className="px-3 py-3 text-right font-semibold">Calories</th>
                      <th className="px-3 py-3 text-right font-semibold">Protein</th>
                      <th className="px-3 py-3 text-right font-semibold">Carbs</th>
                      <th className="px-3 py-3 text-right font-semibold">Fats</th>
                      <th className="px-3 py-3 text-right font-semibold">Fiber</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredFoods.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                          No confirmed foods found
                        </td>
                      </tr>
                    ) : (
                      filteredFoods.map((food) => (
                        <tr key={food.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{food.food_name}</td>
                          <td className="px-4 py-4 text-muted-foreground">{food.quantity}</td>
                          <td className="px-3 py-4 text-right text-foreground font-medium">{food.calories?.toFixed(0)}</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{food.protein?.toFixed(1)}g</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{food.carbs?.toFixed(1)}g</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{food.fats?.toFixed(1)}g</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{food.fiber?.toFixed(1)}g</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                onClick={() => setLogFoodModal({ open: true, food })}
                                className="h-8 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Log
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditFoodModal({ open: true, food })}
                                className="h-8 hover:bg-muted"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    type: "food",
                                    id: food.id,
                                    name: food.food_name,
                                  })
                                }
                                className="h-8 border-destructive/50 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Recipe Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Servings</th>
                      <th className="px-3 py-3 text-right font-semibold">Calories</th>
                      <th className="px-3 py-3 text-right font-semibold">Protein</th>
                      <th className="px-3 py-3 text-right font-semibold">Carbs</th>
                      <th className="px-3 py-3 text-right font-semibold">Fats</th>
                      <th className="px-3 py-3 text-right font-semibold">Fiber</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredRecipes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                          No recipes found
                        </td>
                      </tr>
                    ) : (
                      filteredRecipes.map((recipe) => (
                        <tr key={recipe.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">{recipe.recipe_name}</div>
                            {recipe.ingredients && recipe.ingredients.length > 0 && (
                              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                                {recipe.ingredients.map((ingredient: any, idx: number) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-primary">•</span>
                                    <span>{ingredient.foodName || ingredient.food_name} ({ingredient.quantity})</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">1 serving</td>
                          <td className="px-3 py-4 text-right text-foreground font-medium">{recipe.total_calories?.toFixed(0)}</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{recipe.total_protein?.toFixed(1)}g</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{recipe.total_carbs?.toFixed(1)}g</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{recipe.total_fats?.toFixed(1)}g</td>
                          <td className="px-3 py-4 text-right text-muted-foreground">{recipe.total_fiber?.toFixed(1)}g</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                onClick={() => handleLogRecipe(recipe)}
                                className="h-8 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Log
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditRecipeModal({ open: true, recipe })}
                                className="h-8 hover:bg-muted"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    type: "recipe",
                                    id: recipe.id,
                                    name: recipe.recipe_name,
                                  })
                                }
                                className="h-8 border-destructive/50 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <LogConfirmedFoodModal
          food={logFoodModal.food}
          open={logFoodModal.open}
          onOpenChange={(open) => setLogFoodModal({ open, food: null })}
          onSuccess={() => {}}
        />

        <EditConfirmedFoodModal
          food={editFoodModal.food}
          open={editFoodModal.open}
          onOpenChange={(open) => setEditFoodModal({ open, food: null })}
          onSuccess={fetchData}
        />

        <EditRecipeModal
          recipe={editRecipeModal.recipe}
          open={editRecipeModal.open}
          onOpenChange={(open) => setEditRecipeModal({ open, recipe: null })}
          onSuccess={fetchData}
        />

        <AIFoodPlannerModal
          open={aiPlannerOpen}
          onOpenChange={setAiPlannerOpen}
          userId={user.id}
        />

        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open, type: null, id: null, name: "" })}>
          <AlertDialogContent className="bg-card/95 backdrop-blur-lg border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deleteDialog.name}" from your library. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default FoodLibrary;
