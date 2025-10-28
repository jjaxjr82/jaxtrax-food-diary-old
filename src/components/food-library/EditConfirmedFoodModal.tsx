import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ConfirmedFood } from "@/types";

interface EditConfirmedFoodModalProps {
  food: ConfirmedFood | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditConfirmedFoodModal = ({ food, open, onOpenChange, onSuccess }: EditConfirmedFoodModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    food_name: "",
    quantity: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
  });

  useEffect(() => {
    if (food) {
      setFormData({
        food_name: food.food_name,
        quantity: food.quantity,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        fiber: food.fiber,
      });
    }
  }, [food]);

  const handleSave = async () => {
    if (!food) return;

    // Helper function to ensure Title Case
    const toTitleCase = (str: string) => {
      return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    try {
      const { error } = await supabase
        .from("confirmed_foods")
        .update({
          ...formData,
          food_name: toTitleCase(formData.food_name),
        })
        .eq("id", food.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Food updated successfully",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating food:", error);
      toast({
        title: "Error",
        description: "Failed to update food",
        variant: "destructive",
      });
    }
  };

  if (!food) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Confirmed Food</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Food Name</Label>
            <Input
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
            />
          </div>

          <div>
            <Label>Quantity</Label>
            <Input
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Calories</Label>
              <Input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Protein (g)</Label>
              <Input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Carbs (g)</Label>
              <Input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fats (g)</Label>
              <Input
                type="number"
                value={formData.fats}
                onChange={(e) => setFormData({ ...formData, fats: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fiber (g)</Label>
              <Input
                type="number"
                value={formData.fiber}
                onChange={(e) => setFormData({ ...formData, fiber: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditConfirmedFoodModal;
