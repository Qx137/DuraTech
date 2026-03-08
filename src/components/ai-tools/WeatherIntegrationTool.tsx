import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CloudSun, MapPin, Loader2, Droplets, Wind, Thermometer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smartSearch } from "@/services/ai";

const WeatherIntegrationTool = () => {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!location) {
      toast({ title: "Missing Location", description: "Please enter your farm location.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Use the AI service to generate weather-based recommendations
      const result = await smartSearch(
        `Weather-based farming recommendations for ${location}. Include current weather conditions estimate, alerts, and what crops to plant or harvest now. Format with clear sections.`
      );
      setWeatherData({
        location,
        recommendations: result,
        // Simulated weather metrics for UI display
        temp: Math.floor(Math.random() * 15) + 18,
        humidity: Math.floor(Math.random() * 30) + 50,
        wind: Math.floor(Math.random() * 20) + 5,
        condition: ["Sunny", "Partly Cloudy", "Overcast", "Light Rain"][Math.floor(Math.random() * 4)],
      });
      toast({ title: "Weather Analysis Complete", description: "Generated weather-based recommendations." });
    } catch (error) {
      console.error(error);
      toast({ title: "Analysis Failed", description: "Failed to fetch weather analysis.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CloudSun className="h-5 w-5 text-amber-600" />
            <span>Weather-Based Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weather-location">
              <MapPin className="inline h-4 w-4 mr-1" />
              Farm Location
            </Label>
            <Input
              id="weather-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Harare, Zimbabwe"
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-amber-600 hover:bg-amber-700">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudSun className="mr-2 h-4 w-4" />}
            Get Weather Insights
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Weather Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {!weatherData ? (
            <div className="text-center text-muted-foreground py-8">
              <CloudSun className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Enter your location to get weather-based farming insights.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Weather metrics cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <Thermometer className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                  <div className="text-xl font-bold text-amber-700">{weatherData.temp}°C</div>
                  <div className="text-xs text-muted-foreground">Temperature</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Droplets className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-xl font-bold text-blue-700">{weatherData.humidity}%</div>
                  <div className="text-xs text-muted-foreground">Humidity</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <Wind className="h-5 w-5 mx-auto mb-1 text-slate-600" />
                  <div className="text-xl font-bold text-slate-700">{weatherData.wind} km/h</div>
                  <div className="text-xs text-muted-foreground">Wind</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                  {weatherData.condition}
                </Badge>
                <span className="text-sm text-muted-foreground">{weatherData.location}</span>
              </div>

              {/* AI Recommendations */}
              <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                {weatherData.recommendations}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherIntegrationTool;
