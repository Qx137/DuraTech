import { Shield, Star, CheckCircle2, Lock } from "lucide-react";

const TrustBar = () => {
  const indicators = [
    { icon: <Shield className="h-4 w-4" />, label: "Buyer Protection" },
    { icon: <Star className="h-4 w-4" />, label: "Verified Reviews" },
    { icon: <CheckCircle2 className="h-4 w-4" />, label: "KYC Sellers" },
    { icon: <Lock className="h-4 w-4" />, label: "Secure Payments" },
  ];

  return (
    <div className="flex items-center justify-center gap-6 flex-wrap py-4">
      {indicators.map(({ icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="text-primary">{icon}</span>
          <span className="text-xs font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustBar;
