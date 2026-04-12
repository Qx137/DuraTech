import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeliveryBidCard } from './DeliveryBidCard';
import { Clock, Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';

interface DeliveryBidsPanelProps {
  deliveryId: string;
  biddingDeadline?: string | null;
  selectedBidId?: string | null;
  onBidAccepted?: () => void;
}

export const DeliveryBidsPanel = ({ 
  deliveryId, 
  biddingDeadline,
  selectedBidId,
  onBidAccepted 
}: DeliveryBidsPanelProps) => {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showBids, setShowBids] = useState(false);

  useEffect(() => {
    // Simulation: Wait 2 seconds before showing the bids to the user
    const timer = setTimeout(() => setShowBids(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchBids();

    // Subscribe to real-time bid updates
    const channel = supabase
      .channel(`delivery-bids-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_bids',
          filter: `delivery_id=eq.${deliveryId}`
        },
        () => {
          fetchBids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  useEffect(() => {
    if (!biddingDeadline) return;

    const updateTimeLeft = () => {
      const deadline = new Date(biddingDeadline);
      const now = new Date();
      const diff = differenceInMinutes(deadline, now);
      setTimeLeft(diff > 0 ? diff : 0);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [biddingDeadline]);

  const fetchBids = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_bids')
        .select(`
          *,
          driver:drivers(
            id,
            rating,
            vehicle_type,
            profiles:user_id(name)
          ),
          company:delivery_companies(
            id,
            name,
            rating,
            logo_url
          )
        `)
        .eq('delivery_id', deliveryId)
        .order('bid_amount', { ascending: true });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      // Get the bid details
      const bid = bids.find(b => b.id === bidId);
      if (!bid) return;

      // Update the bid status
      const { error: bidError } = await supabase
        .from('delivery_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

      if (bidError) throw bidError;

      // Reject all other bids
      await supabase
        .from('delivery_bids')
        .update({ status: 'rejected' })
        .eq('delivery_id', deliveryId)
        .neq('id', bidId);

      // Update the delivery with selected bid and assign driver
      const updateData: any = {
        selected_bid_id: bidId,
        status: 'assigned',
        estimated_price: bid.bid_amount
      };

      if (bid.driver_id) {
        updateData.driver_id = bid.driver_id;
      }

      const { error: deliveryError } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (deliveryError) throw deliveryError;

      toast.success('Bid accepted! Driver has been assigned.');
      onBidAccepted?.();
      fetchBids();
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast.error('Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_bids')
        .update({ status: 'rejected' })
        .eq('id', bidId);

      if (error) throw error;
      toast.success('Bid rejected');
      fetchBids();
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast.error('Failed to reject bid');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingBids = bids.filter(b => b.status === 'pending');
  const acceptedBid = bids.find(b => b.status === 'accepted');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Delivery Bids
            </CardTitle>
            <CardDescription>
              {pendingBids.length} pending {pendingBids.length === 1 ? 'bid' : 'bids'}
            </CardDescription>
          </div>
          {biddingDeadline && timeLeft !== null && timeLeft > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeLeft} min left
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {acceptedBid && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              ✓ Accepted Bid
            </p>
            <DeliveryBidCard 
              bid={acceptedBid} 
              isSelected={true}
            />
          </div>
        )}

        {!showBids || bids.length === 0 ? (
          <div className="text-center py-8">
            <div className="relative mb-4 flex justify-center">
              <Gavel className="h-12 w-12 text-muted-foreground animate-bounce" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium">Searching for drivers...</p>
            <p className="text-sm text-muted-foreground">
              Drivers and delivery companies are reviewing your request
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingBids.map((bid) => (
              <DeliveryBidCard
                key={bid.id}
                bid={bid}
                onAccept={handleAcceptBid}
                onReject={handleRejectBid}
                isBuyer={true}
                isSelected={bid.id === selectedBidId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
