import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Clock, Truck, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Must match the orders.status CHECK constraint in the database.
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Statuses a seller is allowed to move an order into (mirrors the
// "Sellers can update order status for their products" RLS policy).
const SELLER_STATUS_OPTIONS = ["preparing", "ready_for_delivery", "out_for_delivery", "delivered", "cancelled"];

// Source statuses a seller is allowed to edit from (mirrors the same policy's USING clause).
const SELLER_EDITABLE_STATUSES = ["confirmed", "preparing", "ready_for_delivery", "out_for_delivery"];

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
      case 'confirmed':
      case 'preparing':
        return <RefreshCw className="h-4 w-4" />;
      case 'ready_for_delivery':
      case 'out_for_delivery':
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
      case 'confirmed':
      case 'preparing':
      case 'ready_for_delivery':
      case 'out_for_delivery':
        return 'secondary';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // REMOVED: Seller order deletion feature
  // Sellers should NOT delete orders as they may contain items from multiple sellers
  // Only buyers can delete their own complete order history

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
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    {STATUS_LABELS[order.status] || order.status}
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
                  {SELLER_EDITABLE_STATUSES.includes(order.status) ? (
                    <>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                        disabled={updatingOrders.has(order.id)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={order.status}>{STATUS_LABELS[order.status]}</SelectItem>
                          {SELLER_STATUS_OPTIONS.filter((value) => value !== order.status).map((value) => (
                            <SelectItem key={value} value={value}>{STATUS_LABELS[value]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {updatingOrders.has(order.id) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {order.status === 'pending' ? 'Awaiting payment' : 'No further action needed'}
                    </span>
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
