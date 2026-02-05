import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverLocation {
  latitude: number;
  longitude: number;
}

export const useDriverLocation = (driverId: string | null) => {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    // Fetch initial location and driver name
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select(`
            current_location,
            profiles:user_id (name)
          `)
          .eq('id', driverId)
          .single();

        if (error) throw error;

        if (data?.current_location) {
          const loc = data.current_location as any;
          if (typeof loc === 'object' && loc.latitude && loc.longitude) {
            setLocation({ latitude: loc.latitude, longitude: loc.longitude });
          }
        }

        const profile = data?.profiles as any;
        if (profile?.name) {
          setDriverName(profile.name);
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driverId}`
        },
        (payload) => {
          if (payload.new.current_location) {
            const loc = payload.new.current_location as any;
            if (typeof loc === 'object' && loc.latitude && loc.longitude) {
              setLocation({ latitude: loc.latitude, longitude: loc.longitude });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const updateLocation = async (newLocation: DriverLocation) => {
    if (!driverId) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          current_location: newLocation as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  return { location, loading, updateLocation, driverName };
};
