import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store, ShoppingBag, Users, TrendingUp, Cpu, Shield, UserCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TRUSTED_ITEMS = [
  "Fresh Produce", "Local Farmers", "AI Insights", "Secure Payments",
  "Community Hub", "24/7 Support", "Delivery Ready", "Sustainable"
];

const Index = () => {
  const [stats, setStats] = useState({
    farmersCount: 0,
    customersCount: 0,
    productsCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: sellersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'seller');

        const { count: buyersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'buyer');

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <img src="/logo.png" alt="Durahub Logo" className="h-14" />
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/marketplace" className="text-gray-600 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/community" className="text-gray-600 hover:text-green-600 transition-colors">
              Community
            </Link>
            <Link to="/ai-tools" className="text-gray-600 hover:text-green-600 transition-colors">
              AI Tools
            </Link>
          </nav>
          <div className="flex items-center gap-3">
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
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight tracking-tight">
            Farm Fresh to Your
            <span className="text-green-600 block mt-2">Doorstep</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect directly with local farmers, access fresh produce, and revolutionize your agricultural business with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register?type=buyer">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-base px-8 py-6 rounded-xl">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
            <Link to="/register?type=seller">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl">
                <Store className="mr-2 h-5 w-5" />
                Sell Your Produce
              </Button>
            </Link>
            <Link to="/delivery">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl border-orange-500 text-orange-600 hover:bg-orange-50">
                <Truck className="mr-2 h-5 w-5" />
                DuraHub Delivery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trusted By Ticker */}
      <section className="py-8 border-y border-gray-200/60 bg-white/50 overflow-hidden">
        <div className="flex flex-nowrap animate-ticker w-max">
          {[...TRUSTED_ITEMS, ...TRUSTED_ITEMS].map((item, i) => (
            <span key={i} className="mx-8 text-gray-500 font-medium text-sm whitespace-nowrap shrink-0">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Why Section - Bento Grid */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Durahub?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connecting farmers and buyers with innovative technology and sustainable practices
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <ShoppingBag className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fresh Marketplace</h3>
                <p className="text-gray-600 leading-relaxed">
                  Direct access to farm-fresh produce with transparent pricing
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <Cpu className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Tools</h3>
                <p className="text-gray-600 leading-relaxed">
                  Smart recommendations and market insights powered by AI
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow md:col-span-1">
              <CardContent className="p-8">
                <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Community Hub</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with farmers, buyers, and agriculture enthusiasts
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-shadow md:col-span-3">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="bg-green-100 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0">
                    <Shield className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Secure & Verified</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Verified profiles and secure transactions for peace of mind. Trusted by farmers and buyers alike.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-section" className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="overflow-hidden rounded-2xl border-0 shadow-xl bg-gradient-to-r from-green-600 to-emerald-600">
            <CardContent className="p-8 md:p-12 text-white">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <UserCheck className="h-14 w-14 mb-6 opacity-90" />
                  <h3 className="text-3xl font-bold mb-4">About Durahub</h3>
                  <p className="text-lg opacity-90 mb-6 leading-relaxed">
                    Founded with a mission to bridge the gap between farmers and consumers, Durahub revolutionizes agricultural commerce through innovative technology and sustainable practices.
                  </p>
                  <Button size="lg" variant="outline" className="text-green-600 border-white bg-white hover:bg-gray-100 rounded-xl">
                    Learn More
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, label: "Trusted Platform" },
                    { icon: Users, label: "Community Driven" },
                    { icon: Cpu, label: "AI Powered" },
                    { icon: TrendingUp, label: "Growth Focused" }
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                      <Icon className="h-10 w-10 mx-auto mb-2 opacity-80" />
                      <p className="text-sm opacity-90">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section - Bento */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: stats.farmersCount, label: "Verified Farmers", suffix: "+" },
              { value: stats.customersCount, label: "Happy Customers", suffix: "+" },
              { value: stats.productsCount, label: "Product Varieties", suffix: "+" },
              { value: "24/7", label: "Support", suffix: "" }
            ].map(({ value, label, suffix }) => (
              <Card key={label} className="rounded-2xl border-0 shadow-md hover:shadow-lg transition-shadow bg-white/80">
                <CardContent className="p-8 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{value}{suffix}</div>
                  <div className="text-gray-600">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="newsletter-section" className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <UserCheck className="h-12 w-12 text-green-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Stay Updated with Durahub
              </h3>
              <p className="text-gray-600 mb-6">
                Get the latest updates on fresh produce, seasonal offers, and agricultural insights.
              </p>
              <div className="flex gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-xl"
                />
                <Button className="bg-green-600 hover:bg-green-700 rounded-xl">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <img src="/logo.png" alt="Durahub Logo" className="h-14 mb-6 opacity-90" />
              <p className="text-gray-400 text-sm leading-relaxed">
                Connecting farmers and consumers for a sustainable agricultural future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/marketplace" className="hover:text-green-500 transition-colors">Marketplace</Link></li>
                <li><Link to="/community" className="hover:text-green-500 transition-colors">Community</Link></li>
                <li><Link to="/ai-tools" className="hover:text-green-500 transition-colors">AI Tools</Link></li>
                <li>
                  <button onClick={() => document.querySelector('#about-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-green-500 transition-colors text-left">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => document.querySelector('#newsletter-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-green-500 transition-colors text-left">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">For Farmers</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/register?type=seller" className="hover:text-green-500 transition-colors">Sell Produce</Link></li>
                <li><Link to="/ai-tools" className="hover:text-green-500 transition-colors">Farmer Resources</Link></li>
                <li>
                  <button onClick={() => document.querySelector('#newsletter-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-green-500 transition-colors text-left">
                    Support
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <button onClick={() => document.querySelector('#newsletter-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-green-500 transition-colors text-left">
                    Help Center
                  </button>
                </li>
                <li><Link to="/delivery" className="hover:text-green-500 transition-colors">Request Delivery</Link></li>
                <li><Link to="/marketplace" className="hover:text-green-500 transition-colors">Returns</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 mt-12 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Durahub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
