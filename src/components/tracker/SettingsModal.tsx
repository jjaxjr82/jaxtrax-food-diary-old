import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UserSettings } from "@/types";
import { Settings, Info } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSettingsUpdate: () => void;
}

const SettingsModal = ({ open, onOpenChange, userId, onSettingsUpdate }: SettingsModalProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    base_tdee: "2026",
    protein_per_lb: "0.8",
    carbs_percentage: "50",
    fats_percentage: "30",
    fiber_per_1000_cal: "14",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchSettings();
    }
  }, [open, userId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          base_tdee: data.base_tdee.toString(),
          protein_per_lb: data.protein_per_lb.toString(),
          carbs_percentage: data.carbs_percentage.toString(),
          fats_percentage: data.fats_percentage.toString(),
          fiber_per_1000_cal: data.fiber_per_1000_cal.toString(),
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: userId,
          base_tdee: parseFloat(settings.base_tdee),
          protein_per_lb: parseFloat(settings.protein_per_lb),
          carbs_percentage: parseFloat(settings.carbs_percentage),
          fats_percentage: parseFloat(settings.fats_percentage),
          fiber_per_1000_cal: parseFloat(settings.fiber_per_1000_cal),
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Nutrition settings updated",
      });
      onSettingsUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Nutrition Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Base TDEE */}
          <div className="space-y-2">
            <Label htmlFor="base_tdee" className="text-sm font-medium">
              Base TDEE (Total Daily Energy Expenditure)
            </Label>
            <Input
              id="base_tdee"
              type="number"
              min="1000"
              max="5000"
              value={settings.base_tdee}
              onChange={(e) => setSettings({ ...settings, base_tdee: e.target.value })}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Your maintenance calories without exercise. Typical range: 1500-3000 calories.
            </p>
          </div>

          {/* Protein */}
          <div className="space-y-2">
            <Label htmlFor="protein_per_lb" className="text-sm font-medium">
              Protein Goal (grams per lb bodyweight)
            </Label>
            <Input
              id="protein_per_lb"
              type="number"
              step="0.1"
              min="0.5"
              max="2"
              value={settings.protein_per_lb}
              onChange={(e) => setSettings({ ...settings, protein_per_lb: e.target.value })}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Standard: 0.8g/lb for maintenance, 1.0-1.2g/lb for muscle building.
            </p>
          </div>

          {/* Carbs Percentage */}
          <div className="space-y-2">
            <Label htmlFor="carbs_percentage" className="text-sm font-medium">
              Carbohydrates (% of daily calories)
            </Label>
            <Input
              id="carbs_percentage"
              type="number"
              min="20"
              max="70"
              value={settings.carbs_percentage}
              onChange={(e) => setSettings({ ...settings, carbs_percentage: e.target.value })}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Typical range: 40-60%. Each gram of carbs = 4 calories.
            </p>
          </div>

          {/* Fats Percentage */}
          <div className="space-y-2">
            <Label htmlFor="fats_percentage" className="text-sm font-medium">
              Fats (% of daily calories)
            </Label>
            <Input
              id="fats_percentage"
              type="number"
              min="15"
              max="50"
              value={settings.fats_percentage}
              onChange={(e) => setSettings({ ...settings, fats_percentage: e.target.value })}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Typical range: 20-35%. Each gram of fat = 9 calories.
            </p>
          </div>

          {/* Fiber */}
          <div className="space-y-2">
            <Label htmlFor="fiber_per_1000_cal" className="text-sm font-medium">
              Fiber (grams per 1000 calories)
            </Label>
            <Input
              id="fiber_per_1000_cal"
              type="number"
              min="10"
              max="25"
              value={settings.fiber_per_1000_cal}
              onChange={(e) => setSettings({ ...settings, fiber_per_1000_cal: e.target.value })}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              FDA recommends 14g per 1000 calories. Adults need 25-35g daily.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Settings"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
