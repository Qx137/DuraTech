import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrderStatus {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  updated_at: string;
  delivery_address: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  deliveries?: {
    id: string;
    status: string;
    pickup_address: any;
    delivery_address: any;
    tracking_number: string;
  }[];
}

export const useOrderStatus = (orderId: string | null) => {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // Fetch initial order status
    const fetchOrderStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            status, 
            payment_status, 
            updated_at, 
            delivery_address,
            deliveries (
              id,
              status,
              pickup_address,
              delivery_address,
              tracking_number
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;
        setOrderStatus(data as any as OrderStatus);
      } catch (error) {
        console.error('Error fetching order status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrderStatus(prev => prev ? { ...prev, ...payload.new } : payload.new as OrderStatus);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { orderStatus, loading };
};
