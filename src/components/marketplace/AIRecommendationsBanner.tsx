
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AIRecommendationsBanner = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-2">🤖 AI Recommendations for You</h3>
          <p className="opacity-90">Based on seasonal trends and your location, we recommend fresh corn and tomatoes!</p>
        </div>
        <Link to="/ai-tools">
          <Button variant="outline" className="text-black border-white hover:bg-white hover:text-purple-600">
            View AI Tools
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AIRecommendationsBanner;
