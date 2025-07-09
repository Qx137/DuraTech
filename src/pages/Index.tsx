
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, ShoppingCart, TrendingUp, Users, Bot, Search, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">DuraHub</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-green-600 transition-colors">
              How it Works
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-green-600 transition-colors">
              Testimonials
            </a>
          </nav>
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
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            Fresh from Farm to Your Table
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect directly with local farmers and access the freshest produce. DuraHub revolutionizes agricultural commerce with AI-powered recommendations and sustainable farming practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?type=buyer">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Shop Fresh Produce
              </Button>
            </Link>
            <Link to="/register?type=seller">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <Users className="mr-2 h-5 w-5" />
                Sell Your Harvest
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <section id="features" className="mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose DuraHub?</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Leaf className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Farm Fresh Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get the freshest produce directly from local farms. No middlemen, no long transport times.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Smart recommendations based on weather, season, and your preferences. Optimize your farming with AI.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Secure Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Safe and secure payment processing with buyer protection and seller guarantees.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Market Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Real-time market data and pricing insights to help farmers maximize their profits.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Join a thriving community of farmers and buyers committed to sustainable agriculture.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Mobile Friendly</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access the marketplace anywhere, anytime with our responsive design and mobile app.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">How DuraHub Works</h3>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Buyers */}
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <ShoppingCart className="mr-3 h-6 w-6 text-green-600" />
                For Buyers
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <span className="text-green-600 font-bold">1</span>
                  </div>
                  <div>
                    <h5 className="font-medium">Browse Fresh Produce</h5>
                    <p className="text-gray-600">Discover seasonal fruits and vegetables from local farms</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <div>
                    <h5 className="font-medium">Get AI Recommendations</h5>
                    <p className="text-gray-600">Receive personalized suggestions based on your preferences</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <div>
                    <h5 className="font-medium">Order & Enjoy</h5>
                    <p className="text-gray-600">Place your order and get fresh produce delivered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Sellers */}
            <div>
              <h4 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Users className="mr-3 h-6 w-6 text-blue-600" />
                For Farmers
              </h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-full p-2 mt-1">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <h5 className="font-medium">List Your Products</h5>
                    <p className="text-gray-600">Upload photos and details of your fresh produce</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-full p-2 mt-1">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <div>
                    <h5 className="font-medium">Reach More Customers</h5>
                    <p className="text-gray-600">Connect with buyers in your area and beyond</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 rounded-full p-2 mt-1">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <div>
                    <h5 className="font-medium">Grow Your Business</h5>
                    <p className="text-gray-600">Use analytics and AI to optimize your sales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">What Our Community Says</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <CardContent>
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-600 mb-4">
                  "DuraHub has transformed how I sell my produce. I can reach customers directly and get better prices for my organic vegetables."
                </p>
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-500">Organic Farmer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent>
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-600 mb-4">
                  "The AI recommendations are spot on! I discovered amazing local farms I never knew existed in my area."
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Mike Chen</p>
                    <p className="text-sm text-gray-500">Home Cook</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent>
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-gray-600 mb-4">
                  "Fresh, quality produce delivered right to my door. The platform makes it so easy to support local farmers."
                </p>
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-full p-2 mr-3">
                    <Heart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Emily Rodriguez</p>
                    <p className="text-sm text-gray-500">Restaurant Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-green-600 text-white rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-4">Ready to Join DuraHub?</h3>
          <p className="text-xl mb-8 opacity-90">
            Start your journey towards fresher, more sustainable food today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?type=buyer">
              <Button size="lg" variant="outline" className="bg-white text-green-600 hover:bg-gray-50 text-lg px-8 py-4">
                Start Shopping
              </Button>
            </Link>
            <Link to="/register?type=seller">
              <Button size="lg" variant="outline" className="bg-white text-green-600 hover:bg-gray-50 text-lg px-8 py-4">
                Start Selling
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">DuraHub</span>
              </div>
              <p className="text-gray-400">
                Connecting farmers and consumers for a more sustainable future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Tools</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DuraHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
