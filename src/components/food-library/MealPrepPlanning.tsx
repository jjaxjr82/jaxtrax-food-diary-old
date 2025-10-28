import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface MealPrepPlanningProps {
  userId: string;
  confirmedFoods: any[];
}

const MealPrepPlanning = ({ userId, confirmedFoods }: MealPrepPlanningProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState("lunch");
  const [selectedFood, setSelectedFood] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddToMealPlan = async () => {
    if (!selectedFood) {
      toast({
        title: "Select a food",
        description: "Please select a food from your library",
        variant: "destructive",
      });
      return;
    }

    const food = confirmedFoods.find(f => f.id === selectedFood);
    if (!food) return;

    setLoading(true);

    const { error } = await supabase
      .from("meals")
      .insert({
        user_id: userId,
        date: format(selectedDate, "yyyy-MM-dd"),
        meal_type: selectedMealType,
        food_name: food.food_name,
        quantity: food.quantity,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        fiber: food.fiber,
        is_confirmed: true,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add meal to plan",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Added ${food.food_name} to ${selectedMealType} on ${format(selectedDate, "MMM d")}`,
      });
      setSelectedFood("");
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Prep Planning</CardTitle>
        <p className="text-sm text-muted-foreground">
          Plan meals from your library for future dates
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Meal Type</label>
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
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
            <label className="text-sm font-medium">Food</label>
            <Select value={selectedFood} onValueChange={setSelectedFood}>
              <SelectTrigger>
                <SelectValue placeholder="Select food" />
              </SelectTrigger>
              <SelectContent>
                {confirmedFoods.map((food) => (
                  <SelectItem key={food.id} value={food.id}>
                    {food.food_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleAddToMealPlan}
          disabled={loading || !selectedFood}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Meal Plan
        </Button>
      </CardContent>
    </Card>
  );
};

export default MealPrepPlanning;
