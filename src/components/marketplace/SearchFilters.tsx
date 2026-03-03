import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

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
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  organicOnly,
  setOrganicOnly,
  filteredProductsCount,
  totalProductsCount,
  priceRange,
  setPriceRange,
  minQuantity,
  setMinQuantity,
  sortBy,
  setSortBy,
  showFilters,
  setShowFilters
}: SearchFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Main search bar - Airbnb-style prominent */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search fresh produce, farmers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 pr-12 h-14 rounded-2xl border-border bg-card text-base shadow-sm focus-visible:ring-primary placeholder:text-muted-foreground/60"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl ${
            showFilters ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setOrganicOnly(!organicOnly)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              organicOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground border border-border hover:border-primary/40"
            }`}
          >
            🌿 Organic
          </button>
          <span className="text-xs text-muted-foreground ml-2">
            {filteredProductsCount} of {totalProductsCount} products
          </span>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] h-9 rounded-xl text-xs border-border">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="distance">Nearest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-foreground">Filters</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Min Price</label>
              <Input
                type="number"
                min="0"
                placeholder="$0"
                value={priceRange[0] || ''}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Max Price</label>
              <Input
                type="number"
                min="0"
                placeholder="$100"
                value={priceRange[1] || ''}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Min Stock</label>
              <Input
                type="number"
                min="0"
                placeholder="Any"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
