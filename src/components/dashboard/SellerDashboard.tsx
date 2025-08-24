
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Package, DollarSign, Users, TrendingUp, Plus, Edit, Eye, LogOut, MessageSquare, BarChart3, Settings, Database, Upload, FileText, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    unit: '',
    category: '',
    stock: '',
    description: '',
    location: '',
    organic: false,
    image: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

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

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('product-media')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-media')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type (images and videos)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image (JPEG, PNG, WebP) or video (MP4, WebM, MOV)",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 50MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSaveProduct = async () => {
    if (newProduct.name && newProduct.price && newProduct.stock && newProduct.unit && newProduct.category) {
      setUploading(true);
      try {
        let mediaUrl = newProduct.image || 'https://images.unsplash.com/photo-1546470427-227e09b17322?w=400&h=300&fit=crop';
        
        // Upload file if selected
        if (selectedFile) {
          mediaUrl = await uploadFile(selectedFile);
        }

        const { error } = await supabase
          .from('products')
          .insert([
            {
              seller_id: user.id,
              name: newProduct.name,
              price: parseFloat(newProduct.price),
              unit: newProduct.unit,
              category: newProduct.category,
              stock_quantity: parseInt(newProduct.stock),
              description: newProduct.description,
              location: newProduct.location,
              organic: newProduct.organic,
              image: mediaUrl
            }
          ]);

        if (error) throw error;

        toast({
          title: "Product Added Successfully!",
          description: `${newProduct.name} has been added to your inventory.`,
        });
        setNewProduct({ 
          name: '', 
          price: '', 
          unit: '', 
          category: '', 
          stock: '', 
          description: '', 
          location: '', 
          organic: false, 
          image: '' 
        });
        setSelectedFile(null);
        setShowAddProductForm(false);
        fetchProducts(); // Refresh the products list
      } catch (error) {
        console.error('Error adding product:', error);
        toast({
          title: "Error",
          description: "Failed to add product. Please try again.",
          variant: "destructive"
        });
      } finally {
        setUploading(false);
      }
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

  useEffect(() => {
    fetchProducts();
    fetchRecentOrders();
  }, [user.id]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner (
            id,
            user_id,
            total,
            status,
            created_at,
            profiles!inner (
              name,
              email
            )
          ),
          products!inner (
            name,
            seller_id
          )
        `)
        .eq('products.seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedOrders = data?.map(item => ({
        id: item.id,
        product: item.products.name,
        buyer: item.orders.profiles.name,
        quantity: item.quantity,
        total: item.price * item.quantity,
        status: item.orders.status === 'pending' ? 'Processing' : 
                item.orders.status === 'completed' ? 'Delivered' : 
                item.orders.status === 'shipped' ? 'Shipped' : 'Processing',
        order_id: item.orders.id,
        created_at: item.orders.created_at
      })) || [];

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      toast({
        title: "Error",
        description: "Failed to load recent orders.",
        variant: "destructive"
      });
    } finally {
      setOrdersLoading(false);
    }
  };

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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No products yet. Add your first product to get started!</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">Price: ${Number(product.price).toFixed(2)} per {product.unit}</p>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      {product.organic && <Badge variant="secondary" className="mt-1">Organic</Badge>}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">Stock: {product.stock_quantity}</p>
                        <p className="text-sm text-gray-600">Rating: {Number(product.rating).toFixed(1)}</p>
                      </div>
                      <Badge variant={product.stock_quantity > 0 ? 'default' : 'destructive'}>
                        {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
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
                ))
              )}
            </div>
          )}
          <Button className="w-full mt-4" onClick={() => setShowAddProductForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Complete history of orders for your products</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-400 mt-2">Orders will appear here when customers purchase your products</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium">{order.product}</h4>
                    <p className="text-sm text-gray-600">Customer: {order.buyer}</p>
                    <p className="text-sm text-gray-500">Quantity: {order.quantity}</p>
                    <p className="text-xs text-gray-400">
                      Ordered on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">${Number(order.total).toFixed(2)}</p>
                    <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="mt-1">
                      {order.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">Order #{order.order_id.slice(0, 8)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <label className="block text-sm font-medium mb-2">Product Name*</label>
                  <Input 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Organic Tomatoes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)*</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="4.99"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Unit*</label>
                  <Input 
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="e.g. lb, kg, dozen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category*</label>
                  <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="fruits">Fruits</SelectItem>
                      <SelectItem value="grains">Grains</SelectItem>
                      <SelectItem value="herbs">Herbs</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                      <SelectItem value="meat">Meat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stock Quantity*</label>
                  <Input 
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input 
                    value={newProduct.location}
                    onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Product Media (Image or Video)</label>
                <div className="space-y-2">
                  <Input 
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/mov"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <Upload className="h-4 w-4" />
                      <span>Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload images (JPEG, PNG, WebP) or videos (MP4, WebM, MOV). Max size: 50MB
                  </p>
                  
                  {/* Alternative URL input */}
                  <div className="border-t pt-2 mt-2">
                    <label className="block text-xs font-medium mb-1 text-gray-500">Or provide image URL</label>
                    <Input 
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Describe your product..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="organic"
                  checked={newProduct.organic}
                  onChange={(e) => setNewProduct({ ...newProduct, organic: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="organic" className="text-sm font-medium">Organic Product</label>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSaveProduct} 
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Save Product
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddProductForm(false)}
                  disabled={uploading}
                >
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
            <button
              onClick={() => setActiveSection('orders')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeSection === 'orders' 
                  ? 'border-green-600 text-green-600' 
                  : 'border-transparent text-gray-600 hover:text-green-600'
              }`}
            >
              Orders
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
                  <CardDescription>Recent products you've listed</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No products yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products.slice(0, 3).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-600">${Number(product.price).toFixed(2)} per {product.unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Stock: {product.stock_quantity}</p>
                            <Badge variant={product.stock_quantity > 0 ? 'default' : 'destructive'} className="text-xs">
                              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full mt-4" onClick={() => setActiveSection('inventory')}>
                    View All Products
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
                  {ordersLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading orders...</p>
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No orders yet</p>
                      <p className="text-xs text-gray-400 mt-1">Orders will appear here when customers purchase your products</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{order.product}</h4>
                            <p className="text-sm text-gray-600">{order.buyer} • Qty: {order.quantity}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                            <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => setActiveSection('orders')}
                  >
                    View All Orders
                  </Button>
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
        {activeSection === 'orders' && renderOrders()}
      </div>
    </>
  );
};
