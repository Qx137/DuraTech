
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import SearchFilters from "@/components/marketplace/SearchFilters";
import AIRecommendationsBanner from "@/components/marketplace/AIRecommendationsBanner";
import ProductCard from "@/components/marketplace/ProductCard";
import NoProductsFound from "@/components/marketplace/NoProductsFound";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  farmer: string;
  location: string | null;
  rating: number | null;
  image: string | null;
  category: string;
  organic: boolean;
  description: string | null;
}

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles!seller_id (
            name,
            business_name
          )
        `);

      if (error) throw error;

      const formattedProducts: Product[] = (data || []).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        farmer: product.profiles?.business_name || product.profiles?.name || 'Unknown Farmer',
        location: product.location,
        rating: product.rating || 0,
        image: product.image || "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop",
        category: product.category,
        organic: product.organic,
        description: product.description
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.farmer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesOrganic = !organicOnly || product.organic;
    
    return matchesSearch && matchesCategory && matchesOrganic;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const addToCart = (productId: string) => {
    setCart(prev => [...prev, productId]);
    toast({
      title: "Added to Cart",
      description: "Product has been added to your cart successfully!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
        <MarketplaceHeader cartCount={cart.length} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      <MarketplaceHeader cartCount={cart.length} />

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
      </div>
    </div>
  );
};

export default Marketplace;
