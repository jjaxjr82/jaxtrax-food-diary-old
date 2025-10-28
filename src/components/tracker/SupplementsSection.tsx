import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SUPPLEMENTS } from "@/types";
import type { Meal } from "@/types";

interface SupplementsSectionProps {
  userId: string;
  selectedDate: string;
  meals: Meal[];
  onSupplementToggle: () => void;
  disabled?: boolean;
}

const SupplementsSection = ({ userId, selectedDate, meals, onSupplementToggle, disabled }: SupplementsSectionProps) => {
  const { toast } = useToast();

  const isSupplementChecked = (supplementId: string) => {
    return meals.some(
      (meal) => meal.is_supplement && meal.supplement_id === supplementId && meal.date === selectedDate
    );
  };

  const handleToggle = async (supplementId: string, checked: boolean) => {
    try {
      if (checked) {
        const supplement = SUPPLEMENTS[supplementId as keyof typeof SUPPLEMENTS];
        await supabase.from("meals").insert({
          user_id: userId,
          date: selectedDate,
          meal_type: supplement.defaultMealType,
          food_name: supplement.name,
          quantity: supplement.quantity,
          calories: supplement.calories,
          protein: supplement.protein,
          carbs: supplement.carbs,
          fats: supplement.fats,
          fiber: supplement.fiber,
          is_supplement: true,
          supplement_id: supplementId,
          is_confirmed: true,
        });
      } else {
        const meal = meals.find(
          (m) => m.is_supplement && m.supplement_id === supplementId && m.date === selectedDate
        );
        if (meal) {
          await supabase.from("meals").delete().eq("id", meal.id);
        }
      }
      onSupplementToggle();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update supplement",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Daily Supplements</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(SUPPLEMENTS).map(([id, supp]) => (
          <div key={id} className="flex items-center">
            <Checkbox
              id={`supp-${id}`}
              checked={isSupplementChecked(id)}
              onCheckedChange={(checked) => handleToggle(id, checked as boolean)}
              disabled={disabled}
            />
            <Label htmlFor={`supp-${id}`} className="ml-2 text-sm font-medium cursor-pointer">
              {supp.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupplementsSection;
