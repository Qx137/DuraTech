import { SearchX } from "lucide-react";

const NoProductsFound = () => {
  return (
    <div className="text-center py-20">
      <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No products found</h3>
      <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
    </div>
  );
};

export default NoProductsFound;
