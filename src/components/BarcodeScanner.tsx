import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner = ({ open, onOpenChange, onScan }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (open && videoRef.current) {
      startScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open]);

  const startScanning = async () => {
    try {
      setError(null);
      setScanning(true);

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const devices = await readerRef.current.listVideoInputDevices();
      
      if (devices.length === 0) {
        setError("No camera found on this device");
        return;
      }

      // Prefer back camera on mobile
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      const selectedDevice = backCamera || devices[0];

      readerRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current!,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            toast({
              title: "Barcode detected",
              description: `Code: ${barcode}`,
            });
            onScan(barcode);
            stopScanning();
            onOpenChange(false);
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.error(err);
          }
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(err.message || "Failed to access camera");
      toast({
        title: "Camera Error",
        description: "Please allow camera access to scan barcodes",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setScanning(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={startScanning} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-[#CE1141] w-64 h-48 rounded-lg opacity-50" />
              </div>
            </>
          )}
        </div>

        <div className="text-center text-sm text-gray-500 mt-2">
          {scanning ? "Position barcode in the center" : "Initializing camera..."}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            stopScanning();
            onOpenChange(false);
          }}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
