import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ExportModal from "./ExportModal";
import { useState } from "react";
import { getDateInEastern } from "@/lib/dateUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatsDashboard from "./StatsDashboard";

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
  const [statsOpen, setStatsOpen] = useState(false);

  const changeDate = (days: number) => {
    setSelectedDate(getDateInEastern(selectedDate, days));
  };

  return (
    <>
      <header className="mb-4">
        {/* Single row header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent uppercase leading-none">
              MINDFLOW
            </h1>
            <p className="text-xs text-muted-foreground mt-1">From Chaos to Clarity</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              onClick={() => setStatsOpen(true)} 
              variant="outline" 
              size="sm"
              className="font-semibold uppercase"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <Button 
              onClick={() => navigate("/food-library")} 
              variant="outline" 
              size="sm"
              className="font-semibold uppercase"
            >
              My Library
            </Button>
            <Button 
              onClick={() => setExportOpen(true)} 
              variant="outline" 
              size="sm"
              className="font-semibold uppercase"
            >
              Export
            </Button>
            <Button 
              onClick={signOut} 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-destructive font-semibold uppercase"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Date navigation and controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1 mt-1 border-t border-border/40">
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
      
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Your Stats
            </DialogTitle>
          </DialogHeader>
          <StatsDashboard userId={userId} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrackerHeader;
