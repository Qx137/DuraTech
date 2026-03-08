import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Loader2, TrendingUp, TrendingDown, ArrowRight, Wheat, Droplets, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smartSearch } from "@/services/ai";

const ProfitOptimizationTool = () => {
  const [crop, setCrop] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [currentCosts, setCurrentCosts] = useState("");
  const [currentRevenue, setCurrentRevenue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

  const handleOptimize = async () => {
    if (!crop || !farmSize) {
      toast({ title: "Missing Info", description: "Please fill in crop and farm size.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const costInfo = currentCosts ? ` Current monthly costs: $${currentCosts}.` : "";
      const revInfo = currentRevenue ? ` Current monthly revenue: $${currentRevenue}.` : "";
      const result = await smartSearch(
        `Act as an agricultural business consultant. Provide profit optimization strategies for a ${farmSize} hectare farm growing ${crop}.${costInfo}${revInfo} Include: 1) Cost reduction strategies, 2) Revenue maximization tips, 3) Estimated profit improvement %, 4) Resource allocation suggestions. Be specific and actionable.`
      );
      setAnalysis(result);
      toast({ title: "Optimization Complete", description: "Generated profit optimization strategies." });
    } catch (error) {
      console.error(error);
      toast({ title: "Analysis Failed", description: "Could not generate optimization plan.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const currentProfit = currentRevenue && currentCosts ? Number(currentRevenue) - Number(currentCosts) : null;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CircleDollarSign className="h-5 w-5 text-emerald-600" />
            <span>Profit Optimizer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                <Wheat className="inline h-4 w-4 mr-1" />
                Primary Crop
              </Label>
              <Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="e.g., Maize" />
            </div>
            <div className="space-y-2">
              <Label>
                <Droplets className="inline h-4 w-4 mr-1" />
                Farm Size (ha)
              </Label>
              <Input type="number" value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder="e.g., 50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                <TrendingDown className="inline h-4 w-4 mr-1 text-red-500" />
                Monthly Costs ($)
              </Label>
              <Input type="number" value={currentCosts} onChange={(e) => setCurrentCosts(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>
                <TrendingUp className="inline h-4 w-4 mr-1 text-green-500" />
                Monthly Revenue ($)
              </Label>
              <Input type="number" value={currentRevenue} onChange={(e) => setCurrentRevenue(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {currentProfit !== null && (
            <div className={`p-3 rounded-lg text-center ${currentProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <span className="text-sm text-muted-foreground">Current Monthly Profit</span>
              <div className={`text-2xl font-bold ${currentProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${currentProfit.toLocaleString()}
              </div>
            </div>
          )}

          <Button onClick={handleOptimize} disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleDollarSign className="mr-2 h-4 w-4" />}
            Optimize Profits
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Optimization Results</CardTitle>
        </CardHeader>
        <CardContent>
          {!analysis ? (
            <div className="text-center text-muted-foreground py-8">
              <CircleDollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Enter your farm details to get AI-powered profit optimization strategies.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-emerald-100 text-emerald-800"><Wheat className="h-3 w-3 mr-1" />{crop}</Badge>
                <Badge className="bg-blue-100 text-blue-800"><Truck className="h-3 w-3 mr-1" />{farmSize} ha</Badge>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">
                {analysis}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitOptimizationTool;
