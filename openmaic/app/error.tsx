'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[RootError] Global client error:', error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-destructive/20">
        <div className="text-center space-y-5">
          <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto border-2 border-destructive/20">
            <AlertCircle className="size-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error.message || 'An unexpected error occurred while rendering the page.'}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Go to Home
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={() => reset()}
            >
              <RefreshCw className="size-4 mr-2" />
              Reload
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
