
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

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
  totalProductsCount
}: SearchFiltersProps) => {
  return (
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
          Showing {filteredProductsCount} of {totalProductsCount} products
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
