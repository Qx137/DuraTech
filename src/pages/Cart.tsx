
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingCart, Leaf, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NotchHeader from "@/components/layout/NotchHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  farmer: string;
  image: string;
  organic: boolean;
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const { data: cartData, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            name,
            price,
            image,
            organic,
            profiles (
              business_name
            )
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const formattedItems = cartData?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.products?.name || '',
        price: Number(item.products?.price) || 0,
        quantity: item.quantity,
        farmer: item.products?.profiles?.business_name || 'Unknown Farmer',
        image: item.products?.image || '',
        organic: item.products?.organic || false,
      })) || [];

      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, change: number) => {
    const item = cartItems.find(item => item.id === id);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + change);

    if (newQuantity === 0) {
      removeItem(id);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;

      setCartItems(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== id));
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }
    navigate('/delivery');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      <NotchHeader
        navItems={[
          { label: "Marketplace", to: "/marketplace" },
          { label: "Community", to: "/community" },
          { label: "Cart", to: "/cart", active: true },
        ]}
        actions={
          <Link to="/marketplace">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Continue Shopping
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">Review your items before checkout</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your cart...</p>
          </div>
        ) : !user ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Please sign in</h3>
            <p className="text-gray-500 mb-6">You need to sign in to view your cart</p>
            <Link to="/login">
              <Button className="bg-green-600 hover:bg-green-700">
                Sign In
              </Button>
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some fresh produce to get started!</p>
            <Link to="/marketplace">
              <Button className="bg-green-600 hover:bg-green-700">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-gray-600 text-sm">{item.farmer}</p>
                          {item.organic && (
                            <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                              Organic
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium px-3">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 mt-6"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
