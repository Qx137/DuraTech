 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Truck, Package, MapPin, Clock, Shield, Star, ArrowLeft, LogIn } from "lucide-react";
 import { Link, useNavigate } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 
 const Delivery = () => {
   const { isAuthenticated, user } = useAuth();
   const navigate = useNavigate();
   const [showAuthPrompt, setShowAuthPrompt] = useState(false);
   const [showRequestForm, setShowRequestForm] = useState(false);
 
   const handleRequestDelivery = () => {
     if (!isAuthenticated) {
       setShowAuthPrompt(true);
     } else {
       setShowRequestForm(true);
     }
   };
 
   const handleBecomeDriver = () => {
     if (!isAuthenticated) {
       setShowAuthPrompt(true);
     } else {
       navigate("/driver-registration");
     }
   };
 
   return (
     <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
       {/* Header */}
       <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
               <ArrowLeft className="h-5 w-5" />
               <span className="hidden sm:inline">Back to Home</span>
             </Link>
             <div className="h-6 w-px bg-gray-300" />
             <div className="flex items-center gap-2">
               <Truck className="h-6 w-6 text-orange-600" />
               <span className="text-xl font-bold text-gray-900">DuraHub Delivery</span>
             </div>
           </div>
           <div className="flex items-center gap-3">
             {isAuthenticated ? (
               <Link to="/dashboard">
                 <Button variant="outline" size="sm">Dashboard</Button>
               </Link>
             ) : (
               <>
                 <Link to="/login">
                   <Button variant="outline" size="sm">Login</Button>
                 </Link>
                 <Link to="/register">
                   <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Sign Up</Button>
                 </Link>
               </>
             )}
           </div>
         </div>
       </header>
 
       {/* Hero Section */}
       <section className="py-16 md:py-24">
         <div className="container mx-auto px-4 text-center">
           <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
             <Truck className="h-4 w-4" />
             Fast & Reliable Delivery Service
           </div>
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
             Deliver Anything,
             <span className="text-orange-600 block">Anywhere</span>
           </h1>
           <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
             Whether you're a farmer with fresh produce, a business with goods, or anyone needing reliable delivery - DuraHub Delivery connects you with trusted drivers.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button 
               size="lg" 
               className="bg-orange-600 hover:bg-orange-700 text-lg px-8"
               onClick={handleRequestDelivery}
             >
               <Package className="mr-2 h-5 w-5" />
               Request a Delivery
             </Button>
             <Button 
               size="lg" 
               variant="outline" 
               className="text-lg px-8 border-orange-600 text-orange-600 hover:bg-orange-50"
               onClick={handleBecomeDriver}
             >
               <Truck className="mr-2 h-5 w-5" />
               Become a Driver
             </Button>
           </div>
         </div>
       </section>
 
       {/* How It Works */}
       <section className="py-16 bg-white">
         <div className="container mx-auto px-4">
           <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
           <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
             <div className="text-center">
               <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl font-bold text-orange-600">1</span>
               </div>
               <h3 className="text-xl font-semibold mb-2">Submit Request</h3>
               <p className="text-gray-600">Tell us what you need delivered, from where, and to where.</p>
             </div>
             <div className="text-center">
               <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl font-bold text-orange-600">2</span>
               </div>
               <h3 className="text-xl font-semibold mb-2">Get Bids</h3>
               <p className="text-gray-600">Receive competitive bids from verified drivers and companies.</p>
             </div>
             <div className="text-center">
               <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl font-bold text-orange-600">3</span>
               </div>
               <h3 className="text-xl font-semibold mb-2">Track & Receive</h3>
               <p className="text-gray-600">Track your delivery in real-time until it arrives safely.</p>
             </div>
           </div>
         </div>
       </section>
 
       {/* Features */}
       <section className="py-16">
         <div className="container mx-auto px-4">
           <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose DuraHub Delivery?</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="border-0 shadow-lg">
               <CardHeader className="text-center pb-2">
                 <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                   <Shield className="h-6 w-6 text-orange-600" />
                 </div>
                 <CardTitle className="text-lg">Verified Drivers</CardTitle>
               </CardHeader>
               <CardContent className="text-center text-gray-600 text-sm">
                 All drivers are verified and background-checked for your peace of mind.
               </CardContent>
             </Card>
             
             <Card className="border-0 shadow-lg">
               <CardHeader className="text-center pb-2">
                 <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                   <Clock className="h-6 w-6 text-orange-600" />
                 </div>
                 <CardTitle className="text-lg">Fast Delivery</CardTitle>
               </CardHeader>
               <CardContent className="text-center text-gray-600 text-sm">
                 Same-day and next-day delivery options available for urgent needs.
               </CardContent>
             </Card>
             
             <Card className="border-0 shadow-lg">
               <CardHeader className="text-center pb-2">
                 <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                   <MapPin className="h-6 w-6 text-orange-600" />
                 </div>
                 <CardTitle className="text-lg">Real-Time Tracking</CardTitle>
               </CardHeader>
               <CardContent className="text-center text-gray-600 text-sm">
                 Track your package in real-time from pickup to delivery.
               </CardContent>
             </Card>
             
             <Card className="border-0 shadow-lg">
               <CardHeader className="text-center pb-2">
                 <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                   <Star className="h-6 w-6 text-orange-600" />
                 </div>
                 <CardTitle className="text-lg">Competitive Pricing</CardTitle>
               </CardHeader>
               <CardContent className="text-center text-gray-600 text-sm">
                 Get multiple bids and choose the best price for your delivery.
               </CardContent>
             </Card>
           </div>
         </div>
       </section>
 
       {/* CTA Section */}
       <section className="py-16 bg-gradient-to-r from-orange-600 to-amber-600">
         <div className="container mx-auto px-4 text-center">
           <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
           <p className="text-orange-100 mb-8 max-w-xl mx-auto">
             Join thousands of satisfied customers who trust DuraHub Delivery for their shipping needs.
           </p>
           <Button 
             size="lg" 
             className="bg-white text-orange-600 hover:bg-orange-50"
             onClick={handleRequestDelivery}
           >
             Request Your First Delivery
           </Button>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="bg-gray-900 text-white py-8">
         <div className="container mx-auto px-4 text-center">
           <div className="flex items-center justify-center gap-2 mb-4">
             <Truck className="h-6 w-6 text-orange-500" />
             <span className="text-xl font-bold">DuraHub Delivery</span>
           </div>
           <p className="text-gray-400 text-sm">
             Part of the DuraHub ecosystem - Connecting farmers, buyers, and delivery partners.
           </p>
           <div className="mt-4 flex justify-center gap-6 text-sm text-gray-400">
             <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
             <Link to="/marketplace" className="hover:text-orange-500 transition-colors">Marketplace</Link>
             <Link to="/driver-registration" className="hover:text-orange-500 transition-colors">Driver Registration</Link>
           </div>
         </div>
       </footer>
 
       {/* Auth Prompt Dialog */}
       <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <LogIn className="h-5 w-5 text-orange-600" />
               Sign In Required
             </DialogTitle>
             <DialogDescription>
               Please sign in or create an account to request a delivery or become a driver.
             </DialogDescription>
           </DialogHeader>
           <div className="flex flex-col gap-3 mt-4">
             <Link to="/login?redirect=/delivery" className="w-full">
               <Button className="w-full bg-orange-600 hover:bg-orange-700">
                 Sign In
               </Button>
             </Link>
             <Link to="/register?redirect=/delivery" className="w-full">
               <Button variant="outline" className="w-full">
                 Create Account
               </Button>
             </Link>
           </div>
         </DialogContent>
       </Dialog>
 
       {/* Request Form Dialog */}
       <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
         <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Package className="h-5 w-5 text-orange-600" />
               Request a Delivery
             </DialogTitle>
             <DialogDescription>
               Fill in the details below and drivers will bid on your delivery request.
             </DialogDescription>
           </DialogHeader>
           <form className="space-y-4 mt-4">
             <div className="space-y-2">
               <Label htmlFor="package-type">Package Type</Label>
               <Select>
                 <SelectTrigger>
                   <SelectValue placeholder="Select package type" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="produce">Fresh Produce</SelectItem>
                   <SelectItem value="goods">General Goods</SelectItem>
                   <SelectItem value="documents">Documents</SelectItem>
                   <SelectItem value="fragile">Fragile Items</SelectItem>
                   <SelectItem value="large">Large/Bulk Items</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="description">Package Description</Label>
               <Textarea 
                 id="description" 
                 placeholder="Describe what you're sending (size, weight, special handling requirements)"
                 rows={3}
               />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="pickup">Pickup Location</Label>
                 <Input id="pickup" placeholder="Pickup address" />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="dropoff">Delivery Location</Label>
                 <Input id="dropoff" placeholder="Delivery address" />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="pickup-city">Pickup City</Label>
                 <Input id="pickup-city" placeholder="City" />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="dropoff-city">Delivery City</Label>
                 <Input id="dropoff-city" placeholder="City" />
               </div>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="urgency">Delivery Urgency</Label>
               <Select>
                 <SelectTrigger>
                   <SelectValue placeholder="Select urgency" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="same-day">Same Day (Express)</SelectItem>
                   <SelectItem value="next-day">Next Day</SelectItem>
                   <SelectItem value="standard">Standard (2-3 days)</SelectItem>
                   <SelectItem value="flexible">Flexible</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="contact">Contact Phone</Label>
               <Input id="contact" type="tel" placeholder="+263 7XX XXX XXX" />
             </div>
             
             <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
               Submit Request & Get Bids
             </Button>
           </form>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
 
 export default Delivery;