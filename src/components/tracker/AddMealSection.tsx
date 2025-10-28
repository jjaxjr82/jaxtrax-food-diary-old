import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mic, PlusCircle, Sparkles, Utensils } from "lucide-react";
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

  const toTitleCase = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
            food_name: toTitleCase(item.foodName),
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

  const mealTypes = [
    { value: "Breakfast", icon: "🌅" },
    { value: "Lunch", icon: "☀️" },
    { value: "Dinner", icon: "🌙" },
    { value: "Snack", icon: "🍎" },
  ] as const;

  return (
    <div className="bg-card/60 backdrop-blur-md rounded-2xl shadow-elegant-lg border border-border/50 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Utensils className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Add a Meal</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meal Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Meal Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mealTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setMealType(type.value)}
                disabled={disabled}
                className={`relative p-4 rounded-xl font-medium transition-all ${
                  mealType === type.value
                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg scale-105"
                    : "bg-background/50 text-foreground hover:bg-background/80 border border-border/50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm">{type.value}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Description Input */}
        <div className="space-y-3">
          <label htmlFor="food-description" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Describe what you ate
          </label>
          <div className="relative">
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
              className="w-full pr-12 border-border/50 bg-background/50 focus:bg-background transition-colors resize-none"
              placeholder="e.g., 8oz sirloin steak with 1 cup of rice and steamed broccoli"
              required
              disabled={disabled}
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={disabled}
              className={`absolute top-3 right-3 p-2 rounded-lg transition-all ${
                listening 
                  ? "bg-primary text-primary-foreground animate-pulse shadow-lg" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Voice Dictation"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter to submit, Shift+Enter for new line
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="submit"
            className="w-full shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-primary to-primary/90"
            disabled={loading || disabled}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Analyze & Add
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full shadow-sm hover:shadow-md transition-all border-border/50"
            onClick={() => setManualAddOpen(true)}
            disabled={disabled}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Manual Entry
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
