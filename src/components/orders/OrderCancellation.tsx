import { Button } from "@/components/ui/button";
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
import { XCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderCancellationProps {
  orderId: string;
  currentStatus: string;
  onCancelled: () => void;
}

export const OrderCancellation = ({ orderId, currentStatus, onCancelled }: OrderCancellationProps) => {
  const [loading, setLoading] = useState(false);

  const canCancel = ['pending', 'processing'].includes(currentStatus);

  const handleCancellation = async () => {
    setLoading(true);
    try {
      // Update order status to cancelled. payment_status is intentionally left
      // untouched here - it can only be changed by the payment webhook, and an
      // actual refund (if the order was paid) has to go through ContiPay separately.
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Send cancellation email
      try {
        await supabase.functions.invoke('send-order-email', {
          body: { orderId, type: 'cancellation' }
        });
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }

      toast.success("Order cancelled successfully. Refund will be processed within 5-7 business days.");
      onCancelled();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error("Failed to cancel order. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  if (!canCancel) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1">
          <XCircle className="h-4 w-4" />
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this order? This action cannot be undone.
            If payment was completed, a refund will be processed within 5-7 business days.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Order</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancellation}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel Order'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
