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
    let timeoutId: NodeJS.Timeout;
    let initTimeoutId: NodeJS.Timeout;
    
    if (open) {
      // Give the DOM a moment to fully mount the video element
      initTimeoutId = setTimeout(() => {
        if (videoRef.current) {
          startScanning();
        }
      }, 100);
      
      // Set a timeout to switch to manual mode if camera doesn't start
      timeoutId = setTimeout(() => {
        if (!scanning && !error && !manualMode) {
          console.log("Camera initialization timeout - switching to manual mode");
          setError("Camera initialization timed out");
          setManualMode(true);
        }
      }, 5000); // 5 second timeout
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initTimeoutId);
      stopScanning();
    };
  }, [open]);

  const startScanning = async () => {
    console.log("Starting barcode scanner...");
    try {
      setError(null);
      setManualMode(false);

      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("getUserMedia not supported");
        setError("Camera not supported on this browser");
        setManualMode(true);
        setScanning(false);
        return;
      }

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      let devices;
      try {
        devices = await readerRef.current.listVideoInputDevices();
        console.log("Available cameras:", devices);
      } catch (deviceError) {
        console.error("Error listing devices:", deviceError);
        setError("Unable to access camera devices");
        setManualMode(true);
        setScanning(false);
        return;
      }
      
      if (devices.length === 0) {
        console.log("No cameras found");
        setError("No camera found on this device");
        setManualMode(true);
        setScanning(false);
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

      // Start decoding with a simpler approach
      try {
        await readerRef.current.decodeFromVideoDevice(
          selectedDevice.deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const barcode = result.getText();
              console.log("Barcode scanned:", barcode);
              setScanning(true); // Mark as actively scanning once video starts
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
        console.log("Scanner started successfully");
        setScanning(true);
      } catch (decodeError) {
        console.error("Error starting decode:", decodeError);
        throw decodeError;
      }
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      const errorMessage = err.name === 'NotAllowedError' 
        ? "Camera access denied. Please allow camera permissions."
        : err.name === 'NotFoundError'
        ? "No camera found on this device."
        : err.name === 'NotReadableError'
        ? "Camera is already in use by another application."
        : err.message || "Failed to access camera";
      
      setError(errorMessage);
      setManualMode(true);
      setScanning(false);
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
