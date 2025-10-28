import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ExportModal from "./ExportModal";
import { useState } from "react";
import { getDateInEastern } from "@/lib/dateUtils";

interface TrackerHeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  signOut: () => void;
  userId: string;
  onResetData: () => void;
  lockDay: boolean;
  onLockDayChange: (locked: boolean) => void;
}

const TrackerHeader = ({ 
  selectedDate, 
  setSelectedDate, 
  signOut, 
  userId, 
  onResetData,
  lockDay,
  onLockDayChange 
}: TrackerHeaderProps) => {
  const navigate = useNavigate();
  const [exportOpen, setExportOpen] = useState(false);

  const changeDate = (days: number) => {
    setSelectedDate(getDateInEastern(selectedDate, days));
  };

  return (
    <>
      <header className="mb-8 space-y-6">
        {/* Top bar with title and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/40">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              JaxTrax
            </h1>
            <p className="text-sm text-muted-foreground">Your daily guide to mindful nutrition</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate("/food-library")} 
              variant="outline" 
              size="sm"
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              My Library
            </Button>
            <Button 
              onClick={() => setExportOpen(true)} 
              variant="outline" 
              size="sm"
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              Export
            </Button>
            <Button 
              onClick={signOut} 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Date navigation and controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm p-2 rounded-xl shadow-elegant border border-border/50">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg hover:bg-muted transition-all hover:scale-105 active:scale-95"
              title="Previous Day"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-foreground font-medium text-sm px-2"
            />
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg hover:bg-muted transition-all hover:scale-105 active:scale-95"
              title="Next Day"
            >
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-elegant border border-border/50">
              <input
                type="checkbox"
                id="lock-day"
                checked={lockDay}
                onChange={(e) => onLockDayChange(e.target.checked)}
                className="h-4 w-4 rounded border-muted-foreground text-primary focus:ring-primary focus:ring-offset-0"
              />
              <label htmlFor="lock-day" className="text-sm font-medium text-muted-foreground cursor-pointer">
                Lock Day
              </label>
            </div>
            
            <Button 
              onClick={onResetData} 
              variant="ghost" 
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Reset Data
            </Button>
          </div>
        </div>
      </header>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} userId={userId} />
    </>
  );
};

export default TrackerHeader;
