import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ConfirmedFood, Recipe } from "@/types";
import LogConfirmedFoodModal from "@/components/food-library/LogConfirmedFoodModal";
import EditConfirmedFoodModal from "@/components/food-library/EditConfirmedFoodModal";
import EditRecipeModal from "@/components/food-library/EditRecipeModal";
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
      const today = new Date().toISOString().split("T")[0];

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <header className="flex justify-between items-center mb-10">
          <Button
            onClick={() => navigate("/tracker")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Daily Log
          </Button>
          <h1 className="text-4xl font-bold text-[#002855]">My Food Library</h1>
          <div className="w-40"></div>
        </header>

        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search foods or recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("foods")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "foods"
                ? "border-[#CE1141] text-[#CE1141]"
                : "border-transparent text-gray-700 hover:border-[#CE1141]"
            }`}
          >
            Confirmed Foods
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "recipes"
                ? "border-[#CE1141] text-[#CE1141]"
                : "border-transparent text-gray-700 hover:border-[#CE1141]"
            }`}
          >
            Saved Recipes
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {activeTab === "foods" ? (
            <table className="w-full text-sm">
              <thead className="bg-[#002855] text-white text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Food Item</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-3 py-3 text-right">Calories</th>
                  <th className="px-3 py-3 text-right">Protein</th>
                  <th className="px-3 py-3 text-right">Carbs</th>
                  <th className="px-3 py-3 text-right">Fats</th>
                  <th className="px-3 py-3 text-right">Fiber</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFoods.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No confirmed foods found
                    </td>
                  </tr>
                ) : (
                  filteredFoods.map((food) => (
                    <tr key={food.id} className="border-b hover:bg-red-50">
                      <td className="px-6 py-3 font-medium">{food.food_name}</td>
                      <td className="px-4 py-3">{food.quantity}</td>
                      <td className="px-3 py-3 text-right">{food.calories?.toFixed(0)}</td>
                      <td className="px-3 py-3 text-right">{food.protein?.toFixed(1)}g</td>
                      <td className="px-3 py-3 text-right">{food.carbs?.toFixed(1)}g</td>
                      <td className="px-3 py-3 text-right">{food.fats?.toFixed(1)}g</td>
                      <td className="px-3 py-3 text-right">{food.fiber?.toFixed(1)}g</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            onClick={() => setLogFoodModal({ open: true, food })}
                            className="h-8"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Log
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditFoodModal({ open: true, food })}
                            className="h-8"
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
                            className="h-8 border-red-300 text-red-600 hover:bg-red-50"
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
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#002855] text-white text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Recipe Name</th>
                  <th className="px-4 py-3 text-left">Servings</th>
                  <th className="px-3 py-3 text-right">Calories</th>
                  <th className="px-3 py-3 text-right">Protein</th>
                  <th className="px-3 py-3 text-right">Carbs</th>
                  <th className="px-3 py-3 text-right">Fats</th>
                  <th className="px-3 py-3 text-right">Fiber</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No recipes found
                    </td>
                  </tr>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <>
                      <tr key={recipe.id} className="border-b hover:bg-red-50">
                        <td className="px-6 py-3">
                          <div className="font-medium">{recipe.recipe_name}</div>
                          {recipe.ingredients && recipe.ingredients.length > 0 && (
                            <ul className="text-xs text-gray-600 mt-1 space-y-0.5">
                              {recipe.ingredients.map((ingredient: any, idx: number) => (
                                <li key={idx}>
                                  • {ingredient.foodName || ingredient.food_name} ({ingredient.quantity})
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="px-4 py-3">1 serving</td>
                        <td className="px-3 py-3 text-right">{recipe.total_calories?.toFixed(0)}</td>
                        <td className="px-3 py-3 text-right">{recipe.total_protein?.toFixed(1)}g</td>
                        <td className="px-3 py-3 text-right">{recipe.total_carbs?.toFixed(1)}g</td>
                        <td className="px-3 py-3 text-right">{recipe.total_fats?.toFixed(1)}g</td>
                        <td className="px-3 py-3 text-right">{recipe.total_fiber?.toFixed(1)}g</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              onClick={() => handleLogRecipe(recipe)}
                              className="h-8"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Log
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditRecipeModal({ open: true, recipe })}
                              className="h-8"
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
                              className="h-8 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </>
                  ))
                )}
              </tbody>
            </table>
          )}
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

        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open, type: null, id: null, name: "" })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deleteDialog.name}" from your library. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
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
