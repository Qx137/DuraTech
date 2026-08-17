
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import AITools from "./pages/AITools";
import Community from "./pages/Community";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import FloatingSupportButton from "./components/layout/FloatingSupportButton";

const queryClient = new QueryClient();
const DURAGO_URL = "https://durago.co.zw";

const ExternalRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <a href={to} className="text-primary underline">
        Redirecting to DuraGo...
      </a>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/home" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/community" element={<Community />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/delivery-tracking" element={<ExternalRedirect to={DURAGO_URL} />} />
            <Route path="/driver-registration" element={<ExternalRedirect to={DURAGO_URL} />} />
            <Route path="/company-registration" element={<ExternalRedirect to={DURAGO_URL} />} />
            <Route path="/delivery-bid-selection/:deliveryId" element={<ExternalRedirect to={DURAGO_URL} />} />
            <Route path="/delivery-bids/:deliveryId" element={<ExternalRedirect to={DURAGO_URL} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/delivery" element={<ExternalRedirect to={DURAGO_URL} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingSupportButton />
          <Analytics />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
