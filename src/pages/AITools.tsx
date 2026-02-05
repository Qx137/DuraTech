
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, Search, Leaf, MapPin, Calendar, DollarSign, Cloud, Thermometer, Loader2, Key } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { generateCropRecommendations, analyzePriceTrends, smartSearch, CropRecommendation, PriceAnalysis } from "@/services/ai";

const AITools = () => {
  const [selectedTool, setSelectedTool] = useState("recommendations");
  const [location, setLocation] = useState("");
  const [season, setSeason] = useState("");
  const [soilType, setSoilType] = useState("");
  const [cropType, setCropType] = useState("");
  const [priceQuery, setPriceQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const { toast } = useToast();

  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysis | null>(null);
  const [searchResults, setSearchResults] = useState("");

  const handleGenerateRecommendations = async () => {
    if (!location || !season || !soilType) {
      toast({
        title: "Missing Information",
        description: "Please provide location, season, and soil type.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setCropRecommendations([]);

    try {
      const results = await generateCropRecommendations(location, season, soilType);
      setCropRecommendations(results);
      toast({
        title: "AI Analysis Complete",
        description: "Generated crop recommendations based on your location and market data.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "Failed to generate recommendations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceAnalysis = async () => {
    if (!cropType) {
      toast({
        title: "Missing Information",
        description: "Please select a crop type.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setPriceAnalysis(null);

    try {
      const result = await analyzePriceTrends(cropType, "3 months");
      setPriceAnalysis(result);
      toast({
        title: "Price Analysis Ready",
        description: `Generated price predictions for ${cropType}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze prices. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartSearch = async () => {
    if (!searchQuery) {
      toast({
        title: "Empty Query",
        description: "Please enter a search query.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSearchResults("");

    try {
      const result = await smartSearch(searchQuery);
      setSearchResults(result);
      toast({
        title: "Search Complete",
        description: "Found relevant insights using AI.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Search Failed",
        description: "Failed to perform search. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Durahub Logo"
              className="h-16"
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-green-600 transition-colors">
              Dashboard
            </Link>
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/community" className="text-gray-700 hover:text-green-600 transition-colors">
              Community
            </Link>
            <Link to="/ai-tools" className="text-green-600 font-medium">
              AI Tools
            </Link>
          </nav>
          <Link to="/login">
            <Button className="bg-green-600 hover:bg-green-700">
              Account
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            <Bot className="inline h-10 w-10 mr-3 text-green-600" />
            AI-Powered Agricultural Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Leverage artificial intelligence to make smarter farming and trading decisions
          </p>

        </div>

        {/* Tool Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedTool === "recommendations" ? "ring-2 ring-green-500 shadow-lg" : ""
              }`}
            onClick={() => setSelectedTool("recommendations")}
          >
            <CardHeader className="text-center">
              <Bot className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Crop Recommendations</CardTitle>
              <CardDescription>AI suggests best crops for your location</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedTool === "pricing" ? "ring-2 ring-blue-500 shadow-lg" : ""
              }`}
            onClick={() => setSelectedTool("pricing")}
          >
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Price Predictions</CardTitle>
              <CardDescription>Forecast market prices with ML</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedTool === "search" ? "ring-2 ring-purple-500 shadow-lg" : ""
              }`}
            onClick={() => setSelectedTool("search")}
          >
            <CardHeader className="text-center">
              <Search className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Smart Search</CardTitle>
              <CardDescription>Intelligent product discovery</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tool Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {selectedTool === "recommendations" && <Bot className="h-5 w-5 text-green-600" />}
                {selectedTool === "pricing" && <TrendingUp className="h-5 w-5 text-blue-600" />}
                {selectedTool === "search" && <Search className="h-5 w-5 text-purple-600" />}
                <span>
                  {selectedTool === "recommendations" && "Get Crop Recommendations"}
                  {selectedTool === "pricing" && "Analyze Price Trends"}
                  {selectedTool === "search" && "Smart Product Search"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTool === "recommendations" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Your Location
                    </Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., California, USA"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Season
                      </Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spring">Spring</SelectItem>
                          <SelectItem value="summer">Summer</SelectItem>
                          <SelectItem value="fall">Fall</SelectItem>
                          <SelectItem value="winter">Winter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        <Cloud className="inline h-4 w-4 mr-1" />
                        Soil Type
                      </Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Soil type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clay">Clay</SelectItem>
                          <SelectItem value="sandy">Sandy</SelectItem>
                          <SelectItem value="loam">Loam</SelectItem>
                          <SelectItem value="silt">Silt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateRecommendations}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Generate AI Recommendations
                  </Button>
                </>
              )}

              {selectedTool === "pricing" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cropType">
                      <Leaf className="inline h-4 w-4 mr-1" />
                      Crop Type
                    </Label>
                    <Select value={cropType} onValueChange={setCropType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tomatoes">Tomatoes</SelectItem>
                        <SelectItem value="corn">Corn</SelectItem>
                        <SelectItem value="wheat">Wheat</SelectItem>
                        <SelectItem value="apples">Apples</SelectItem>
                        <SelectItem value="lettuce">Lettuce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Prediction Period
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1week">1 Week</SelectItem>
                        <SelectItem value="1month">1 Month</SelectItem>
                        <SelectItem value="3months">3 Months</SelectItem>
                        <SelectItem value="6months">6 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handlePriceAnalysis}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Analyze Price Trends
                  </Button>
                </>
              )}

              {selectedTool === "search" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="searchQuery">
                      <Search className="inline h-4 w-4 mr-1" />
                      Describe what you're looking for
                    </Label>
                    <Textarea
                      id="searchQuery"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., 'organic vegetables for Italian cooking', 'winter-hardy fruit trees', 'high-protein livestock feed'"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Search Preferences</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                        Organic Only
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                        Local Farmers
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                        Best Price
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                        Highest Rated
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={handleSmartSearch}
                    disabled={isLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Search with AI
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>AI Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTool === "recommendations" && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">🌱</div>
                    <h3 className="font-semibold text-lg">Recommended Crops for Your Area</h3>
                  </div>
                  {cropRecommendations.length === 0 ? (
                    <div className="text-center text-gray-500">
                      Enter your details above to get AI recommendations.
                    </div>
                  ) : (
                    cropRecommendations.map((crop, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-green-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{crop.crop}</h4>
                          <Badge
                            className={`${crop.confidence >= 90 ? 'bg-green-100 text-green-800' :
                              crop.confidence >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'}`}
                          >
                            {crop.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{crop.reason}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Expected price: {crop.price}</span>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedTool === "pricing" && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">📈</div>
                    <h3 className="font-semibold text-lg">Price Analysis {cropType ? `for ${cropType}` : ""}</h3>
                  </div>

                  {!priceAnalysis ? (
                    <div className="text-center text-gray-500">
                      Select a crop and timeframe to analyze price trends.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Current Price</div>
                          <div className="text-2xl font-bold text-blue-600">{priceAnalysis.current}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Predicted Price</div>
                          <div className="text-2xl font-bold text-green-600">{priceAnalysis.prediction}</div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Trend Analysis</span>
                          <Badge className={`${priceAnalysis.trend === 'increasing' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {priceAnalysis.trend}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Confidence: {priceAnalysis.confidence}%
                        </div>
                        <div className="text-sm">
                          <strong>Key factors:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {priceAnalysis.factors.map((factor, index) => (
                              <li key={index}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedTool === "search" && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">🔍</div>
                    <h3 className="font-semibold text-lg">Smart Search Results</h3>
                  </div>
                  {searchResults ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-left whitespace-pre-wrap">
                      {searchResults}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      Enter a search query above to see AI-powered product recommendations
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Banner */}
        <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">🚀 Coming Soon: Advanced AI Features</h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="text-center">
                <Thermometer className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold">Weather Integration</h4>
                <p className="text-sm opacity-90">Real-time weather-based recommendations</p>
              </div>
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold">Profit Optimization</h4>
                <p className="text-sm opacity-90">Maximize your farming profits with AI</p>
              </div>
              <div className="text-center">
                <Bot className="h-8 w-8 mx-auto mb-2" />
                <h4 className="font-semibold">Personal AI Assistant</h4>
                <p className="text-sm opacity-90">24/7 agricultural guidance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITools;
