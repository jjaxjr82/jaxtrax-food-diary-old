import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mic, PlusCircle } from "lucide-react";
import ManualAddFoodModal from "./ManualAddFoodModal";

interface AddMealSectionProps {
  userId: string;
  selectedDate: string;
  onMealAdded: () => void;
  disabled?: boolean;
}

const AddMealSection = ({ userId, selectedDate, onMealAdded, disabled }: AddMealSectionProps) => {
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const { toast } = useToast();

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in this browser",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => prev + " " + transcript);
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { description, userId, mealType },
      });

      if (error) throw error;

      if (data?.foods) {
        for (const item of data.foods) {
          await supabase.from("meals").insert({
            user_id: userId,
            date: selectedDate,
            meal_type: item.mealType || mealType,
            food_name: item.foodName,
            quantity: item.quantity,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
            fiber: item.fiber,
            is_confirmed: item.isConfirmed || false,
          });
        }
        
        toast({
          title: "Success",
          description: `Added ${data.foods.length} food item(s)`,
        });
        setDescription("");
        onMealAdded();
      }
    } catch (error: any) {
      console.error("Error analyzing food:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze food",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-[#002855]">Add a Meal</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Meal Type
          </label>
          <div className="flex gap-2">
            {(["Breakfast", "Lunch", "Dinner", "Snack"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mealType === type
                    ? "bg-[#CE1141] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <label htmlFor="food-description" className="block text-sm font-medium text-gray-600 mb-2">
            Describe what you ate
          </label>
          <Textarea
            id="food-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={3}
            className="w-full pr-12"
            placeholder="e.g., 1 cup of oatmeal with a banana and a tablespoon of peanut butter"
            required
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={disabled}
            className={`absolute top-10 right-2 p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 ${
              listening ? "text-[#CE1141] animate-pulse" : "text-gray-500"
            }`}
            title="Start/Stop Dictation"
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          <Button
            type="submit"
            className="w-full bg-[#CE1141] hover:bg-[#a60d34]"
            disabled={loading || disabled}
          >
            {loading ? "Analyzing..." : "Analyze and Add Meal"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setManualAddOpen(true)}
            disabled={disabled}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Manual Add Food
          </Button>
        </div>
      </form>

      <ManualAddFoodModal
        open={manualAddOpen}
        onOpenChange={setManualAddOpen}
        userId={userId}
        selectedDate={selectedDate}
        onSuccess={onMealAdded}
      />
    </div>
  );
};

export default AddMealSection;
