import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ExportModal from "./ExportModal";
import { useState } from "react";

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
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  return (
    <>
      <header className="text-center mb-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-[#002855]">JaxTrax</h1>
          <Button onClick={signOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
        <p className="text-gray-600 mb-6">Your daily guide to mindful nutrition.</p>

        <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
            <button
              onClick={() => changeDate(-1)}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium"
            />
            <button
              onClick={() => changeDate(1)}
              className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="flex items-center ml-4 border-l pl-4">
              <input
                type="checkbox"
                id="lock-day"
                checked={lockDay}
                onChange={(e) => onLockDayChange(e.target.checked)}
                className="h-4 w-4 text-[#CE1141] border-gray-300 rounded focus:ring-[#CE1141]"
              />
              <label htmlFor="lock-day" className="ml-2 text-sm text-gray-600">
                Lock Day
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setExportOpen(true)} variant="outline" size="sm">
              Export
            </Button>
            <Button onClick={() => navigate("/food-library")} variant="outline" size="sm">
              My Food Library
            </Button>
            <Button onClick={onResetData} variant="destructive" size="sm">
              Reset All Data
            </Button>
          </div>
        </div>
      </header>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} userId={userId} />
    </>
  );
};

export default TrackerHeader;
