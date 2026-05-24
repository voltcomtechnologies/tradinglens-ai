"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFViewerProps {
  fileUrl: string;
  title: string;
  pageCount?: number | null;
}

export function PDFViewer({ fileUrl, title, pageCount }: PDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden transition-all duration-300",
        isFullscreen && "fixed inset-4 z-50 shadow-2xl"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{title}</span>
          {pageCount && (
            <span className="text-xs text-muted-foreground shrink-0">
              • {pageCount} pages
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={cn("relative bg-muted/20", isFullscreen ? "h-[calc(100%-52px)]" : "h-[500px] lg:h-[600px]")}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
          </div>
        )}

        <iframe
          src={googleViewerUrl}
          className={cn(
            "w-full h-full border-0",
            isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"
          )}
          onLoad={handleIframeLoad}
          title={title}
          allowFullScreen
        />
      </div>
    </div>
  );
}
