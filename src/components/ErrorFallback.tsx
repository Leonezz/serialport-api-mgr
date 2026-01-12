import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-4 bg-background">
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-destructive" />
        <div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-1">
            An error occurred while rendering this component.
          </p>
          <details className="mt-3 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-32 border border-border">
              {error.message}
            </pre>
          </details>
        </div>
        <Button onClick={resetErrorBoundary} variant="outline" className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
