
import { useAuth } from "@/contexts/AuthContext";
import { BuyerDashboard } from "@/components/dashboard/BuyerDashboard";
import { SellerDashboard } from "@/components/dashboard/SellerDashboard";
import { DriverDashboard } from "@/components/dashboard/DriverDashboard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isDriver, setIsDriver] = useState(false);
  const [checkingDriver, setCheckingDriver] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user is a driver
    const checkDriverStatus = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setIsDriver(true);
        }
      } catch (error) {
        console.error('Error checking driver status:', error);
      } finally {
        setCheckingDriver(false);
      }
    };

    checkDriverStatus();
  }, [isAuthenticated, navigate, user?.id]);

  if (!user || checkingDriver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isDriver ? (
        <DriverDashboard userId={user.id} />
      ) : user.userType === 'seller' ? (
        <SellerDashboard user={user} />
      ) : (
        <BuyerDashboard user={user} />
      )}
    </div>
  );
};

export default Dashboard;
