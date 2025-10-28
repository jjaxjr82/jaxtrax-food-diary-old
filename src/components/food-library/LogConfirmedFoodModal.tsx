import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "../../../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import type { ConfirmedFood } from "@/types";
import { getTodayInEastern } from "@/lib/dateUtils";

interface LogConfirmedFoodModalProps {
  food: ConfirmedFood | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LogConfirmedFoodModal = ({ food, open, onOpenChange, onSuccess }: LogConfirmedFoodModalProps) => {
  const { toast } = useToast();
  const [mealType, setMealType] = useState<string>("Breakfast");
  const [multiplier, setMultiplier] = useState<string>("1");

  useEffect(() => {
    if (food) {
      setMultiplier("1");
      setMealType("Breakfast");
    }
  }, [food]);

  if (!food) return null;

  // Parse the original quantity to extract numeric value
  const baseQuantity = parseFloat(food.quantity) || 1;

  // Calculate adjusted nutrition based on multiplier
  const mult = parseFloat(multiplier) || 1;
  const adjustedCalories = food.calories * mult;
  const adjustedProtein = food.protein * mult;
  const adjustedCarbs = food.carbs * mult;
  const adjustedFats = food.fats * mult;
  const adjustedFiber = food.fiber * mult;

  const handleLog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = getTodayInEastern();

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        date: today,
        meal_type: mealType,
        food_name: food.food_name,
        quantity: `${baseQuantity * mult} ${food.quantity.replace(/[\d.]+\s*/, "")}`,
        calories: adjustedCalories,
        protein: adjustedProtein,
        carbs: adjustedCarbs,
        fats: adjustedFats,
        fiber: adjustedFiber,
        is_confirmed: true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Food logged to daily tracker",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error logging food:", error);
      toast({
        title: "Error",
        description: "Failed to log food",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log {food.food_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Meal Type</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
                <SelectItem value="Snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity Multiplier</Label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Original: {food.quantity}
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">Adjusted Nutrition</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Calories: {adjustedCalories.toFixed(0)}</div>
              <div>Protein: {adjustedProtein.toFixed(1)}g</div>
              <div>Carbs: {adjustedCarbs.toFixed(1)}g</div>
              <div>Fats: {adjustedFats.toFixed(1)}g</div>
              <div>Fiber: {adjustedFiber.toFixed(1)}g</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleLog}>Log to Daily Tracker</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogConfirmedFoodModal;
