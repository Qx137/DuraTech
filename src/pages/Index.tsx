
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store, ShoppingBag, Users, TrendingUp, Cpu, Database, Shield, Monitor, UserCheck, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [stats, setStats] = useState({
    farmersCount: 0,
    customersCount: 0,
    productsCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get seller count
        const { count: sellersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'seller');

        // Get buyer count
        const { count: buyersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'buyer');

        // Get products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        setStats({
          farmersCount: sellersCount || 0,
          customersCount: buyersCount || 0,
          productsCount: productsCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Store className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">DuraTech</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/community" className="text-gray-700 hover:text-green-600 transition-colors">
              Community
            </Link>
            <Link to="/ai-tools" className="text-gray-700 hover:text-green-600 transition-colors">
              AI Tools
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

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
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
            <Link to="/register?type=seller">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Store className="mr-2 h-5 w-5" />
                Sell Your Produce
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DuraTech?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connecting farmers and buyers with innovative technology and sustainable practices
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fresh Marketplace</h3>
              <p className="text-gray-600">Direct access to farm-fresh produce with transparent pricing</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Tools</h3>
              <p className="text-gray-600">Smart recommendations and market insights powered by AI</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Hub</h3>
              <p className="text-gray-600">Connect with farmers, buyers, and agriculture enthusiasts</p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Verified</h3>
              <p className="text-gray-600">Verified profiles and secure transactions for peace of mind</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Monitor className="h-16 w-16 mb-6 opacity-90" />
                <h3 className="text-3xl font-bold mb-4">Coming Soon: Mobile App</h3>
                <p className="text-lg opacity-90 mb-6">
                  Take DuraTech with you wherever you go. Our mobile app will bring the marketplace right to your pocket.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" variant="outline" className="text-green-600 border-white bg-white hover:bg-gray-100">
                    Notify Me
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
                  <Monitor className="h-32 w-32 mx-auto opacity-70" />
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
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.farmersCount}+</div>
              <div className="text-gray-600">Verified Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.customersCount}+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.productsCount}+</div>
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
          <UserCheck className="h-12 w-12 text-green-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Stay Updated with DuraTech
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
                <Store className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold">DuraTech</span>
              </div>
              <p className="text-gray-400">
                Connecting farmers and consumers for a sustainable agricultural future.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/marketplace" className="hover:text-green-500 transition-colors">Marketplace</Link></li>
                <li><Link to="/community" className="hover:text-green-500 transition-colors">Community</Link></li>
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
            <p>&copy; 2025 DuraTech. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
