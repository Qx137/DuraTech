
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, MapPin, Leaf, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

// Sample product data
const products = [
  {
    id: 1,
    name: "Organic Tomatoes",
    price: 4.99,
    unit: "per lb",
    farmer: "Green Valley Farm",
    location: "California, USA",
    rating: 4.8,
    image: "🍅",
    category: "Vegetables",
    organic: true,
    description: "Fresh, juicy organic tomatoes perfect for salads and cooking"
  },
  {
    id: 2,
    name: "Fresh Apples",
    price: 3.99,
    unit: "per lb",
    farmer: "Sunset Orchards",
    location: "Washington, USA",
    rating: 4.9,
    image: "🍎",
    category: "Fruits",
    organic: false,
    description: "Crisp and sweet apples, perfect for snacking"
  },
  {
    id: 3,
    name: "Organic Spinach",
    price: 2.99,
    unit: "per bunch",
    farmer: "Healthy Greens Co",
    location: "Oregon, USA",
    rating: 4.7,
    image: "🥬",
    category: "Vegetables",
    organic: true,
    description: "Nutrient-rich organic spinach, freshly harvested"
  },
  {
    id: 4,
    name: "Farm Fresh Eggs",
    price: 5.99,
    unit: "per dozen",
    farmer: "Happy Hen Farm",
    location: "Texas, USA",
    rating: 4.9,
    image: "🥚",
    category: "Dairy & Eggs",
    organic: true,
    description: "Free-range organic eggs from happy hens"
  },
  {
    id: 5,
    name: "Sweet Corn",
    price: 1.99,
    unit: "per ear",
    farmer: "Corn Field Farms",
    location: "Iowa, USA",
    rating: 4.6,
    image: "🌽",
    category: "Vegetables",
    organic: false,
    description: "Sweet and tender corn, perfect for grilling"
  },
  {
    id: 6,
    name: "Organic Strawberries",
    price: 6.99,
    unit: "per pint",
    farmer: "Berry Delicious Farm",
    location: "Florida, USA",
    rating: 4.8,
    image: "🍓",
    category: "Fruits",
    organic: true,
    description: "Sweet, juicy organic strawberries"
  }
];

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [organicOnly, setOrganicOnly] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.farmer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesOrganic = !organicOnly || product.organic;
    
    return matchesSearch && matchesCategory && matchesOrganic;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800">AgriMarket</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/marketplace" className="text-green-600 font-medium">
              Marketplace
            </Link>
            <Link to="/ai-tools" className="text-gray-700 hover:text-green-600 transition-colors">
              AI Tools
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Cart (0)
            </Button>
            <Link to="/login">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Fresh Produce Marketplace</h1>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products or farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant={organicOnly ? "default" : "outline"}
                onClick={() => setOrganicOnly(!organicOnly)}
                className={organicOnly ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Organic Only
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>

        {/* AI Recommendations Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🤖 AI Recommendations for You</h3>
              <p className="opacity-90">Based on seasonal trends and your location, we recommend fresh corn and tomatoes!</p>
            </div>
            <Link to="/ai-tools">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-purple-600">
                View AI Tools
              </Button>
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="text-4xl mb-2">{product.image}</div>
                  <div className="flex flex-col items-end space-y-1">
                    {product.organic && (
                      <Badge className="bg-green-100 text-green-800 text-xs">Organic</Badge>
                    )}
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{product.rating}</span>
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {product.farmer} • {product.location}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-600">${product.price}</span>
                      <span className="text-gray-500 ml-1">{product.unit}</span>
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
