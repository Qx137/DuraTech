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
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Upload, Clock, CheckCircle, AlertCircle, Camera, Building2, User, Wallet, Landmark } from "lucide-react";
import { z } from "zod";

type SellerType = "individual" | "corporate";
type MobileProvider = "ecocash" | "innbucks" | "onemoney";
type PaymentMethodType = "mobile_money" | "bank";

// Zimbabwe ID format: XX-XXXXXXXAXX (digits-digitsLetterDigits)
const ZW_ID_REGEX = /^\d{2}-\d{6,7}[A-Za-z]\d{2}$/;
// Phone: starts with 07 and 9-10 digits, or +263 format
const ZW_PHONE_REGEX = /^(\+263|0)(7[1-9])\d{7}$/;
// Bank account: 6-20 digits
const BANK_ACCOUNT_REGEX = /^\d{6,20}$/;

type FormErrors = Record<string, string>;

const MOBILE_PROVIDERS: { key: MobileProvider; label: string }[] = [
  { key: "ecocash", label: "EcoCash" },
  { key: "innbucks", label: "InnBucks" },
  { key: "onemoney", label: "OneMoney" },
];

const FileUploadBox = ({
  id, label, file, onFileChange, icon: Icon = Upload,
}: {
  id: string; label: string; file: File | null; onFileChange: (f: File) => void; icon?: React.ElementType;
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
            <span className="text-white text-xs font-medium">Change</span>
          </div>
        </div>
      ) : (
        <>
          <Icon className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Click to upload {label}</p>
        </>
      )}
      <input id={id} type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])} />
    </div>
  </div>
);

export const KycVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"none" | "pending" | "verified" | "rejected">("none");
  const [kycData, setKycData] = useState<any>(null);

  // Personal details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Seller type
  const [sellerType, setSellerType] = useState<SellerType>("individual");

  // ID documents
  const [idType, setIdType] = useState("national_id");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  // Corporate docs
  const [certOfIncorporation, setCertOfIncorporation] = useState<File | null>(null);
  const [taxClearance, setTaxClearance] = useState<File | null>(null);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([]);
  const [mobileProviders, setMobileProviders] = useState<MobileProvider[]>([]);
  const [mobileNumber, setMobileNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user) fetchKycStatus();
  }, [user]);

  const fetchKycStatus = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from("profiles").select("kyc_status").eq("id", user.id).single();
      const kycStatus = (profile as any)?.kyc_status || "none";
      setStatus(kycStatus);
      if (kycStatus !== "none") {
        const { data: kyc } = await (supabase.from("kyc_verifications" as any).select("*").eq("user_id", user.id) as any).maybeSingle();
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
    const { data: { publicUrl } } = supabase.storage.from("kyc-documents").getPublicUrl(fileName);
    return publicUrl;
  };

  const togglePaymentMethod = (method: PaymentMethodType) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  const toggleMobileProvider = (provider: MobileProvider) => {
    setMobileProviders((prev) =>
      prev.includes(provider) ? prev.filter((p) => p !== provider) : [...prev, provider]
    );
  };

  const validateForm = (): FormErrors => {
    const errs: FormErrors = {};

    // Personal details
    if (!firstName.trim()) errs.firstName = "First name is required";
    else if (firstName.trim().length < 2) errs.firstName = "Must be at least 2 characters";
    else if (!/^[a-zA-Z\s'-]+$/.test(firstName.trim())) errs.firstName = "Only letters, spaces, hyphens allowed";

    if (!lastName.trim()) errs.lastName = "Surname is required";
    else if (lastName.trim().length < 2) errs.lastName = "Must be at least 2 characters";
    else if (!/^[a-zA-Z\s'-]+$/.test(lastName.trim())) errs.lastName = "Only letters, spaces, hyphens allowed";

    if (!idNumber.trim()) errs.idNumber = "ID number is required";
    else if (!ZW_ID_REGEX.test(idNumber.trim())) errs.idNumber = "Invalid format. Use: 63-123456A78";

    // Documents
    if (!idFront) errs.idFront = "ID front is required";
    if (idType !== "passport" && !idBack) errs.idBack = "ID back is required";
    if (!selfie) errs.selfie = "Selfie with ID is required";
    if (sellerType === "corporate") {
      if (!certOfIncorporation) errs.cert = "Certificate of Incorporation is required";
      if (!taxClearance) errs.tax = "Tax Clearance is required";
    }

    // Payment methods
    if (paymentMethods.length === 0) errs.paymentMethods = "Select at least one payment method";

    if (paymentMethods.includes("mobile_money")) {
      if (mobileProviders.length === 0) errs.mobileProviders = "Select at least one provider";
      if (!mobileNumber.trim()) errs.mobileNumber = "Mobile number is required";
      else if (!ZW_PHONE_REGEX.test(mobileNumber.trim())) errs.mobileNumber = "Invalid format. Use: 0771234567 or +2637X1234567";
    }

    if (paymentMethods.includes("bank")) {
      if (!bankName.trim()) errs.bankName = "Bank name is required";
      if (!bankAccountNumber.trim()) errs.bankAccountNumber = "Account number is required";
      else if (!BANK_ACCOUNT_REGEX.test(bankAccountNumber.trim())) errs.bankAccountNumber = "Must be 6-20 digits";
    }

    return errs;
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    const formErrors = validateForm();
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      toast({ title: "Validation Errors", description: "Please fix the highlighted fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const frontUrl = await uploadFile(idFront!, "id_front");
      const selfieUrl = await uploadFile(selfie!, "selfie");
      let backUrl = null;
      let certUrl = null;
      let taxUrl = null;

      if (idType !== "passport" && idBack) backUrl = await uploadFile(idBack, "id_back");
      if (sellerType === "corporate") {
        certUrl = await uploadFile(certOfIncorporation!, "cert_of_incorporation");
        taxUrl = await uploadFile(taxClearance!, "tax_clearance");
      }

      const { error: kycError } = await (supabase.from("kyc_verifications" as any).upsert({
        user_id: user?.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        id_number: idNumber.trim(),
        id_type: idType,
        id_front_url: frontUrl,
        id_back_url: backUrl,
        selfie_url: selfieUrl,
        seller_type: sellerType,
        certificate_of_incorporation_url: certUrl,
        tax_clearance_url: taxUrl,
        payment_methods: paymentMethods,
        mobile_money_provider: mobileProviders,
        mobile_money_number: paymentMethods.includes("mobile_money") ? mobileNumber.trim() : null,
        bank_name: paymentMethods.includes("bank") ? bankName.trim() : null,
        bank_account_number: paymentMethods.includes("bank") ? bankAccountNumber.trim() : null,
        bank_branch: paymentMethods.includes("bank") ? bankBranch.trim() : null,
        status: "pending",
      } as any) as any);

      if (kycError) throw kycError;

      const { error: profileError } = await (supabase.from("profiles").update({ kyc_status: "pending" } as any).eq("id", user?.id) as any);
      if (profileError) throw profileError;

      toast({ title: "KYC Submitted", description: "Your verification documents have been received and are under review." });
      fetchKycStatus();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message || "An error occurred.", variant: "destructive" });
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
          <CardDescription>We are currently reviewing your documents. This usually takes 24-48 hours.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-10">
          <Clock className="h-16 w-16 text-orange-100 mb-4 animate-pulse" />
          <p className="text-muted-foreground text-center max-w-md">
            Your identity is being verified. You'll receive a notification once complete.
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
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">KYC VERIFIED</Badge>
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
        <CardDescription>Complete your KYC to unlock all features and build trust on the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {status === "rejected" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">Verification Rejected</p>
              <p className="text-sm text-red-600">
                Reason: {kycData?.rejection_reason || "The documents provided were not clear or valid."}
              </p>
            </div>
          </div>
        )}

        {/* Personal Details */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Personal Details</Label>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Enter first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Surname <span className="text-destructive">*</span></Label>
              <Input placeholder="Enter surname" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ID Number <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. 63-123456A78" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} maxLength={50} />
          </div>
        </div>

        {/* Seller Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Seller Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setSellerType("individual")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                sellerType === "individual" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              <User className="h-6 w-6" />
              <span className="text-sm font-medium">Individual</span>
              <span className="text-[10px] text-muted-foreground text-center">Personal seller account</span>
            </button>
            <button type="button" onClick={() => setSellerType("corporate")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                sellerType === "corporate" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              <Building2 className="h-6 w-6" />
              <span className="text-sm font-medium">Corporate</span>
              <span className="text-[10px] text-muted-foreground text-center">Registered business</span>
            </button>
          </div>
        </div>

        {/* ID Type & Documents */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Identity Documents</Label>
          <div className="space-y-2">
            <Label>ID Type</Label>
            <Select value={idType} onValueChange={setIdType}>
              <SelectTrigger><SelectValue placeholder="Select ID Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="drivers_license">Driver's License</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <FileUploadBox id="id-front" label={`ID Front ${idType === "passport" ? "(Photo Page)" : ""}`} file={idFront} onFileChange={setIdFront} />
            {idType !== "passport" && <FileUploadBox id="id-back" label="ID Back" file={idBack} onFileChange={setIdBack} />}
            <FileUploadBox id="selfie" label="Selfie with ID" file={selfie} onFileChange={setSelfie} icon={Camera} />
          </div>
        </div>

        {/* Corporate Documents */}
        {sellerType === "corporate" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <Label className="text-base font-semibold">Business Documents</Label>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Corporate sellers must provide additional documents.</p>
            <div className="grid md:grid-cols-2 gap-6">
              <FileUploadBox id="cert-incorporation" label="Certificate of Incorporation" file={certOfIncorporation} onFileChange={setCertOfIncorporation} />
              <FileUploadBox id="tax-clearance" label="Tax Clearance Certificate" file={taxClearance} onFileChange={setTaxClearance} />
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Payment Methods <span className="text-destructive">*</span></Label>
          <p className="text-xs text-muted-foreground -mt-2">Select how you'd like to receive payments. You can choose one or both.</p>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => togglePaymentMethod("mobile_money")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                paymentMethods.includes("mobile_money") ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              <Wallet className="h-6 w-6" />
              <span className="text-sm font-medium">Mobile Money</span>
            </button>
            <button type="button" onClick={() => togglePaymentMethod("bank")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                paymentMethods.includes("bank") ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              <Landmark className="h-6 w-6" />
              <span className="text-sm font-medium">Bank Account</span>
            </button>
          </div>

          {/* Mobile Money Details */}
          {paymentMethods.includes("mobile_money") && (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label className="font-medium">Select Mobile Money Provider(s) <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-4">
                {MOBILE_PROVIDERS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={mobileProviders.includes(key)}
                      onCheckedChange={() => toggleMobileProvider(key)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Mobile Number <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. 0771234567" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} maxLength={15} />
              </div>
            </div>
          )}

          {/* Bank Details */}
          {paymentMethods.includes("bank") && (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-200">
              <Label className="font-medium">Bank Details</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g. CBZ Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number <span className="text-destructive">*</span></Label>
                  <Input placeholder="Enter account number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} maxLength={30} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Branch (optional)</Label>
                <Input placeholder="e.g. Harare Main Branch" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} maxLength={100} />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Verification"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
