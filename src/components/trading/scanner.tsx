"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { useDropzone } from "react-dropzone";
import {
  Camera,
  Upload,
  Scan,
  RefreshCw,
  AlertCircle,
  Maximize,
  Minimize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ScanSignal = "buy" | "sell" | "hold" | null;

export interface ScannerResult {
  signal: ScanSignal;
  confidence: number;
  pair: string;
  timeframe: string;
  analysis: string;
}

interface TradingScannerProps {
  onScanComplete?: () => void;
  onImageCapture?: (imageData: string | File) => void;
  isAnalyzing?: boolean;
  className?: string;
}

export function TradingScanner({
  onScanComplete,
  onImageCapture,
  isAnalyzing = false,
  className,
}: TradingScannerProps) {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [isRequestingCamera, setIsRequestingCamera] = useState(true);
  const [announcement, setAnnouncement] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(true);
  const hasAnnouncedGranted = useRef(false);
  const webcamRef = useRef<Webcam>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check camera permission status on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      setIsRequestingCamera(false);
      return;
    }

    setIsRequestingCamera(true);
    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((status) => {
        setPermissionStatus(status.state as "prompt" | "granted" | "denied");
        setIsRequestingCamera(false);
        status.addEventListener("change", () => {
          setPermissionStatus(status.state as "prompt" | "granted" | "denied");
        });
      })
      .catch(() => {
        // Some browsers don't support querying camera permission
        setIsRequestingCamera(false);
      });
  }, []);

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      onImageCapture?.(imageSrc);
      setAnnouncement("Chart captured from camera.");
    }
  }, [onImageCapture]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        onImageCapture?.(file);
        setAnnouncement("Chart image uploaded.");
      }
    },
    [onImageCapture]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleScan = () => {
    if (!capturedImage && !uploadedFile) return;
    setAnnouncement("Scanning chart. Please wait.");
    onScanComplete?.();
  };

  const hasImage = capturedImage || uploadedFile;
  const imageSrc = capturedImage || previewUrl || "";

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Announce file rejection errors to screen readers
  useEffect(() => {
    if (fileRejections.length > 0) {
      setAnnouncement("File upload failed. File too large or invalid format.");
    }
  }, [fileRejections]);

  // Clear announcement after it's been read so the same message can be re-announced
  useEffect(() => {
    if (!announcement) return;
    const timer = setTimeout(() => setAnnouncement(""), 5000);
    return () => clearTimeout(timer);
  }, [announcement]);

  // Collapse expanded view on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden border border-primary/20 bg-card/40 backdrop-blur-xl transition-all duration-300",
        isExpanded
          ? "w-full min-h-[60vh] sm:min-h-[70vh] rounded-3xl flex flex-col shadow-2xl shadow-primary/10"
          : "max-w-3xl mx-auto rounded-3xl",
        className
      )}
    >
      {/* Animated top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary z-20 animate-pulse" />

      {/* Subtle animated grid background */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.08)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 rounded-xl blur-lg animate-pulse" />
            <div className="relative p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Scan className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-foreground">
              Trading Lens Scanner
            </h3>
            <p className="text-xs text-muted-foreground">AI-powered chart analysis</p>
          </div>
        </div>

        {/* Expand toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpanded}
            aria-pressed={isExpanded}
            aria-label={isExpanded ? "Compact scanner" : "Expand scanner"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
          >
            {isExpanded ? (
              <Minimize className="h-3.5 w-3.5" />
            ) : (
              <Maximize className="h-3.5 w-3.5" />
            )}
            {isExpanded ? "Compact" : "Expand"}
          </button>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50 shadow-inner">
          <button
            onClick={() => setMode("camera")}
            aria-pressed={mode === "camera"}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              mode === "camera"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Camera className="h-3.5 w-3.5" />
            Camera
          </button>
          <button
            onClick={() => setMode("upload")}
            aria-pressed={mode === "upload"}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              mode === "upload"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
        </div>
        </div>
      </div>

      {/* Scan viewport */}
      <div
        className={cn("relative bg-black/40 overflow-hidden transition-all duration-300", isExpanded ? "flex-1" : "aspect-video")}
      >
        {!hasImage ? (
          <>
            {mode === "camera" ? (
              <div className="absolute inset-0">
                {isRequestingCamera ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full mb-4"
                    />
                    <h4 className="text-lg font-semibold mb-2">Requesting Camera Access</h4>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Please allow camera access when prompted by your browser.
                    </p>
                  </div>
                ) : permissionStatus === "denied" ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Camera Access Denied</h4>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Please allow camera access in your browser settings to use the scanner.
                    </p>
                  </div>
                ) : (
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.95}
                    videoConstraints={{ facingMode: "environment" }}
                    onUserMediaError={(err) => {
                      console.error("Camera error:", err);
                      setCameraError("Could not access camera. Please check permissions.");
                      setPermissionStatus("denied");
                      setIsRequestingCamera(false);
                      setAnnouncement("Camera access denied. Please allow camera access in your browser settings.");
                    }}
                    onUserMedia={() => {
                      setCameraError(null);
                      setPermissionStatus("granted");
                      setIsRequestingCamera(false);
                      if (!hasAnnouncedGranted.current) {
                        hasAnnouncedGranted.current = true;
                        setAnnouncement("Camera access granted.");
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center p-8 cursor-pointer transition-colors",
                  isDragActive ? "bg-primary/10" : "bg-black/20"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 border-dashed">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">
                  {isDragActive ? "Drop chart image here" : "Upload chart image"}
                </h4>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Drag & drop a forex chart image, or click to browse. Supports PNG, JPG, WEBP up to 10MB.
                </p>
              </div>
            )}

            {/* Animated corner brackets */}
            <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-primary/80 rounded-tl-lg shadow-[0_0_12px_hsl(var(--primary)/0.4)]" />
            <div className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-primary/80 rounded-tr-lg shadow-[0_0_12px_hsl(var(--primary)/0.4)]" />
            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-primary/80 rounded-bl-lg shadow-[0_0_12px_hsl(var(--primary)/0.4)]" />
            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-primary/80 rounded-br-lg shadow-[0_0_12px_hsl(var(--primary)/0.4)]" />
          </>
        ) : (
          <div className="absolute inset-0">
            <img
              src={imageSrc}
              alt="Captured chart"
              className="w-full h-full object-contain bg-black/60"
            />
            <AnimatePresence>
              {isAnalyzing && <ScanningOverlay />}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-primary/10">
        <div className="flex items-center gap-2">
          {!hasImage ? (
            mode === "camera" ? (
              <Button
                onClick={handleCapture}
                disabled={permissionStatus === "denied"}
                className="bg-primary hover:bg-primary/90 glow-orange shadow-lg shadow-primary/20"
              >
                <Camera className="h-4 w-4 mr-2" />
                Snap Chart
              </Button>
            ) : null
          ) : (
            <Button variant="outline" onClick={handleRetake} disabled={isAnalyzing}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasImage && (
            <Button
              onClick={handleScan}
              disabled={isAnalyzing}
              className="bg-primary hover:bg-primary/90 glow-orange min-w-[140px]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Chart
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Error messages */}
      {cameraError && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {cameraError}
          </div>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            File too large or invalid format. Please use PNG, JPG, or WEBP under 10MB.
          </div>
        </div>
      )}
    </div>
  );
}

function ScanningOverlay() {
  // Precompute fixed positions to avoid hydration mismatch and re-render jumps
  const points = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: `${((i * 37) % 90) + 5}%`,
        top: `${((i * 23) % 90) + 5}%`,
        delay: (i % 6) * 0.1,
      })),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,107,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,107,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Scanning laser line */}
      <motion.div
        animate={{ y: ["0%", "100%", "0%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(255,107,0,0.8)]"
      />

      {/* Scanning data points */}
      {points.map((point) => (
        <motion.div
          key={point.id}
          className="absolute w-1 h-1 rounded-full bg-primary"
          style={{
            left: point.left,
            top: point.top,
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: point.delay,
          }}
        />
      ))}

      {/* HUD corners */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary rounded-br-lg" />

      {/* Status text */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-primary/30 backdrop-blur-sm">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-4 w-4 text-primary" />
        </motion.div>
        <span className="text-xs font-mono text-primary uppercase tracking-widest">
          Analyzing chart patterns...
        </span>
      </div>
    </motion.div>
  );
}
