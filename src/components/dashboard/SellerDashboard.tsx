
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Package, DollarSign, Users, TrendingUp, Plus, Edit, Eye, LogOut, MessageSquare, BarChart3, Settings, Database, Upload, FileText, Building, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NotchHeader from "@/components/layout/NotchHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LocationMap from "@/components/checkout/LocationMap";
import { OrderManagement } from "@/components/orders/OrderManagement";
import { KycVerification } from "./KycVerification";
import { formatCurrency } from "@/lib/pricing";

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'buyer' | 'seller' | 'driver';
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
    image: '',
    pickup_latitude: null as number | null,
    pickup_longitude: null as number | null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const queryClient = useQueryClient();

  const productsQueryKey = ['sellerProducts', user.id];
  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: productsQueryKey });

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: productsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['sellerRecentOrders', user.id],
    queryFn: async () => {
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

      return data?.map(item => ({
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
    },
  });

  const { data: stats = { monthlyRevenue: 0, productsListed: 0, totalCustomers: 0, ordersThisMonth: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['sellerStats', user.id],
    queryFn: async () => {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayOfMonthISO = firstDayOfMonth.toISOString();

      const [
        { data: monthlyOrdersData, error: monthlyError },
        { count: productsCount, error: productsError },
        { data: customerData, error: customerError },
      ] = await Promise.all([
        // Monthly revenue from this month's orders
        supabase
          .from('order_items')
          .select(`
            price,
            quantity,
            orders!inner (
              created_at
            ),
            products!inner (
              seller_id
            )
          `)
          .eq('products.seller_id', user.id)
          .gte('orders.created_at', firstDayOfMonthISO),

        // Products listed by this seller
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id),

        // Unique customers (users who bought from this seller)
        supabase
          .from('order_items')
          .select(`
            orders!inner (
              user_id
            ),
            products!inner (
              seller_id
            )
          `)
          .eq('products.seller_id', user.id),
      ]);

      if (monthlyError) throw monthlyError;
      if (productsError) throw productsError;
      if (customerError) throw customerError;

      const monthlyRevenue = monthlyOrdersData?.reduce((sum, item) =>
        sum + (Number(item.price) * item.quantity), 0) || 0;

      const uniqueCustomers = new Set(customerData?.map(item => item.orders.user_id)).size;

      // Count orders this month
      const ordersThisMonth = monthlyOrdersData?.length || 0;

      return {
        monthlyRevenue,
        productsListed: productsCount || 0,
        totalCustomers: uniqueCustomers,
        ordersThisMonth
      };
    },
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['sellerCustomers', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          orders!inner (
            user_id,
            profiles!inner (
              name,
              email
            )
          ),
          price,
          quantity,
          products!inner (
            seller_id
          )
        `)
        .eq('products.seller_id', user.id);

      if (error) throw error;

      // Group by customer and calculate totals
      const customerMap = new Map();
      data?.forEach(item => {
        const userId = item.orders.user_id;
        const customer = item.orders.profiles;
        const orderValue = Number(item.price) * item.quantity;

        if (customerMap.has(userId)) {
          const existing = customerMap.get(userId);
          existing.totalOrders += 1;
          existing.totalSpent += orderValue;
        } else {
          customerMap.set(userId, {
            id: userId,
            name: customer.name,
            email: customer.email,
            totalOrders: 1,
            totalSpent: orderValue
          });
        }
      });

      return Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10); // Show top 10 customers
    },
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

  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    setNewProduct({
      ...newProduct,
      pickup_latitude: location.lat,
      pickup_longitude: location.lng,
      location: location.address
    });
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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
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
      const price = parseFloat(newProduct.price);
      const stock = parseInt(newProduct.stock);

      if (isNaN(price) || price < 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price.",
          variant: "destructive"
        });
        return;
      }

      if (isNaN(stock) || stock < 0) {
        toast({
          title: "Invalid Stock",
          description: "Please enter a valid stock quantity.",
          variant: "destructive"
        });
        return;
      }

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
              price: price,
              unit: newProduct.unit,
              category: newProduct.category,
              stock_quantity: stock,
              description: newProduct.description,
              location: newProduct.location,
              organic: newProduct.organic,
              image: mediaUrl,
              pickup_latitude: newProduct.pickup_latitude,
              pickup_longitude: newProduct.pickup_longitude
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
          image: '',
          pickup_latitude: null,
          pickup_longitude: null
        });
        setSelectedFile(null);
        setShowAddProductForm(false);
        invalidateProducts(); // Refresh the products list
      } catch (error: any) {
        console.error('Error adding product:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to add product. Please try again.",
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

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit,
      category: product.category,
      stock: product.stock_quantity.toString(),
      description: product.description || '',
      location: product.location || '',
      organic: product.organic,
      image: product.image || '',
      pickup_latitude: product.pickup_latitude || null,
      pickup_longitude: product.pickup_longitude || null
    });
    setSelectedFile(null);
    setShowEditForm(true);
  };

  const handleUpdateProduct = async () => {
    if (newProduct.name && newProduct.price && newProduct.stock && newProduct.unit && newProduct.category && editingProduct) {
      const price = parseFloat(newProduct.price);
      const stock = parseInt(newProduct.stock);

      if (isNaN(price) || price < 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price.",
          variant: "destructive"
        });
        return;
      }

      if (isNaN(stock) || stock < 0) {
        toast({
          title: "Invalid Stock",
          description: "Please enter a valid stock quantity.",
          variant: "destructive"
        });
        return;
      }

      setUploading(true);
      try {
        let mediaUrl = newProduct.image;

        // Upload new file if selected
        if (selectedFile) {
          mediaUrl = await uploadFile(selectedFile);
        }

        const { error } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            price: price,
            unit: newProduct.unit,
            category: newProduct.category,
            stock_quantity: stock,
            description: newProduct.description,
            location: newProduct.location,
            organic: newProduct.organic,
            image: mediaUrl,
            pickup_latitude: newProduct.pickup_latitude,
            pickup_longitude: newProduct.pickup_longitude
          })
          .eq('id', editingProduct.id)
          .eq('seller_id', user.id);

        if (error) throw error;

        toast({
          title: "Product Updated Successfully!",
          description: `${newProduct.name} has been updated.`,
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
          image: '',
          pickup_latitude: null,
          pickup_longitude: null
        });
        setSelectedFile(null);
        setShowEditForm(false);
        setEditingProduct(null);
        invalidateProducts(); // Refresh the products list
      } catch (error: any) {
        console.error('Error updating product:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update product. Please try again.",
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

  const handleDeleteProduct = async (product: any) => {
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id)
          .eq('seller_id', user.id);

        if (error) throw error;

        toast({
          title: "Product Deleted",
          description: `${product.name} has been removed from your inventory.`,
        });

        invalidateProducts(); // Refresh the products list
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Error",
          description: "Failed to delete product. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleViewProduct = (productId: number) => {
    toast({
      title: "View Product",
      description: `Viewing product details for ID: ${productId}`,
    });
  };

  const renderAnalytics = () => {
    const avgOrderValue = stats.ordersThisMonth > 0 ? (stats.monthlyRevenue / stats.ordersThisMonth) : 0;

    return (
      <div className="space-y-6">
        {statsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Orders This Month</p>
                      <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
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
                      <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                    </div>
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Products Listed</span>
                    <span className="font-medium">{stats.productsListed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Revenue</span>
                    <span className="font-medium text-green-600">{formatCurrency(stats.monthlyRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer Base</span>
                    <span className="font-medium">{stats.totalCustomers} customers</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Orders This Month</span>
                    <span className="font-medium">{stats.ordersThisMonth}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Current month analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Revenue Progress</span>
                        <span>{formatCurrency(stats.monthlyRevenue)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min((stats.monthlyRevenue / 1000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Orders Progress</span>
                        <span>{stats.ordersThisMonth}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((stats.ordersThisMonth / 50) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>Manage your customer relationships and communications</CardDescription>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No customers yet</p>
              <p className="text-sm text-gray-500 mt-2">Customers will appear here after they place orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{customer.name}</h4>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-medium">{formatCurrency(customer.totalSpent)}</p>
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
          )}
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
                      <p className="text-sm text-gray-600">Price: {formatCurrency(Number(product.price))} per {product.unit}</p>
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
                        <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)} title="Edit Product">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(product)} className="hover:bg-red-50 hover:text-red-600" title="Delete Product">
                          <Trash2 className="h-3 w-3" />
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
      <OrderManagement sellerId={user.id} />
    </div>
  );

  return (
    <>
      <NotchHeader
        navItems={[
          { label: "Dashboard", to: "/dashboard", active: true },
          { label: "Marketplace", to: "/marketplace" },
          { label: "Community", to: "/community" },
          { label: "DuraGo", to: "https://durago.co.zw" },
          { label: "AI Tools", to: "/ai-tools" },
        ]}
        actions={
          <>
            <Button onClick={handleAddProduct} size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </>
        }
      />

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
                  <label className="block text-sm font-medium mb-2">Pickup Location*</label>
                  <div className="space-y-2">
                    <LocationMap
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={
                        newProduct.pickup_latitude && newProduct.pickup_longitude
                          ? {
                            lat: newProduct.pickup_latitude,
                            lng: newProduct.pickup_longitude,
                            address: newProduct.location
                          }
                          : null
                      }
                    />
                    <Input
                      value={newProduct.location}
                      onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                      placeholder="Selected location will appear here"
                      readOnly
                      className="text-sm text-gray-600"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Product Media (Image or Video)</label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/mov"
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

        {/* Edit Product Modal */}
        {showEditForm && editingProduct && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Product</CardTitle>
              <CardDescription>Update your product information</CardDescription>
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
                  <label className="block text-sm font-medium mb-2">Pickup Location*</label>
                  <div className="space-y-2">
                    <LocationMap
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={
                        newProduct.pickup_latitude && newProduct.pickup_longitude
                          ? {
                            lat: newProduct.pickup_latitude,
                            lng: newProduct.pickup_longitude,
                            address: newProduct.location
                          }
                          : null
                      }
                    />
                    <Input
                      value={newProduct.location}
                      onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                      placeholder="Selected location will appear here"
                      readOnly
                      className="text-sm text-gray-600"
                    />
                  </div>
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
                  id="organic-edit"
                  checked={newProduct.organic}
                  onChange={(e) => setNewProduct({ ...newProduct, organic: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="organic-edit" className="text-sm font-medium">Organic Product</label>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpdateProduct}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingProduct(null);
                    setSelectedFile(null);
                  }}
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
              className={`px-4 py-2 border-b-2 transition-colors ${activeSection === 'overview'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-green-600'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className={`px-4 py-2 border-b-2 transition-colors ${activeSection === 'analytics'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-green-600'
                }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveSection('customers')}
              className={`px-4 py-2 border-b-2 transition-colors ${activeSection === 'customers'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-green-600'
                }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveSection('inventory')}
              className={`px-4 py-2 border-b-2 transition-colors ${activeSection === 'inventory'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-green-600'
                }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveSection('orders')}
              className={`px-4 py-2 border-b-2 transition-colors ${activeSection === 'orders'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-green-600'
                }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveSection('verification')}
              className={`px-4 py-2 border-b-2 transition-colors ${activeSection === 'verification'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-green-600'
                }`}
            >
              Verification
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
                      {statsLoading ? (
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                          <p className="text-gray-600 text-sm">Monthly Revenue</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      {statsLoading ? (
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats.productsListed}</p>
                          <p className="text-gray-600 text-sm">Products Listed</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      {statsLoading ? (
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                          <p className="text-gray-600 text-sm">Total Customers</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                    <div>
                      {statsLoading ? (
                        <div className="animate-pulse">
                          <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stats.ordersThisMonth}</p>
                          <p className="text-gray-600 text-sm">Orders This Month</p>
                        </>
                      )}
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
                            <p className="text-sm text-gray-600">{formatCurrency(Number(product.price))} per {product.unit}</p>
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
                            <p className="font-medium">{formatCurrency(Number(order.total))}</p>
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
        {activeSection === 'verification' && <KycVerification />}
      </div>
    </>
  );
};
