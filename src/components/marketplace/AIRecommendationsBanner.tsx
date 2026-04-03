import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const AIRecommendationsBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-4 md:p-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="bg-primary-foreground/20 backdrop-blur-sm rounded-2xl p-3 shrink-0">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-primary-foreground">AI Picks for You</h3>
          <p className="text-xs text-primary-foreground/80 mt-0.5 line-clamp-1">
            Seasonal recommendations based on your location & trends
          </p>
        </div>
        <Link to="/ai-tools">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-xl text-xs font-medium shrink-0"
          >
            Explore
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AIRecommendationsBanner;
