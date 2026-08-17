import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

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
  distance?: number;
  kycStatus?: 'none' | 'pending' | 'verified' | 'rejected';
}

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const reviewCount = Math.floor((product.rating || 0) * 7 + 3);

  return (
    <Card className="group overflow-hidden border border-border bg-card rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image || "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.organic && (
            <Badge className="bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-0.5 backdrop-blur-sm">
              Organic
            </Badge>
          )}
        </div>
        {product.kycStatus === 'verified' && (
          <div className="absolute top-3 right-3">
            <div className="bg-[hsl(var(--badge-verified))]/90 backdrop-blur-sm text-white rounded-full p-1.5" title="Verified Seller">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Title & farmer */}
        <div>
          <h3 className="font-semibold text-foreground text-[15px] leading-tight line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {product.farmer}
            {product.kycStatus === 'verified' && (
              <CheckCircle2 className="h-3 w-3 text-[hsl(var(--badge-verified))]" />
            )}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            <Star className="h-3.5 w-3.5 text-[hsl(var(--star-yellow))] fill-[hsl(var(--star-yellow))]" />
          </div>
          <span className="text-xs font-medium text-foreground">
            {product.rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-xs text-muted-foreground">
            ({reviewCount})
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-auto pt-2">
          <div>
            <span className="text-lg font-bold text-foreground">{formatCurrency(product.price)}</span>
            <span className="text-xs text-muted-foreground ml-1">/{product.unit}</span>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm"
          >
            <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
