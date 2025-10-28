import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIFoodPlannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const AIFoodPlannerModal = ({ open, onOpenChange, userId }: AIFoodPlannerModalProps) => {
  const [excludedFoods, setExcludedFoods] = useState<any[]>([]);
  const [newFood, setNewFood] = useState("");
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState("lunch");
  const [suggestions, setSuggestions] = useState("");
  const [userSettings, setUserSettings] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchExcludedFoods();
      fetchUserSettings();
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

  const fetchUserSettings = async () => {
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setUserSettings(data);
    }
  };

  const handleAddExcluded = async () => {
    if (!newFood.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("excluded_foods")
      .insert({
        user_id: userId,
        food_name: newFood.trim(),
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
        description: `Added ${newFood} to excluded foods`,
      });
      setNewFood("");
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

  const calculateMealTargets = () => {
    if (!userSettings) return { calories: 500, protein: 30, carbs: 60, fats: 15 };

    const baseTdee = userSettings.base_tdee || 2000;
    const proteinPerLb = userSettings.protein_per_lb || 0.8;
    const carbsPercentage = userSettings.carbs_percentage || 50;
    const fatsPercentage = userSettings.fats_percentage || 30;

    const weight = 160;
    const dailyProtein = weight * proteinPerLb;
    const dailyCarbs = (baseTdee * (carbsPercentage / 100)) / 4;
    const dailyFats = (baseTdee * (fatsPercentage / 100)) / 9;

    const mealDivider = 3;

    return {
      calories: Math.round(baseTdee / mealDivider),
      protein: Math.round(dailyProtein / mealDivider),
      carbs: Math.round(dailyCarbs / mealDivider),
      fats: Math.round(dailyFats / mealDivider),
    };
  };

  const handleGetSuggestions = async () => {
    setLoading(true);
    setSuggestions("");

    try {
      const targets = calculateMealTargets();

      const { data, error } = await supabase.functions.invoke("suggest-meals", {
        body: {
          userId,
          mealType,
          targetCalories: targets.calories,
          targetProtein: targets.protein,
          targetCarbs: targets.carbs,
          targetFats: targets.fats,
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

  const targets = calculateMealTargets();

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">Get Suggestions</TabsTrigger>
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
                <label className="text-sm font-medium">Target Macros</label>
                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span>Calories: {targets.calories}</span>
                    <span>Protein: {targets.protein}g</span>
                    <span>Carbs: {targets.carbs}g</span>
                    <span>Fats: {targets.fats}g</span>
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

          <TabsContent value="excluded" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Foods you don't eat - AI suggestions will avoid these
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="e.g., peanuts, dairy, shellfish"
                value={newFood}
                onChange={(e) => setNewFood(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddExcluded();
                  }
                }}
              />
              <Button onClick={handleAddExcluded} disabled={loading || !newFood.trim()}>
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
