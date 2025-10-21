import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface VoiceDictationProps {
  onTranscript: (text: string) => void;
}

const VoiceDictation = ({ onTranscript }: VoiceDictationProps) => {
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Error",
        description: "Speech recognition failed. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    (window as any).__recognition = recognition;

    return () => {
      if ((window as any).__recognition) {
        (window as any).__recognition.stop();
      }
    };
  }, [onTranscript, toast]);

  const toggleListening = () => {
    const recognition = (window as any).__recognition;
    if (!recognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-full transition-colors ${
        isListening
          ? "text-[#CE1141] animate-pulse"
          : "text-gray-500 hover:bg-gray-100"
      }`}
      title={isListening ? "Stop Dictation" : "Start Dictation"}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
};

export default VoiceDictation;
