import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, User, Store, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller'>(user?.userType || 'buyer');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handleRoleChange = async () => {
    if (selectedRole === user.userType) {
      setShowConfirmDialog(false);
      return;
    }

    setIsUpdating(true);
    try {
      // Update user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: selectedRole })
        .eq('user_id', user.id);

      if (roleError) throw roleError;

      // Update profiles table for backwards compatibility
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_type: selectedRole })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Role Updated",
        description: `You are now a ${selectedRole}. Please log out and log back in to see the changes.`,
      });

      setShowConfirmDialog(false);
      
      // Refresh the page to update the auth context
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account Type</CardTitle>
            <CardDescription>
              Switch between buyer and seller accounts. As a seller, you can list products on the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base">Current Role: <span className="font-semibold capitalize text-primary">{user.userType}</span></Label>
              
              <RadioGroup
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as 'buyer' | 'seller')}
                className="grid gap-4"
              >
                <div className="flex items-center space-x-4 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Buyer</p>
                        <p className="text-sm text-muted-foreground">Browse and purchase products from the marketplace</p>
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-4 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Seller</p>
                        <p className="text-sm text-muted-foreground">List and sell your products on the marketplace</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={() => setShowConfirmDialog(true)}
              disabled={selectedRole === user.userType || isUpdating}
              className="w-full"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Account Type'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Type Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to switch from <span className="font-semibold capitalize">{user.userType}</span> to <span className="font-semibold capitalize">{selectedRole}</span>?
              {selectedRole === 'seller' && (
                <span className="block mt-2 text-primary">
                  As a seller, you'll be able to list products and manage orders.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Change'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
