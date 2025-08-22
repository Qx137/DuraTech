
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Leaf, Package, DollarSign, Users, TrendingUp, Plus, Edit, Eye, LogOut, MessageSquare, BarChart3, Settings, Database, Upload, FileText, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    description: ''
  });

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
  };

  const handleAddProduct = () => {
    setShowAddProductForm(true);
  };

  const handleSaveProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.stock) {
      toast({
        title: "Product Added Successfully!",
        description: `${newProduct.name} has been added to your inventory.`,
      });
      setNewProduct({ name: '', price: '', stock: '', description: '' });
      setShowAddProductForm(false);
    } else {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (productId: number) => {
    toast({
      title: "Edit Product",
      description: `Opening edit form for product ID: ${productId}`,
    });
  };

  const handleViewProduct = (productId: number) => {
    toast({
      title: "View Product",
      description: `Viewing product details for ID: ${productId}`,
    });
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

  const customers = [
    { id: 1, name: "John Smith", email: "john@example.com", totalOrders: 15, totalSpent: 450.00 },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", totalOrders: 8, totalSpent: 220.00 },
    { id: 3, name: "Mike Davis", email: "mike@example.com", totalOrders: 12, totalSpent: 380.00 },
  ];

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">$12,450</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Orders</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Order Value</p>
                <p className="text-2xl font-bold">$140</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Growth Rate</p>
                <p className="text-2xl font-bold">+23%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sales Performance</CardTitle>
          <CardDescription>Monthly sales trends and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Interactive sales chart would be rendered here</p>
              <p className="text-sm text-gray-500 mt-2">Revenue increased by 23% this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>Manage your customer relationships and communications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{customer.name}</h4>
                  <p className="text-sm text-gray-600">{customer.email}</p>
                </div>
                <div className="text-right mr-4">
                  <p className="font-medium">${customer.totalSpent}</p>
                  <p className="text-sm text-gray-600">{customer.totalOrders} orders</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => toast({ title: "Email Sent", description: `Message sent to ${customer.name}` })}>
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast({ title: "Customer Details", description: `Viewing ${customer.name}'s profile` })}>
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Track and manage your product inventory levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">Price: ${product.price}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">Stock: {product.stock}</p>
                    <p className="text-sm text-gray-600">Sold: {product.sold}</p>
                  </div>
                  <Badge variant={product.status === 'Active' ? 'default' : 'destructive'}>
                    {product.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditProduct(product.id)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast({ title: "Stock Updated", description: `Restocking ${product.name}` })}>
                      <Package className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4" onClick={() => setShowAddProductForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/a2db2940-ded3-4e46-9144-25350c853d8d.png" 
              alt="DuraTech Logo" 
              className="h-12"
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-green-600 font-medium">
              Dashboard
            </Link>
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
            <Button onClick={handleAddProduct} size="sm" className="bg-green-600 hover:bg-green-700">
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

        {/* Add Product Modal */}
        {showAddProductForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
              <CardDescription>Add a new product to your inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name</label>
                  <Input 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Organic Tomatoes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)</label>
                  <Input 
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="4.99"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                <Input 
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Describe your product..."
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveProduct} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Save Product
                </Button>
                <Button variant="outline" onClick={() => setShowAddProductForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeSection === 'overview' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-600 hover:text-green-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeSection === 'analytics' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-600 hover:text-green-600'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveSection('customers')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeSection === 'customers' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-600 hover:text-green-600'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveSection('inventory')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeSection === 'inventory' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-600 hover:text-green-600'
              }`}
            >
              Inventory
            </button>
          </div>
        </div>

        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditProduct(product.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewProduct(product.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={handleAddProduct}
                  >
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
            <div className="grid md:grid-cols-4 gap-6 mt-8">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('analytics')}>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Sales Analytics</h3>
                  <p className="text-gray-600 text-sm">Track your sales performance and trends</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('customers')}>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Customer Management</h3>
                  <p className="text-gray-600 text-sm">Manage customer relationships and feedback</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveSection('inventory')}>
                <CardContent className="p-6 text-center">
                  <Database className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Inventory Management</h3>
                  <p className="text-gray-600 text-sm">Track stock levels and manage inventory</p>
                </CardContent>
              </Card>

              <Link to="/community">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Community</h3>
                    <p className="text-gray-600 text-sm">Connect with other farmers and buyers</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}

        {activeSection === 'analytics' && renderAnalytics()}
        {activeSection === 'customers' && renderCustomers()}
        {activeSection === 'inventory' && renderInventory()}
      </div>
    </>
  );
};
