import { AlertTriangle } from 'lucide-react';

interface FullScreenStatusErrorProps {
  onRetry: () => void;
}

export default function FullScreenStatusError({ onRetry }: FullScreenStatusErrorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tight text-destructive mb-2">
          STATUS CHECK FAILED
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Unable to load your account status. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider border-2 border-primary hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-muted text-muted-foreground font-bold uppercase tracking-wider border-2 border-muted hover:bg-muted/90 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
