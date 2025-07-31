
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import SearchFilters from "@/components/marketplace/SearchFilters";
import AIRecommendationsBanner from "@/components/marketplace/AIRecommendationsBanner";
import ProductCard from "@/components/marketplace/ProductCard";
import NoProductsFound from "@/components/marketplace/NoProductsFound";
import { products, Product } from "@/data/sampleProducts";

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const { toast } = useToast();

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
