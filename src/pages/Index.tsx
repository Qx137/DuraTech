
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Leaf, ShoppingCart, Users, TrendingUp, Zap, Brain, Shield, Smartphone, Heart, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-800">DuraHub</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/ai-tools" className="text-gray-700 hover:text-green-600 transition-colors">
              AI Tools
            </Link>
            <a href="#about" className="text-gray-700 hover:text-green-600 transition-colors">
              About
            </a>
            <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors">
              Contact
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Farm Fresh to Your
            <span className="text-green-600 block">Doorstep</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect directly with local farmers, access fresh produce, and revolutionize your agricultural business with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register?type=buyer">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
            <Link to="/register?type=seller">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Leaf className="mr-2 h-5 w-5" />
                Sell Your Produce
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose DuraHub?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <Brain className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-xl">AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Get smart recommendations, price predictions, and crop insights powered by advanced AI technology.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Verified Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  All farmers are verified and products are quality-checked to ensure you get the freshest produce.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Direct Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Connect directly with farmers, supporting local agriculture and getting better prices.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Smartphone className="h-16 w-16 mb-6 opacity-90" />
                <h3 className="text-3xl font-bold mb-4">Coming Soon: Mobile App</h3>
                <p className="text-lg opacity-90 mb-6">
                  Take DuraHub with you wherever you go. Our mobile app will bring the marketplace right to your pocket.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" variant="outline" className="text-green-600 border-white bg-white hover:bg-gray-100">
                    Notify Me
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
                  <Smartphone className="h-32 w-32 mx-auto opacity-70" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">1000+</div>
              <div className="text-gray-600">Verified Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">50k+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">100+</div>
              <div className="text-gray-600">Product Varieties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <Heart className="h-12 w-12 text-green-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Stay Updated with DuraHub
          </h3>
          <p className="text-gray-600 mb-6">
            Get the latest updates on fresh produce, seasonal offers, and agricultural insights.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
            />
            <Button className="bg-green-600 hover:bg-green-700">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold">DuraHub</span>
              </div>
              <p className="text-gray-400">
                Connecting farmers and consumers for a sustainable agricultural future.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/marketplace" className="hover:text-green-500 transition-colors">Marketplace</Link></li>
                <li><Link to="/ai-tools" className="hover:text-green-500 transition-colors">AI Tools</Link></li>
                <li><a href="#about" className="hover:text-green-500 transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-green-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">For Farmers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register?type=seller" className="hover:text-green-500 transition-colors">Sell Produce</Link></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Farmer Resources</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-green-500 transition-colors">Returns</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 DuraHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
