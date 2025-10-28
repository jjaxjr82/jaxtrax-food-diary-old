import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Recipe } from "@/types";

interface EditRecipeModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditRecipeModal = ({ recipe, open, onOpenChange, onSuccess }: EditRecipeModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    recipe_name: "",
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
    total_fiber: 0,
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        recipe_name: recipe.recipe_name,
        total_calories: recipe.total_calories,
        total_protein: recipe.total_protein,
        total_carbs: recipe.total_carbs,
        total_fats: recipe.total_fats,
        total_fiber: recipe.total_fiber,
      });
    }
  }, [recipe]);

  const handleSave = async () => {
    if (!recipe) return;

    // Helper function to ensure Title Case
    const toTitleCase = (str: string) => {
      return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    try {
      const { error } = await supabase
        .from("recipes")
        .update({
          ...formData,
          recipe_name: toTitleCase(formData.recipe_name),
        })
        .eq("id", recipe.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recipe updated successfully",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast({
        title: "Error",
        description: "Failed to update recipe",
        variant: "destructive",
      });
    }
  };

  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Recipe Name</Label>
            <Input
              value={formData.recipe_name}
              onChange={(e) => setFormData({ ...formData, recipe_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Calories</Label>
              <Input
                type="number"
                value={formData.total_calories}
                onChange={(e) => setFormData({ ...formData, total_calories: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Protein (g)</Label>
              <Input
                type="number"
                value={formData.total_protein}
                onChange={(e) => setFormData({ ...formData, total_protein: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Carbs (g)</Label>
              <Input
                type="number"
                value={formData.total_carbs}
                onChange={(e) => setFormData({ ...formData, total_carbs: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fats (g)</Label>
              <Input
                type="number"
                value={formData.total_fats}
                onChange={(e) => setFormData({ ...formData, total_fats: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fiber (g)</Label>
              <Input
                type="number"
                value={formData.total_fiber}
                onChange={(e) => setFormData({ ...formData, total_fiber: parseFloat(e.target.value) || 0 })}
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

export default EditRecipeModal;
