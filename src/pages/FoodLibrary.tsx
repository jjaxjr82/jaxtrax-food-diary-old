import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { ConfirmedFood, Recipe } from "@/types";

const FoodLibrary = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"foods" | "recipes">("foods");
  const [search, setSearch] = useState("");
  const [confirmedFoods, setConfirmedFoods] = useState<ConfirmedFood[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

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
                </tr>
              </thead>
              <tbody>
                {filteredFoods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
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
                </tr>
              </thead>
              <tbody>
                {filteredRecipes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No recipes found
                    </td>
                  </tr>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <tr key={recipe.id} className="border-b hover:bg-red-50">
                      <td className="px-6 py-3 font-medium">{recipe.recipe_name}</td>
                      <td className="px-4 py-3">1 serving</td>
                      <td className="px-3 py-3 text-right">{recipe.total_calories?.toFixed(0)}</td>
                      <td className="px-3 py-3 text-right">{recipe.total_protein?.toFixed(1)}g</td>
                      <td className="px-3 py-3 text-right">{recipe.total_carbs?.toFixed(1)}g</td>
                      <td className="px-3 py-3 text-right">{recipe.total_fats?.toFixed(1)}g</td>
                      <td className="px-3 py-3 text-right">{recipe.total_fiber?.toFixed(1)}g</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodLibrary;
