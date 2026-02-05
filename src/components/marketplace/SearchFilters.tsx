
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  organicOnly: boolean;
  setOrganicOnly: (organic: boolean) => void;
  categories: string[];
  filteredProductsCount: number;
  totalProductsCount: number;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  minQuantity: string;
  setMinQuantity: (quantity: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  organicOnly,
  setOrganicOnly,
  categories,
  filteredProductsCount,
  totalProductsCount,
  priceRange,
  setPriceRange,
  minQuantity,
  setMinQuantity,
  sortBy,
  setSortBy
}: SearchFiltersProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Fresh Produce Marketplace</h1>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Sort by: Relevance</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-4 gap-6 items-end">
          {/* Price Range */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <Slider
              defaultValue={[0, 100]}
              max={100}
              step={1}
              value={priceRange}
              onValueChange={setPriceRange}
              className="py-4"
            />
          </div>

          {/* Min Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Min. Quantity
            </label>
            <Input
              type="number"
              min="0"
              placeholder="Min Stock"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              variant={organicOnly ? "default" : "outline"}
              onClick={() => setOrganicOnly(!organicOnly)}
              className={organicOnly ? "bg-green-600 hover:bg-green-700 w-full" : "w-full"}
            >
              <Filter className="h-4 w-4 mr-2" />
              Organic Only
            </Button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProductsCount} of {totalProductsCount} products
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
