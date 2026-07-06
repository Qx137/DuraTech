import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryBidsPanel } from '@/components/delivery/DeliveryBidsPanel';
import { ArrowLeft, Package, MapPin, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CreditCard } from 'lucide-react';

interface DeliveryDetails {
  id: string;
  tracking_number: string;
  status: string;
  bidding_deadline: string | null;
  selected_bid_id: string | null;
  estimated_price?: number;
  pickup_address: any;
  delivery_address: any;
  distance_km: number | null;
  order: {
    id: string;
    total: number;
    tax: number;
    created_at: string;
    order_items: Array<{
      id: string;
      quantity: number;
      price: number;
      products: {
        name: string;
      }
    }>;
  };
}

const DeliveryBidSelection = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [driversViewing, setDriversViewing] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Simulation: Increment drivers viewing count for demo purposes
    const interval = setInterval(() => {
      setDriversViewing(prev => {
        if (prev >= 12) return prev;
        const inc = Math.floor(Math.random() * 2) + 1;
        return Math.min(prev + inc, 12 + Math.floor(Math.random() * 4));
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (deliveryId) {
      fetchDelivery();
    }
  }, [deliveryId]);

  const fetchDelivery = async () => {
    try {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          id,
          tracking_number,
          status,
          bidding_deadline,
          selected_bid_id,
          estimated_price,
          pickup_address,
          delivery_address,
          distance_km,
          order:orders(
            id, 
            total, 
            tax,
            created_at,
            order_items(
              id,
              quantity,
              price,
              products(name)
            )
          )
        `)
        .eq('id', deliveryId)
        .maybeSingle();

      if (error) throw error;
      setDelivery(data);
    } catch (error) {
      console.error('Error fetching delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBidAccepted = () => {
    fetchDelivery();
    toast({
      title: "Bid Selected",
      description: "You can now proceed to payment to confirm this delivery.",
    });
  };

  const handlePayment = async () => {
    if (!delivery || (!delivery.selected_bid_id && delivery.status !== 'assigned')) return;

    setPaying(true);
    try {
      let bidAmount = delivery.estimated_price || 0;
      
      // Find the accepted bid amount (if there is a real DB selected bid)
      if (delivery.selected_bid_id) {
        const { data: bidData } = await supabase
          .from('delivery_bids')
          .select('bid_amount')
          .eq('id', delivery.selected_bid_id)
          .single();
        if (bidData) bidAmount = bidData.bid_amount;
      }
      
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) throw new Error("Authentication required");

      const subtotal = calculateOrderSummary().subtotal;
      const finalTotal = subtotal + bidAmount + (delivery.order.tax || 0);

      const response = await supabase.functions.invoke('create-contipay-payment', {
        body: {
          orderId: delivery.order.id,
          deliveryId: delivery.id,
          amount: finalTotal,
          email: user.email,
          customerName: user.user_metadata?.full_name || user.email || "Customer",
          returnUrl: window.location.origin + '/payment-success'
        }
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || response.error?.message || 'Failed to create payment');
      }

      window.location.href = response.data.paymentUrl;
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPaying(false);
    }
  };

  const calculateOrderSummary = () => {
    if (!delivery?.order?.order_items) return { subtotal: 0, items: [] };
    const items = delivery.order.order_items;
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { subtotal, items };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Delivery Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The delivery you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isAssigned = delivery.status === 'assigned' || delivery.selected_bid_id;
  const deliveryAddress = delivery.delivery_address as { street?: string; city?: string };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Select Delivery Provider</h1>
            <p className="text-muted-foreground">
              Choose from available bids for your delivery
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-sm font-medium text-primary">
              {driversViewing} drivers viewing this request
            </span>
          </div>
        </div>

        {/* Delivery Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Details
                </CardTitle>
                <CardDescription>
                  Tracking: {delivery.tracking_number}
                </CardDescription>
              </div>
              <Badge variant={isAssigned ? 'default' : 'secondary'}>
                {isAssigned ? 'Driver Assigned' : 'Awaiting Selection'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">
                    {deliveryAddress?.street}, {deliveryAddress?.city}
                  </p>
                </div>
              </div>

              {delivery.distance_km && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Distance</p>
                    <p className="text-sm text-muted-foreground">
                      {delivery.distance_km.toFixed(1)} km
                    </p>
                  </div>
                </div>
              )}
            </div>

            {delivery.bidding_deadline && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Bidding closes: {format(new Date(delivery.bidding_deadline), 'PPp')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items in Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculateOrderSummary().items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.products.name} (x{item.quantity})</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-3 border-t flex justify-between font-semibold">
                <span>Items Subtotal</span>
                <span>${calculateOrderSummary().subtotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message if Assigned */}
        {isAssigned ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold text-primary">
                    Bid Selected Successfully!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    To confirm this driver and start the delivery, please complete the payment.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-4">
                <div className="bg-background border rounded-lg p-5">
                  <div className="space-y-2 mb-4 pb-4 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Goods Subtotal:</span>
                      <span>${calculateOrderSummary().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee:</span>
                      <span className="font-medium text-green-600">
                        ${(delivery.estimated_price || 0).toFixed(2)}
                      </span>
                    </div>
                    {delivery.order.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>${delivery.order.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Grand Total:</span>
                      <span className="text-primary">
                        ${(calculateOrderSummary().subtotal + (delivery.estimated_price || 0) + (delivery.order.tax || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Payment via ContiPay</p>
                        <p className="text-xs text-muted-foreground">Secure consolidated payment</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handlePayment} 
                      disabled={paying}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 font-bold px-8"
                    >
                      {paying ? "Processing..." : `Pay $${(calculateOrderSummary().subtotal + (delivery.estimated_price || 0) + (delivery.order.tax || 0)).toFixed(2)}`}
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/delivery-tracking?orderId=${delivery.order.id}`}>Track Status</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DeliveryBidsPanel
            deliveryId={delivery.id}
            biddingDeadline={delivery.bidding_deadline}
            selectedBidId={delivery.selected_bid_id}
            onBidAccepted={handleBidAccepted}
          />
        )}
      </div>
    </div>
  );
};

export default DeliveryBidSelection;
