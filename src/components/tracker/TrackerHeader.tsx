import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TrackerHeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  signOut: () => void;
}

const TrackerHeader = ({ selectedDate, setSelectedDate, signOut }: TrackerHeaderProps) => {
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  return (
    <header className="text-center mb-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-[#002855]">JaxTrax</h1>
        <Button onClick={signOut} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
      <p className="text-gray-600 mb-6">Your daily guide to mindful nutrition.</p>

      <div className="flex items-center justify-center gap-2 bg-white p-2 rounded-lg shadow-sm w-fit mx-auto">
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
      </div>
    </header>
  );
};

export default TrackerHeader;
