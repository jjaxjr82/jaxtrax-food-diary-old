import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "../../../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Mic, PlusCircle, Sparkles, Utensils, Coffee, Sun, Moon, Apple } from "lucide-react";
import ManualAddFoodModal from "./ManualAddFoodModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AddMealSectionProps {
  userId: string;
  selectedDate: string;
  onMealAdded: () => void;
  disabled?: boolean;
}

const AddMealSection = ({ userId, selectedDate, onMealAdded, disabled }: AddMealSectionProps) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [mealTypeConfirm, setMealTypeConfirm] = useState<{
    open: boolean;
    foods: any[];
  }>({ open: false, foods: [] });
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
        body: { description, userId, mealType: null }, // Don't specify meal type
      });

      if (error) throw error;

      if (data?.foods) {
        // Check if any food is missing mealType
        const needsConfirmation = data.foods.some((item: any) => !item.mealType);
        
        if (needsConfirmation) {
          // Show confirmation modal
          setMealTypeConfirm({ open: true, foods: data.foods });
        } else {
          // Add meals directly
          await addMeals(data.foods);
        }
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

  const addMeals = async (foods: any[], confirmedMealType?: string) => {
    try {
      for (const item of foods) {
        await supabase.from("meals").insert({
          user_id: userId,
          date: selectedDate,
          meal_type: confirmedMealType || item.mealType,
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
        description: `Added ${foods.length} food item(s)`,
      });
      setDescription("");
      onMealAdded();
    } catch (error: any) {
      console.error("Error adding meals:", error);
      toast({
        title: "Error",
        description: "Failed to add meals",
        variant: "destructive",
      });
    }
  };

  const handleMealTypeConfirm = async (selectedMealType: string) => {
    await addMeals(mealTypeConfirm.foods, selectedMealType);
    setMealTypeConfirm({ open: false, foods: [] });
  };

  const mealTypes = [
    { value: "Breakfast", Icon: Coffee },
    { value: "Lunch", Icon: Sun },
    { value: "Dinner", Icon: Moon },
    { value: "Snack", Icon: Apple },
  ] as const;

  return (
    <div className="bg-card/60 backdrop-blur-md rounded-2xl shadow-elegant-lg border border-border/50 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Utensils className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Add a Meal</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="e.g., 8oz sirloin steak with 1 cup of rice for dinner, or 2 eggs and toast for breakfast"
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
            Mention the meal type (breakfast, lunch, dinner, snack) in your description. Press Enter to submit.
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

      {/* Meal Type Confirmation Modal */}
      <Dialog open={mealTypeConfirm.open} onOpenChange={(open) => !open && setMealTypeConfirm({ open, foods: [] })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Meal Type</DialogTitle>
            <DialogDescription>
              Which meal should this food be logged to?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {mealTypes.map((type) => {
              const IconComponent = type.Icon;
              return (
                <button
                  key={type.value}
                  onClick={() => handleMealTypeConfirm(type.value)}
                  className="p-4 rounded-xl font-semibold transition-all bg-background/50 text-foreground hover:bg-primary hover:text-primary-foreground border border-border/50 hover:border-primary"
                >
                  <div className="flex flex-col items-center gap-2">
                    <IconComponent className="h-6 w-6" />
                    <span className="text-sm">{type.value}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

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
