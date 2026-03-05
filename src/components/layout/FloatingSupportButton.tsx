import { useState } from "react";
import { MessageCircle, X, Mail, Phone } from "lucide-react";

const FloatingSupportButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-background border border-border rounded-2xl shadow-xl p-5 w-72 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm text-foreground">Contact Support</h4>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <a
              href="mailto:info.durahubonline@gmail.com"
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-4 w-4 shrink-0" />
              info.durahubonline@gmail.com
            </a>
            <a
              href="tel:+263789613200"
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 shrink-0" />
              +263 789 613 200
            </a>
            <a
              href="tel:+263780431231"
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4 shrink-0" />
              +263 780 431 231
            </a>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-primary text-primary-foreground h-14 w-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Contact support"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default FloatingSupportButton;
