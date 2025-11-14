
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, ShoppingCart, Star, MapPin, Package, Heart, User, LogOut, MessageSquare, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { OrderCancellation } from "@/components/orders/OrderCancellation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    favorites: 0,
    followedFarms: 0
  });
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total orders
      const { data: totalOrdersData } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      // Fetch active orders (orders that are not delivered)
      const { data: activeOrdersData } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .neq('status', 'delivered');

      // Fetch cart items count
      const { data: cartData } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);

      const totalCartItems = cartData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      // Fetch recent orders with product details
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          order_items (
            quantity,
            price,
            products (
              name,
              seller_id,
              profiles!products_seller_id_fkey (
                business_name,
                name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch all orders for the orders tab
      const { data: allOrdersData } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          payment_method,
          payment_status,
          order_items (
            quantity,
            price,
            products (
              name,
              seller_id,
              profiles!products_seller_id_fkey (
                business_name,
                name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Transform recent orders data
      const transformedRecentPurchases = recentOrdersData?.map(order => ({
        id: order.id,
        product: order.order_items?.[0]?.products?.name || 'Unknown Product',
        farmer: order.order_items?.[0]?.products?.profiles?.business_name || 
               order.order_items?.[0]?.products?.profiles?.name || 'Unknown Farmer',
        price: order.total,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1)
      })) || [];

      // Transform all orders data
      const transformedAllOrders = allOrdersData?.map(order => ({
        id: order.id,
        products: order.order_items?.map(item => ({
          name: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price
        })) || [],
        farmer: order.order_items?.[0]?.products?.profiles?.business_name || 
               order.order_items?.[0]?.products?.profiles?.name || 'Unknown Farmer',
        total: order.total,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        paymentStatus: order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1),
        paymentMethod: order.payment_method,
        createdAt: new Date(order.created_at).toLocaleDateString()
      })) || [];

      // For favorites and followed farms, we'll use placeholder data for now
      // since these features would require additional tables
      setStats({
        totalOrders: totalOrdersData?.length || 0,
        activeOrders: activeOrdersData?.length || 0,
        favorites: 0, // Placeholder
        followedFarms: 0 // Placeholder
      });

      setRecentPurchases(transformedRecentPurchases);
      setAllOrders(transformedAllOrders);
      setCartCount(totalCartItems);
      
      // Set placeholder favorite products for now
      setFavoriteProducts([]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
  };

  const handleOrderAgain = (productName: string) => {
    toast({
      title: "Order Placed",
      description: `Added ${productName} to your cart!`,
    });
  };

  const handleEraseOrderHistory = async () => {
    try {
      // Delete all order items first (foreign key constraint)
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', allOrders.map(order => order.id));

      if (orderItemsError) throw orderItemsError;

      // Delete all orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('user_id', user.id);

      if (ordersError) throw ordersError;

      toast({
        title: "Order history cleared",
        description: "All your orders have been permanently deleted.",
      });

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting order history:', error);
      toast({
        title: "Error",
        description: "Failed to delete order history. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/a2db2940-ded3-4e46-9144-25350c853d8d.png" 
              alt="Durahub Logo" 
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
            <Link to="/cart">
              <Button variant="outline" size="sm">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Cart ({cartCount})
              </Button>
            </Link>
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
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
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
                  <p className="text-2xl font-bold">{stats.activeOrders}</p>
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
                  <p className="text-2xl font-bold">{stats.favorites}</p>
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
                  <p className="text-2xl font-bold">{stats.followedFarms}</p>
                  <p className="text-gray-600 text-sm">Followed Farms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Purchases */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Purchases</CardTitle>
                  <CardDescription>Your latest orders and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPurchases.length > 0 ? (
                      recentPurchases.map((purchase) => (
                        <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{purchase.product}</h4>
                            <p className="text-sm text-gray-600">{purchase.farmer}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${Number(purchase.price).toFixed(2)}</p>
                            <Badge variant={purchase.status === 'Delivered' ? 'default' : 'secondary'}>
                              {purchase.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent purchases yet</p>
                        <p className="text-sm">Start shopping to see your orders here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Browse and connect with local farmers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <Link to="/marketplace">
                      <Button className="w-full justify-start" variant="outline">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Browse Marketplace
                      </Button>
                    </Link>
                    <Link to="/community">
                      <Button className="w-full justify-start" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Join Community
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>Complete history of your orders</CardDescription>
                  </div>
                  {allOrders.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Erase History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all your order history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleEraseOrderHistory}>
                            Delete All Orders
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allOrders.length > 0 ? (
                    allOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Order #{order.id.slice(-8)}</h4>
                            <p className="text-sm text-gray-600">{order.createdAt}</p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                              <div className="flex gap-2">
                                <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
                                <Badge variant={order.paymentStatus === 'Completed' ? 'default' : 'destructive'}>
                                  {order.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                            <OrderCancellation 
                              orderId={order.id}
                              currentStatus={order.status.toLowerCase()}
                              onCancelled={fetchDashboardData}
                            />
                          </div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <p className="text-sm text-gray-600 mb-1">From: {order.farmer}</p>
                          <p className="text-sm text-gray-600">Payment: {order.paymentMethod}</p>
                          <div className="mt-2">
                            <p className="text-sm font-medium">Items:</p>
                            {order.products.map((product, index) => (
                              <p key={index} className="text-sm text-gray-600">
                                {product.quantity}x {product.name} - ${Number(product.price).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No orders found</p>
                      <p className="text-sm">Start shopping to see your orders here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Products</CardTitle>
                <CardDescription>Products you love from trusted farmers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {favoriteProducts.length > 0 ? (
                    favoriteProducts.map((product) => (
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
                        <Button 
                          size="sm"
                          onClick={() => handleOrderAgain(product.name)}
                        >
                          Order Again
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No favorite products yet</p>
                      <p className="text-sm">Start favoriting products to see them here</p>
                    </div>
                  )}
                </div>
                <Link to="/marketplace">
                  <Button className="w-full mt-4" variant="outline">Browse Marketplace</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </>
  );
};
