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
  onLockDayChange,
}: TrackerHeaderProps) => {
  const navigate = useNavigate();
  const [exportOpen, setExportOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const changeDate = (days: number) => {
    setSelectedDate(getDateInEastern(selectedDate, days));
  };

  return (
    <>
      <header className="mb-6 pb-6 border-b border-border">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-5xl font-black uppercase mb-1"
              style={{
                fontFamily: "Montserrat, Arial, sans-serif",
                background: "linear-gradient(180deg, #FF0000 0%, #8B0000 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.9))",
                fontWeight: 900,
              }}
            >
              FUEL TRACKER
            </h1>
            <p className="text-sm text-muted-foreground">From Chaos to Clarity</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border" onClick={() => setStatsOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <Button variant="outline" size="sm" className="border-border" onClick={() => navigate("/food-library")}>
              My Library
            </Button>
            <Button variant="outline" size="sm" className="border-border" onClick={() => setExportOpen(true)}>
              Export
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-lg font-medium min-w-[140px] text-center">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} userId={userId} />

      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Statistics Dashboard</DialogTitle>
          </DialogHeader>
          <StatsDashboard userId={userId} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TrackerHeader;
