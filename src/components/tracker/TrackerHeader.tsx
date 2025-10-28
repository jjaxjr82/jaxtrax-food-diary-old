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
      <header className="mb-6 pb-6 border-b border-border">
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 
        className="text-5xl font-impact leading-none tracking-tight uppercase mb-1"
        style={{ 
          background: 'linear-gradient(180deg, #FF0000 0%, #8B0000 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.9))',
          fontWeight: '900'
        }}
      >
        MindFlow
      </h1>
      <p className="text-sm text-muted-foreground">
        From Chaos to Clarity
      </p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="border-border">
        <Target className="h-4 w-4 mr-2" />
        Stats
      </Button>
      <Button variant="outline" size="sm" className="border-border">
        My Library
      </Button>
      <Button variant="outline" size="sm" className="border-border">
        Export
      </Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        Sign Out
      </Button>
    </div>
  </div>
</header>