import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeliveryBidsPanel } from '@/components/delivery/DeliveryBidsPanel';
import { ArrowLeft, Package, MapPin, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryDetails {
  id: string;
  tracking_number: string;
  status: string;
  bidding_deadline: string | null;
  selected_bid_id: string | null;
  pickup_address: any;
  delivery_address: any;
  distance_km: number | null;
  order: {
    id: string;
    total: number;
    created_at: string;
  };
}

const DeliveryBidSelection = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
          pickup_address,
          delivery_address,
          distance_km,
          order:orders(id, total, created_at)
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

        {/* Success Message if Assigned */}
        {isAssigned && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    Driver Assigned Successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your delivery is now being processed. You can track it from your dashboard.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button asChild>
                  <Link to={`/delivery/${delivery.id}`}>Track Delivery</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bids Panel */}
        <DeliveryBidsPanel
          deliveryId={delivery.id}
          biddingDeadline={delivery.bidding_deadline}
          selectedBidId={delivery.selected_bid_id}
          onBidAccepted={handleBidAccepted}
        />
      </div>
    </div>
  );
};

export default DeliveryBidSelection;
