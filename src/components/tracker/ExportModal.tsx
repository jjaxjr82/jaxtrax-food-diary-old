import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { getTodayInEastern, getDateOffsetInEastern } from "@/lib/dateUtils";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const ExportModal = ({ open, onOpenChange, userId }: ExportModalProps) => {
  const [range, setRange] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const handleExport = async () => {
    let start = "";
    let end = "";
    const today = getTodayInEastern();

    switch (range) {
      case "today":
        start = end = today;
        break;
      case "yesterday":
        start = end = getDateOffsetInEastern(-1);
        break;
      case "last_week":
        start = getDateOffsetInEastern(-7);
        end = today;
        break;
      case "last_month":
        start = getDateOffsetInEastern(-30);
        end = today;
        break;
      case "custom":
        if (!startDate || !endDate) {
          toast({
            title: "Error",
            description: "Please select both start and end dates",
            variant: "destructive",
          });
          return;
        }
        start = startDate;
        end = endDate;
        break;
    }

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .order("date");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
      return;
    }

    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "No data found for the selected range",
      });
      return;
    }

    const csvHeader = [
      "Date",
      "Meal Type",
      "Food Item",
      "Quantity",
      "Calories",
      "Protein (g)",
      "Carbs (g)",
      "Fats (g)",
      "Fiber (g)",
      "Confirmed",
      "Supplement",
      "Recipe",
    ].join(",");

    const csvRows = data.map((item) =>
      [
        item.date,
        item.meal_type,
        `"${item.food_name}"`,
        `"${item.quantity}"`,
        item.calories || 0,
        item.protein || 0,
        item.carbs || 0,
        item.fats || 0,
        item.fiber || 0,
        item.is_confirmed || false,
        item.is_supplement || false,
        item.is_recipe || false,
      ].join(",")
    );

    const csv = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jaxtrax_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Data exported successfully",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date Range</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {range === "custom" && (
            <>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
