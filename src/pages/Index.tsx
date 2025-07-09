
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, ShoppingCart, TrendingUp, Users, Bot, Search, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">AgriMarket</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/ai-tools" className="text-gray-700 hover:text-green-600 transition-colors">
              AI Tools
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-green-600 transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-green-600 hover:bg-green-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Connecting <span className="text-green-600">Farmers</span> & <span className="text-green-600">Buyers</span>
            <br />with AI-Powered Intelligence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The modern marketplace for agricultural products. Buy directly from farmers, 
            get AI-powered crop recommendations, and make data-driven farming decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?type=buyer">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Shop as Buyer
              </Button>
            </Link>
            <Link to="/register?type=seller">
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 text-lg px-8 py-4">
                <Leaf className="mr-2 h-5 w-5" />
                Sell as Farmer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose AgriMarket?</h2>
          <p className="text-xl text-gray-600">Advanced technology meets traditional agriculture</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardHeader className="text-center">
              <Bot className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Get personalized crop suggestions and market insights powered by machine learning
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Price Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Forecast market prices to make informed selling and buying decisions
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardHeader className="text-center">
              <Search className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Smart Search</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Find exactly what you need with AI-powered search and filtering
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
            <CardHeader className="text-center">
              <Truck className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">Direct Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Connect directly with farmers for fresher produce and better prices
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-green-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-green-100">Active Farmers</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-green-100">Products Listed</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-4xl font-bold mb-2">25,000+</div>
              <div className="text-green-100">Happy Buyers</div>
            </div>
            <div className="animate-fade-in">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-green-100">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Ready to Transform Your Agricultural Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of farmers and buyers already using AgriMarket to grow their business
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
              Start Your Journey Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">AgriMarket</span>
              </div>
              <p className="text-gray-400">
                Connecting agriculture with technology for a sustainable future.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Farmers</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Sell Products</li>
                <li>Market Analytics</li>
                <li>AI Insights</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Buyers</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Fresh Produce</li>
                <li>Direct from Farm</li>
                <li>Bulk Orders</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AgriMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
