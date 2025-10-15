import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mic } from "lucide-react";

interface AddMealSectionProps {
  userId: string;
  selectedDate: string;
  onMealAdded: () => void;
}

const AddMealSection = ({ userId, selectedDate, onMealAdded }: AddMealSectionProps) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
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
        body: { description },
      });

      if (error) throw error;

      if (data?.items) {
        for (const item of data.items) {
          await supabase.from("meals").insert({
            user_id: userId,
            date: selectedDate,
            meal_type: "Snack",
            food_name: item.foodName,
            quantity: item.quantity,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
            fiber: item.fiber,
            is_confirmed: false,
          });
        }
        
        toast({
          title: "Success",
          description: `Added ${data.items.length} food item(s)`,
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
        <div className="relative">
          <label htmlFor="food-description" className="block text-sm font-medium text-gray-600 mb-2">
            Describe what you ate (e.g., "For breakfast I had a banana")
          </label>
          <Textarea
            id="food-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full pr-12"
            placeholder="e.g., 1 cup of oatmeal with a banana and a tablespoon of peanut butter"
            required
          />
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`absolute top-10 right-2 p-2 rounded-full hover:bg-gray-100 ${
              listening ? "text-[#CE1141] animate-pulse" : "text-gray-500"
            }`}
            title="Start/Stop Dictation"
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">
          <Button
            type="submit"
            className="w-full bg-[#CE1141] hover:bg-[#a60d34]"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze and Add Meal"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddMealSection;
