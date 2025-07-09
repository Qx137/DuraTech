
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, ShoppingCart, Star, MapPin, Package, Heart, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'buyer' | 'seller';
}

interface BuyerDashboardProps {
  user: User;
}

export const BuyerDashboard = ({ user }: BuyerDashboardProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const recentPurchases = [
    { id: 1, product: "Organic Tomatoes", farmer: "Green Valley Farm", price: 4.99, status: "Delivered" },
    { id: 2, product: "Fresh Apples", farmer: "Sunset Orchards", price: 3.99, status: "In Transit" },
    { id: 3, product: "Organic Spinach", farmer: "Healthy Greens Co", price: 2.99, status: "Processing" },
  ];

  const favoriteProducts = [
    { id: 1, name: "Organic Tomatoes", farmer: "Green Valley Farm", rating: 4.8, image: "🍅" },
    { id: 2, name: "Fresh Apples", farmer: "Sunset Orchards", rating: 4.9, image: "🍎" },
    { id: 3, name: "Farm Fresh Eggs", farmer: "Happy Hen Farm", rating: 4.9, image: "🥚" },
  ];

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">DuraHub</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-green-600 font-medium">
              Dashboard
            </Link>
            <Link to="/marketplace" className="text-gray-700 hover:text-green-600 transition-colors">
              Marketplace
            </Link>
            <Link to="/ai-tools" className="text-gray-700 hover:text-green-600 transition-colors">
              AI Tools
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Cart (0)
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">Discover fresh produce from local farmers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-gray-600 text-sm">Active Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-gray-600 text-sm">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-gray-600 text-sm">Followed Farms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Purchases */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>Your latest orders and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPurchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{purchase.product}</h4>
                      <p className="text-sm text-gray-600">{purchase.farmer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${purchase.price}</p>
                      <Badge variant={purchase.status === 'Delivered' ? 'default' : 'secondary'}>
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">View All Orders</Button>
            </CardContent>
          </Card>

          {/* Favorite Products */}
          <Card>
            <CardHeader>
              <CardTitle>Favorite Products</CardTitle>
              <CardDescription>Products you love from trusted farmers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {favoriteProducts.map((product) => (
                  <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="text-3xl">{product.image}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{product.farmer}</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{product.rating}</span>
                      </div>
                    </div>
                    <Button size="sm">Order Again</Button>
                  </div>
                ))}
              </div>
              <Link to="/marketplace">
                <Button className="w-full mt-4" variant="outline">Browse Marketplace</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
