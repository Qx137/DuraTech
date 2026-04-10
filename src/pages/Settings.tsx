import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, User, Store, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import NotchHeader from "@/components/layout/NotchHeader";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const sellerInfoSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters").max(100, "Business name must be less than 100 characters"),
  description: z.string().trim().max(500, "Description must be less than 500 characters").optional(),
});

type SellerInfo = z.infer<typeof sellerInfoSchema>;

const Settings = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | 'driver'>(user?.userType || 'buyer');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSellerFormDialog, setShowSellerFormDialog] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>({
    businessName: user?.businessName || '',
    description: user?.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleRoleButtonClick = () => {
    if (selectedRole === user.userType) return;
    
    if (selectedRole === 'seller') {
      // Show seller info form when switching to seller
      setShowSellerFormDialog(true);
    } else {
      // Show simple confirmation when switching to buyer
      setShowConfirmDialog(true);
    }
  };

  const validateSellerInfo = (): boolean => {
    const result = sellerInfoSchema.safeParse(sellerInfo);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSellerFormSubmit = async () => {
    if (!validateSellerInfo()) return;
    
    setIsUpdating(true);
    try {
      // Use edge function for secure role change
      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: {
          role: 'seller',
          business_name: sellerInfo.businessName.trim(),
          description: sellerInfo.description?.trim() || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Welcome, Seller!",
        description: "Your account has been upgraded to a seller account. The page will refresh.",
      });

      setShowSellerFormDialog(false);
      
      // Refresh the page to update the auth context
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error updating to seller:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSwitchToBuyer = async () => {
    setIsUpdating(true);
    try {
      // Use edge function for secure role change
      const { data, error } = await supabase.functions.invoke('update-user-role', {
        body: { role: 'buyer' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Role Updated",
        description: "You are now a buyer. The page will refresh.",
      });

      setShowConfirmDialog(false);
      
      // Refresh the page to update the auth context
      setTimeout(() => window.location.reload(), 1000);
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
      <NotchHeader
        navItems={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Marketplace", to: "/marketplace" },
          { label: "Community", to: "/community" },
          { label: "DuraGo", to: "/delivery" },
          { label: "AI Tools", to: "/ai-tools" },
        ]}
        actions={
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        }
      />

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
              
              {user.userType === 'seller' && user.businessName && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{user.businessName}</p>
                  {user.description && (
                    <>
                      <p className="text-sm text-muted-foreground mt-2">Description</p>
                      <p className="text-sm">{user.description}</p>
                    </>
                  )}
                </div>
              )}
              
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
              onClick={handleRoleButtonClick}
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

      {/* Simple confirmation for switching to buyer */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to Buyer Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to switch to a buyer account? You will no longer be able to list products until you switch back to seller.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSwitchToBuyer} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm Switch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seller registration form dialog */}
      <Dialog open={showSellerFormDialog} onOpenChange={setShowSellerFormDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Become a Seller</DialogTitle>
            <DialogDescription>
              Please provide your business information to set up your seller account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessName"
                placeholder="Enter your business or farm name"
                value={sellerInfo.businessName}
                onChange={(e) => {
                  setSellerInfo({ ...sellerInfo, businessName: e.target.value });
                  if (errors.businessName) setErrors({ ...errors, businessName: '' });
                }}
                maxLength={100}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive">{errors.businessName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">
                Business Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Tell buyers about your business, what you sell, and your farming practices..."
                value={sellerInfo.description || ''}
                onChange={(e) => {
                  setSellerInfo({ ...sellerInfo, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: '' });
                }}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {sellerInfo.description?.length || 0}/500
              </p>
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSellerFormDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSellerFormSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Become a Seller'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
