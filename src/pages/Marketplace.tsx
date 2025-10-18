
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import SearchFilters from "@/components/marketplace/SearchFilters";
import AIRecommendationsBanner from "@/components/marketplace/AIRecommendationsBanner";
import ProductCard from "@/components/marketplace/ProductCard";
import NoProductsFound from "@/components/marketplace/NoProductsFound";
import { products as sampleProducts, Product } from "@/data/sampleProducts";
import { calculateDistance, getSellerLocationFromProduct, Location } from "@/utils/distanceCalculator";

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.farmer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesOrganic = !organicOnly || product.organic;
    
    return matchesSearch && matchesCategory && matchesOrganic;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  useEffect(() => {
    fetchProducts();
    getUserLocation();
    if (user) {
      fetchCartCount();
    } else {
      setCartCount(0);
    }
  }, [user]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied, using default location');
          // Default to NYC if location access is denied
          setUserLocation({ lat: 40.7128, lng: -74.0060 });
        }
      );
    } else {
      // Default to NYC if geolocation is not supported
      setUserLocation({ lat: 40.7128, lng: -74.0060 });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles (
            name,
            business_name
          )
        `);

      if (error) throw error;

      const formattedProducts = await Promise.all(
        (data || []).map(async product => {
          const sellerLocation = getSellerLocationFromProduct(product);
          const distance = userLocation ? await calculateDistance(userLocation, sellerLocation) : null;
          
          return {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            unit: product.unit,
            farmer: product.profiles?.business_name || product.profiles?.name || 'Unknown Farmer',
            location: product.location || 'Unknown Location',
            rating: Number(product.rating) || 0,
            image: product.image || 'https://images.unsplash.com/photo-1546470427-227e09b17322?w=400&h=300&fit=crop',
            category: product.category,
            organic: product.organic,
            description: product.description || '',
            distance: distance
          };
        })
      );

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Use sample products as fallback
      setProducts(sampleProducts);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (error) throw error;
      setCartCount(count || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const addToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if item already exists in cart
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingItem) {
        // Update quantity if item exists
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Insert new item if it doesn't exist
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert([
            {
              user_id: user.id,
              product_id: productId,
              quantity: 1
            }
          ]);

        if (insertError) throw insertError;
      }

      await fetchCartCount();
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart successfully!",
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      <MarketplaceHeader cartCount={cartCount} />

      <div className="container mx-auto px-4 py-8">
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          organicOnly={organicOnly}
          setOrganicOnly={setOrganicOnly}
          categories={categories}
          filteredProductsCount={filteredProducts.length}
          totalProductsCount={products.length}
        />

        <AIRecommendationsBanner />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => addToCart(product.id)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && <NoProductsFound />}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
