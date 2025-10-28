import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Meal } from "@/types";

interface CopyMealModalProps {
  mealType: string;
  meals: Meal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
}

const CopyMealModal = ({ mealType, meals, open, onOpenChange, onSuccess, userId }: CopyMealModalProps) => {
  const { toast } = useToast();
  const [targetDate, setTargetDate] = useState<Date>(new Date());

  const handleCopy = async () => {
    try {
      const formattedDate = format(targetDate, 'yyyy-MM-dd');
      
      // Copy all meals of this type to the target date
      const mealsToInsert = meals.map(meal => ({
        user_id: userId,
        date: formattedDate,
        meal_type: meal.meal_type,
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
      }));

      const { error } = await supabase.from("meals").insert(mealsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${mealType} copied to ${format(targetDate, 'MMM d, yyyy')} (${meals.length} items)`,
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
          <DialogTitle>Copy {mealType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Copy all {meals.length} item(s) from {mealType} to a different day
            </p>
          </div>

          <div>
            <Label>Target Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !targetDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={targetDate}
                  onSelect={(date) => date && setTargetDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={meals.length === 0}>
            Copy {mealType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyMealModal;
