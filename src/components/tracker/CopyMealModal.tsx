import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Meal } from "@/types";

interface CopyMealModalProps {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CopyMealModal = ({ meal, open, onOpenChange, onSuccess }: CopyMealModalProps) => {
  const { toast } = useToast();
  const [targetMealType, setTargetMealType] = useState<string>("Breakfast");

  if (!meal) return null;

  const handleCopy = async () => {
    try {
      const { error } = await supabase.from("meals").insert({
        user_id: meal.user_id,
        date: meal.date,
        meal_type: targetMealType,
        food_name: meal.food_name,
        quantity: meal.quantity,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        fiber: meal.fiber,
        is_confirmed: meal.is_confirmed,
        is_supplement: meal.is_supplement,
        is_recipe: meal.is_recipe,
        recipe_id: meal.recipe_id,
        supplement_id: meal.supplement_id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Meal copied to ${targetMealType}`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error copying meal:", error);
      toast({
        title: "Error",
        description: "Failed to copy meal",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy Meal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Copy "{meal.food_name}" to a different meal
            </p>
          </div>

          <div>
            <Label>Target Meal</Label>
            <Select value={targetMealType} onValueChange={setTargetMealType}>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCopy}>Copy Meal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyMealModal;
