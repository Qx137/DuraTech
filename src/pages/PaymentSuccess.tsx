
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Leaf, Package, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const orderNumber = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  useEffect(() => {
    // Simulate finding drivers after successful payment
    setTimeout(() => {
      navigate('/delivery-tracking', { 
        state: { orderNumber, orderTotal: 24.94 } 
      });
    }, 5000);
  }, [navigate, orderNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/a2db2940-ded3-4e46-9144-25350c853d8d.png" 
              alt="DuraTech Logo" 
              className="h-8"
            />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your order. We're now finding the best driver for your delivery.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Number:</span>
                <span className="font-mono text-green-600">{orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="font-semibold">$24.94</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <span className="text-green-600 font-medium">Payment Confirmed</span>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Truck className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Finding Your Driver</h3>
            </div>
            <p className="text-blue-700 mb-4">
              We're scanning for available drivers in your area to ensure the fastest delivery of your fresh produce.
            </p>
            <div className="flex justify-center">
              <div className="animate-pulse flex space-x-1">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Order Details</h3>
                <p className="text-gray-600 text-sm">
                  2x Organic Tomatoes<br />
                  1x Fresh Apples
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Delivery Info</h3>
                <p className="text-gray-600 text-sm">
                  Estimated delivery:<br />
                  30-45 minutes
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              You will be automatically redirected to track your delivery in a few seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/delivery-tracking" state={{ orderNumber, orderTotal: 24.94 }}>
                <Button className="bg-green-600 hover:bg-green-700">
                  Track My Delivery
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
