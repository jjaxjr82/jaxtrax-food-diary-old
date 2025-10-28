import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MealSuggestionsSectionProps {
  userId: string;
}

const MealSuggestionsSection = ({ userId }: MealSuggestionsSectionProps) => {
  const [mealType, setMealType] = useState("lunch");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState("");
  const [userSettings, setUserSettings] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserSettings();
  }, [userId]);

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

  const calculateMealTargets = () => {
    if (!userSettings) return { calories: 500, protein: 30, carbs: 60, fats: 15 };

    const baseTdee = userSettings.base_tdee || 2000;
    const proteinPerLb = userSettings.protein_per_lb || 0.8;
    const carbsPercentage = userSettings.carbs_percentage || 50;
    const fatsPercentage = userSettings.fats_percentage || 30;

    // Assuming 160lb weight (can be made dynamic later)
    const weight = 160;
    const dailyProtein = weight * proteinPerLb;
    const dailyCarbs = (baseTdee * (carbsPercentage / 100)) / 4;
    const dailyFats = (baseTdee * (fatsPercentage / 100)) / 9;

    // Divide by 3 meals (breakfast, lunch, dinner)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Meal Suggestions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get personalized meal suggestions that avoid your excluded foods
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default MealSuggestionsSection;
