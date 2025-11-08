import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, Truck, CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface Order {
  id: string;
  user_id: string;
  total: number;
  tax: number;
  status: string;
  payment_status: string;
  payment_method: string;
  delivery_address: any;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    product_id: string;
  }>;
}

interface OrderManagementProps {
  sellerId: string;
}

export const OrderManagement = ({ sellerId }: OrderManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, [sellerId, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          products!inner (
            id,
            name,
            seller_id
          ),
          orders!inner (
            id,
            user_id,
            total,
            tax,
            status,
            payment_status,
            payment_method,
            delivery_address,
            created_at,
            profiles!inner (
              name,
              email
            )
          )
        `)
        .eq('products.seller_id', sellerId)
        .order('created_at', { ascending: false, foreignTable: 'orders' });

      if (statusFilter !== 'all') {
        query = query.eq('orders.status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by order
      const ordersMap = new Map<string, Order>();
      
      data?.forEach((item: any) => {
        const orderId = item.orders.id;
        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, {
            id: orderId,
            user_id: item.orders.user_id,
            total: item.orders.total,
            tax: item.orders.tax,
            status: item.orders.status,
            payment_status: item.orders.payment_status,
            payment_method: item.orders.payment_method,
            delivery_address: item.orders.delivery_address,
            created_at: item.orders.created_at,
            buyer_name: item.orders.profiles.name,
            buyer_email: item.orders.profiles.email,
            items: []
          });
        }
        
        ordersMap.get(orderId)?.items.push({
          id: item.id,
          product_name: item.products.name,
          quantity: item.quantity,
          price: item.price,
          product_id: item.products.id
        });
      });

      setOrders(Array.from(ordersMap.values()));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrders(prev => new Set(prev).add(orderId));
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'processing':
        return 'secondary';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleEraseOrderHistory = async () => {
    try {
      // Get all order IDs for the seller's products
      const orderIds = orders.map(order => order.id);
      
      if (orderIds.length === 0) return;

      // Delete order items for these orders
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (orderItemsError) throw orderItemsError;

      // Delete the orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      toast.success("Order history cleared successfully");
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order history:', error);
      toast.error("Failed to delete order history. Please try again.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Order Management</h3>
          <p className="text-sm text-muted-foreground">Manage and track your customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {orders.length > 0 && (
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
                    This action cannot be undone. This will permanently delete all order history for your products.
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
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(-8).toUpperCase()}</CardTitle>
                    <CardDescription>
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(order.status)} className="gap-1">
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {order.buyer_name}</p>
                      <p><span className="text-muted-foreground">Email:</span> {order.buyer_email}</p>
                      <p><span className="text-muted-foreground">Payment:</span> {order.payment_method}</p>
                      <Badge variant={order.payment_status === 'completed' ? 'default' : 'destructive'}>
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Delivery Address</h4>
                    <p className="text-sm text-muted-foreground">
                      {order.delivery_address?.address || 'No address provided'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          <span className="text-muted-foreground"> x {item.quantity}</span>
                        </div>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t font-semibold">
                    <span>Total:</span>
                    <span className="text-lg">${order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Update Status:</span>
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                    disabled={updatingOrders.has(order.id)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingOrders.has(order.id) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
