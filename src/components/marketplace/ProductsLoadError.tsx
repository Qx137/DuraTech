import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductsLoadErrorProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

const ProductsLoadError = ({ message, onRetry, isRetrying }: ProductsLoadErrorProps) => {
  return (
    <div className="text-center py-20">
      <div className="bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <WifiOff className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Couldn't load products</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        This is a connection or server problem, not an empty catalogue. Check your
        connection and try again.
      </p>
      {message && (
        <p className="mt-3 text-xs text-muted-foreground/70 font-mono break-words max-w-sm mx-auto">
          {message}
        </p>
      )}
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        variant="outline"
        className="mt-5 rounded-xl"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? "animate-spin" : ""}`} />
        {isRetrying ? "Retrying..." : "Try again"}
      </Button>
    </div>
  );
};

export default ProductsLoadError;
