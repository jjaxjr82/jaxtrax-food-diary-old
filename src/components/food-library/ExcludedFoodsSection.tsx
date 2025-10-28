import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExcludedFoodsSectionProps {
  userId: string;
}

const ExcludedFoodsSection = ({ userId }: ExcludedFoodsSectionProps) => {
  const [excludedFoods, setExcludedFoods] = useState<any[]>([]);
  const [newFood, setNewFood] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExcludedFoods();
  }, [userId]);

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

  const handleAdd = async () => {
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

  const handleRemove = async (id: string, foodName: string) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Excluded Foods</CardTitle>
        <p className="text-sm text-muted-foreground">
          Foods you don't eat - AI meal suggestions will avoid these
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., peanuts, dairy, shellfish"
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAdd();
              }
            }}
          />
          <Button onClick={handleAdd} disabled={loading || !newFood.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {excludedFoods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
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
                  onClick={() => handleRemove(food.id, food.food_name)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcludedFoodsSection;
