import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ConfirmedFood } from "@/types";

interface ManualAddFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  selectedDate: string;
  onSuccess: () => void;
}

const ManualAddFoodModal = ({
  open,
  onOpenChange,
  userId,
  selectedDate,
  onSuccess,
}: ManualAddFoodModalProps) => {
  const { toast } = useToast();
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [formData, setFormData] = useState({
    food_name: "",
    quantity: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    fiber: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        food_name: "",
        quantity: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
        fiber: "",
      });
      setMealType("Breakfast");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Check if this food exists in confirmed foods
      const { data: confirmedFoods } = await supabase
        .from("confirmed_foods")
        .select("*")
        .eq("user_id", userId)
        .eq("food_name", formData.food_name)
        .eq("quantity", formData.quantity)
        .maybeSingle();

      const mealData = {
        user_id: userId,
        date: selectedDate,
        meal_type: mealType,
        food_name: formData.food_name,
        quantity: formData.quantity,
        calories: Number(formData.calories),
        protein: Number(formData.protein),
        carbs: Number(formData.carbs),
        fats: Number(formData.fats),
        fiber: Number(formData.fiber),
        is_confirmed: true,
      };

      // Add to meals
      const { error: mealError } = await supabase.from("meals").insert(mealData);
      if (mealError) throw mealError;

      // If this food doesn't exist in confirmed foods, add it
      if (!confirmedFoods) {
        const { error: confirmError } = await supabase.from("confirmed_foods").insert({
          user_id: userId,
          food_name: formData.food_name,
          quantity: formData.quantity,
          calories: Number(formData.calories),
          protein: Number(formData.protein),
          carbs: Number(formData.carbs),
          fats: Number(formData.fats),
          fiber: Number(formData.fiber),
        });

        if (confirmError) throw confirmError;
      }

      toast({
        title: "Success",
        description: "Food added successfully",
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding manual food:", error);
      toast({
        title: "Error",
        description: "Failed to add food",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Add Food</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="meal-type">Meal Type</Label>
            <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
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
            <Label htmlFor="food-name">Food Name</Label>
            <Input
              id="food-name"
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
              placeholder="e.g., Chicken Breast"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="e.g., 4 oz, 1 cup, 100g"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                step="0.1"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="fats">Fats (g)</Label>
              <Input
                id="fats"
                type="number"
                step="0.1"
                value={formData.fats}
                onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                value={formData.fiber}
                onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#CE1141] hover:bg-[#a60d34]">
              Add Food
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualAddFoodModal;
