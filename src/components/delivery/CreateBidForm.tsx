import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateBidFormProps {
  deliveryId: string;
  driverId?: string | null;
  companyId?: string | null;
  suggestedPrice?: number;
  onBidCreated?: () => void;
}

export const CreateBidForm = ({ 
  deliveryId, 
  driverId,
  companyId,
  suggestedPrice,
  onBidCreated 
}: CreateBidFormProps) => {
  const [bidAmount, setBidAmount] = useState(suggestedPrice?.toString() || '');
  const [estimatedTime, setEstimatedTime] = useState('30');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverId && !companyId) {
      toast({ title: 'Invalid provider', variant: 'destructive' });
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast({ title: 'Please enter a valid bid amount', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('delivery_bids')
        .insert({
          delivery_id: deliveryId,
          driver_id: driverId || null,
          company_id: companyId || null,
          bid_amount: parseFloat(bidAmount),
          estimated_time_minutes: parseInt(estimatedTime),
          message: message || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({ title: 'Bid submitted successfully!' });
      setBidAmount('');
      setEstimatedTime('30');
      setMessage('');
      onBidCreated?.();
    } catch (error: any) {
      console.error('Error creating bid:', error);
      toast({ title: error.message || 'Failed to submit bid', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Submit Your Bid
        </CardTitle>
        <CardDescription>
          Offer your price and estimated delivery time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bidAmount">Bid Amount ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">Est. Time (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="estimatedTime"
                  type="number"
                  min="5"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="30"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note about your service..."
              rows={3}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Bid
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
