'use client';

import { useEffect } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function GenerationPreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GenerationPreviewError] Caught client-side error:', error);
  }, [error]);

  const handleBackToHome = () => {
    try {
      sessionStorage.removeItem('generationSession');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-red-500/20">
        <div className="text-center space-y-5">
          <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border-2 border-red-500/20">
            <AlertCircle className="size-7 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Generation Error</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error.message || 'A client-side exception occurred while preparing the classroom.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={handleBackToHome}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to Home
            </Button>
            <Button
              className="flex-1 h-11 bg-primary text-primary-foreground hover:opacity-90"
              onClick={() => reset()}
            >
              <RefreshCw className="size-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
