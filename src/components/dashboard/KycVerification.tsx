import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, Clock, CheckCircle, AlertCircle, Camera } from "lucide-react";

export const KycVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');
  const [kycData, setKycData] = useState<any>(null);

  const [idType, setIdType] = useState('national_id');
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchKycStatus();
    }
  }, [user]);

  const fetchKycStatus = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', user.id)
        .single();
      
      const kycStatus = (profile as any)?.kyc_status || 'none';
      setStatus(kycStatus);

      if (kycStatus !== 'none') {
        const { data: kyc } = await (supabase
          .from('kyc_verifications' as any)
          .select('*')
          .eq('user_id', user.id) as any)
          .maybeSingle();
        setKycData(kyc);
      }
    } catch (error) {
      console.error('Error fetching KYC:', error);
    }
  };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!idFront || !selfie || (idType !== 'passport' && !idBack)) {
      toast({
        title: "Missing Information",
        description: "Please upload all required documents.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const frontUrl = await uploadFile(idFront, 'id_front');
      const selfieUrl = await uploadFile(selfie, 'selfie');
      let backUrl = null;

      if (idType !== 'passport' && idBack) {
        backUrl = await uploadFile(idBack, 'id_back');
      }

      const { error: kycError } = await (supabase
        .from('kyc_verifications' as any)
        .upsert({
          user_id: user?.id,
          id_type: idType,
          id_front_url: frontUrl,
          id_back_url: backUrl,
          selfie_url: selfieUrl,
          status: 'pending'
        } as any) as any);

      if (kycError) throw kycError;

      const { error: profileError } = await (supabase
        .from('profiles')
        .update({ kyc_status: 'pending' } as any)
        .eq('id', user?.id) as any);

      if (profileError) throw profileError;

      toast({
        title: "KYC Submitted",
        description: "Your verification documents have been received and are under review.",
      });
      
      fetchKycStatus();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred during submission.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'pending') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-orange-500" />
            <CardTitle>Verification in Progress</CardTitle>
          </div>
          <CardDescription>
            We are currently reviewing your documents. This usually takes 24-48 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-10">
          <Clock className="h-16 w-16 text-orange-100 mb-4 animate-pulse" />
          <p className="text-muted-foreground text-center max-w-md">
            Your identity is being verified. You'll receive a notification and your dashboard will be updated once the process is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'verified') {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle>Account Verified</CardTitle>
          </div>
          <CardDescription>
            Your identity has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-10">
          <Shield className="h-16 w-16 text-green-100 mb-4" />
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
            KYC VERIFIED
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Identity Verification</CardTitle>
        </div>
        <CardDescription>
          Complete your KYC to unlock all features and build trust on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === 'rejected' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start mb-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">Verification Rejected</p>
              <p className="text-sm text-red-600">
                Reason: {kycData?.rejection_reason || "The documents provided were not clear or valid."}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>ID Type</Label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger>
              <SelectValue placeholder="Select ID Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national_id">National ID</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>ID Front {idType === 'passport' ? '(Photo Page)' : ''}</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer transition-colors ${idFront ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
              onClick={() => document.getElementById('id-front')?.click()}
            >
              {idFront ? (
                <div className="relative w-full h-full">
                  <img src={URL.createObjectURL(idFront)} className="w-full h-full object-cover rounded" alt="ID Front" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Change Image</span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Click to upload ID Front</p>
                </>
              )}
              <input 
                id="id-front" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && setIdFront(e.target.files[0])} 
              />
            </div>
          </div>

          {idType !== 'passport' && (
            <div className="space-y-2">
              <Label>ID Back</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer transition-colors ${idBack ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
                onClick={() => document.getElementById('id-back')?.click()}
              >
                {idBack ? (
                  <div className="relative w-full h-full">
                    <img src={URL.createObjectURL(idBack)} className="w-full h-full object-cover rounded" alt="ID Back" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-medium">Change Image</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Click to upload ID Back</p>
                  </>
                )}
                <input 
                  id="id-back" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files?.[0] && setIdBack(e.target.files[0])} 
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Selfie with ID</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer transition-colors ${selfie ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}`}
              onClick={() => document.getElementById('selfie')?.click()}
            >
              {selfie ? (
                <div className="relative w-full h-full">
                  <img src={URL.createObjectURL(selfie)} className="w-full h-full object-cover rounded" alt="Selfie" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Change Image</span>
                  </div>
                </div>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Click to upload Selfie</p>
                </>
              )}
              <input 
                id="selfie" 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && setSelfie(e.target.files[0])} 
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={loading || !idFront || !selfie || (idType !== 'passport' && !idBack)}
          >
            {loading ? "Submitting..." : "Submit Verification"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
