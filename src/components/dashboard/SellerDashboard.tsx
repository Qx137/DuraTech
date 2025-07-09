
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, DollarSign, Users, TrendingUp, Plus, Edit, Eye, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'buyer' | 'seller';
  businessName?: string;
  description?: string;
}

interface SellerDashboardProps {
  user: User;
}

export const SellerDashboard = ({ user }: SellerDashboardProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const myProducts = [
    { id: 1, name: "Organic Tomatoes", price: 4.99, stock: 50, sold: 25, status: "Active" },
    { id: 2, name: "Fresh Lettuce", price: 2.99, stock: 30, sold: 15, status: "Active" },
    { id: 3, name: "Sweet Corn", price: 1.99, stock: 0, sold: 40, status: "Out of Stock" },
  ];

  const recentOrders = [
    { id: 1, product: "Organic Tomatoes", buyer: "John Smith", quantity: 5, total: 24.95, status: "Processing" },
    { id: 2, product: "Fresh Lettuce", buyer: "Sarah Johnson", quantity: 3, total: 8.97, status: "Shipped" },
    { id: 3, product: "Sweet Corn", buyer: "Mike Davis", quantity: 10, total: 19.90, status: "Delivered" },
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
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user.businessName || user.name}!</h2>
          <p className="text-gray-600">Manage your farm business and reach more customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">$2,450</p>
                  <p className="text-gray-600 text-sm">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-gray-600 text-sm">Products Listed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-gray-600 text-sm">Total Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-gray-600 text-sm">Orders This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Products */}
          <Card>
            <CardHeader>
              <CardTitle>My Products</CardTitle>
              <CardDescription>Manage your product listings and inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">Stock: {product.stock} | Sold: {product.sold}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={product.status === 'Active' ? 'default' : 'destructive'}>
                        {product.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add New Product
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{order.product}</h4>
                      <p className="text-sm text-gray-600">{order.buyer} • Qty: {order.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total}</p>
                      <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" variant="outline">View All Orders</Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Seller Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Sales Analytics</h3>
              <p className="text-gray-600 text-sm">Track your sales performance and trends</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Customer Management</h3>
              <p className="text-gray-600 text-sm">Manage customer relationships and feedback</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Inventory Management</h3>
              <p className="text-gray-600 text-sm">Track stock levels and manage inventory</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
