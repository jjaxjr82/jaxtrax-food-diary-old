import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, Keyboard } from "lucide-react";
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
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
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

      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported on this browser");
        setManualMode(true);
        return;
      }

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const devices = await readerRef.current.listVideoInputDevices();
      console.log("Available cameras:", devices);
      
      if (devices.length === 0) {
        setError("No camera found on this device");
        setManualMode(true);
        return;
      }

      // Prefer back camera on mobile
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      const selectedDevice = backCamera || devices[0];
      console.log("Selected camera:", selectedDevice);

      // Request camera permissions explicitly for better Samsung compatibility
      const constraints = {
        video: {
          deviceId: selectedDevice.deviceId,
          facingMode: backCamera ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      await navigator.mediaDevices.getUserMedia(constraints);

      readerRef.current.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current!,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            console.log("Barcode scanned:", barcode);
            toast({
              title: "Barcode detected",
              description: `Code: ${barcode}`,
            });
            onScan(barcode);
            stopScanning();
            onOpenChange(false);
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.error("Scanner error:", err);
          }
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      const errorMessage = err.name === 'NotAllowedError' 
        ? "Camera access denied. Please allow camera permissions in your browser settings."
        : err.name === 'NotFoundError'
        ? "No camera found on this device."
        : err.message || "Failed to access camera";
      
      setError(errorMessage);
      setManualMode(true);
      toast({
        title: "Camera Error",
        description: "Switching to manual entry mode",
        variant: "destructive",
      });
    }
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode("");
      setManualMode(false);
      onOpenChange(false);
      toast({
        title: "Barcode entered",
        description: `Code: ${manualBarcode.trim()}`,
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
            {manualMode ? <Keyboard className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            {manualMode ? "Enter Barcode" : "Scan Barcode"}
          </DialogTitle>
          <DialogDescription>
            {manualMode 
              ? "Type the barcode number manually" 
              : "Position the barcode in the center of the camera view"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
          {manualMode ? (
            <div className="space-y-4">
              <div className="bg-muted/50 border rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Camera not available. Enter barcode manually:
                </p>
                <Input
                  type="text"
                  placeholder="Enter barcode number"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit();
                    }
                  }}
                  className="text-center text-lg"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleManualSubmit} 
                  className="flex-1"
                  disabled={!manualBarcode.trim()}
                >
                  Submit
                </Button>
                <Button 
                  onClick={() => {
                    setManualMode(false);
                    setError(null);
                    startScanning();
                  }} 
                  variant="outline"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Try Camera
                </Button>
              </div>
            </div>
          ) : error ? (
            <div className="bg-muted/50 border rounded-lg p-8 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={startScanning} variant="outline">
                  Try Again
                </Button>
                <Button 
                  onClick={() => setManualMode(true)} 
                  variant="outline"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '400px' }}
                playsInline
                autoPlay
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-primary w-64 h-48 rounded-lg opacity-50" />
              </div>
            </>
          )}
        </div>

        {!manualMode && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            {scanning ? "Position barcode in the center" : "Initializing camera..."}
          </div>
        )}

        {!manualMode && (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
