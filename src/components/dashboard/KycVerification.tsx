import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, Clock, CheckCircle, AlertCircle, Camera, Building2, User } from "lucide-react";

type SellerType = "individual" | "corporate";

const FileUploadBox = ({
  id,
  label,
  file,
  onFileChange,
  icon: Icon = Upload,
}: {
  id: string;
  label: string;
  file: File | null;
  onFileChange: (f: File) => void;
  icon?: React.ElementType;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div
      className={`border-2 border-dashed rounded-lg p-4 h-40 flex flex-col items-center justify-center cursor-pointer transition-colors ${
        file ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
      }`}
      onClick={() => document.getElementById(id)?.click()}
    >
      {file ? (
        <div className="relative w-full h-full">
          <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded" alt={label} />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-medium">Change Image</span>
          </div>
        </div>
      ) : (
        <>
          <Icon className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Click to upload {label}</p>
        </>
      )}
      <input
        id={id}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
      />
    </div>
  </div>
);

export const KycVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"none" | "pending" | "verified" | "rejected">("none");
  const [kycData, setKycData] = useState<any>(null);

  const [sellerType, setSellerType] = useState<SellerType>("individual");
  const [idType, setIdType] = useState("national_id");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [certOfIncorporation, setCertOfIncorporation] = useState<File | null>(null);
  const [taxClearance, setTaxClearance] = useState<File | null>(null);

  useEffect(() => {
    if (user) fetchKycStatus();
  }, [user]);

  const fetchKycStatus = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("kyc_status")
        .eq("id", user.id)
        .single();

      const kycStatus = (profile as any)?.kyc_status || "none";
      setStatus(kycStatus);

      if (kycStatus !== "none") {
        const { data: kyc } = await (
          supabase
            .from("kyc_verifications" as any)
            .select("*")
            .eq("user_id", user.id) as any
        ).maybeSingle();
        setKycData(kyc);
      }
    } catch (error) {
      console.error("Error fetching KYC:", error);
    }
  };

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}/${type}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from("kyc-documents").upload(fileName, file);
    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("kyc-documents").getPublicUrl(fileName);
    return publicUrl;
  };

  const isFormValid = () => {
    const baseValid = !!idFront && !!selfie && (idType === "passport" || !!idBack);
    if (sellerType === "corporate") {
      return baseValid && !!certOfIncorporation && !!taxClearance;
    }
    return baseValid;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please upload all required documents.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const frontUrl = await uploadFile(idFront!, "id_front");
      const selfieUrl = await uploadFile(selfie!, "selfie");
      let backUrl = null;
      let certUrl = null;
      let taxUrl = null;

      if (idType !== "passport" && idBack) {
        backUrl = await uploadFile(idBack, "id_back");
      }

      if (sellerType === "corporate") {
        certUrl = await uploadFile(certOfIncorporation!, "cert_of_incorporation");
        taxUrl = await uploadFile(taxClearance!, "tax_clearance");
      }

      const { error: kycError } = await (
        supabase.from("kyc_verifications" as any).upsert({
          user_id: user?.id,
          id_type: idType,
          id_front_url: frontUrl,
          id_back_url: backUrl,
          selfie_url: selfieUrl,
          seller_type: sellerType,
          certificate_of_incorporation_url: certUrl,
          tax_clearance_url: taxUrl,
          status: "pending",
        } as any) as any
      );

      if (kycError) throw kycError;

      const { error: profileError } = await (
        supabase
          .from("profiles")
          .update({ kyc_status: "pending" } as any)
          .eq("id", user?.id) as any
      );

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
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === "pending") {
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

  if (status === "verified") {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle>Account Verified</CardTitle>
          </div>
          <CardDescription>Your identity has been successfully verified.</CardDescription>
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
        {status === "rejected" && (
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

        {/* Seller Type Selection */}
        <div className="space-y-3">
          <Label>Seller Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSellerType("individual")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                sellerType === "individual"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <User className="h-6 w-6" />
              <span className="text-sm font-medium">Individual</span>
              <span className="text-[10px] text-muted-foreground text-center">Personal seller account</span>
            </button>
            <button
              type="button"
              onClick={() => setSellerType("corporate")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                sellerType === "corporate"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm font-medium">Corporate</span>
              <span className="text-[10px] text-muted-foreground text-center">Registered business</span>
            </button>
          </div>
        </div>

        {/* ID Type */}
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

        {/* Identity Documents */}
        <div className="grid md:grid-cols-2 gap-6">
          <FileUploadBox
            id="id-front"
            label={`ID Front ${idType === "passport" ? "(Photo Page)" : ""}`}
            file={idFront}
            onFileChange={setIdFront}
          />

          {idType !== "passport" && (
            <FileUploadBox id="id-back" label="ID Back" file={idBack} onFileChange={setIdBack} />
          )}

          <FileUploadBox id="selfie" label="Selfie with ID" file={selfie} onFileChange={setSelfie} icon={Camera} />
        </div>

        {/* Corporate Documents */}
        {sellerType === "corporate" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-2">
              <Building2 className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Business Documents</Label>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Corporate sellers must provide the following additional documents.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <FileUploadBox
                id="cert-incorporation"
                label="Certificate of Incorporation"
                file={certOfIncorporation}
                onFileChange={setCertOfIncorporation}
              />
              <FileUploadBox
                id="tax-clearance"
                label="Tax Clearance Certificate"
                file={taxClearance}
                onFileChange={setTaxClearance}
              />
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button className="w-full" onClick={handleSubmit} disabled={loading || !isFormValid()}>
            {loading ? "Submitting..." : "Submit Verification"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
