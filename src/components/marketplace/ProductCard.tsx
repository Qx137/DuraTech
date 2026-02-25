
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ShoppingBag, CheckCircle2 } from "lucide-react";

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
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden">
      <div className="relative h-36 overflow-hidden">
        <img 
          src={product.image || "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop"} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {product.organic && (
          <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs">
            Organic
          </Badge>
        )}
      </div>
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold line-clamp-1" title={product.name}>{product.name}</CardTitle>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{product.rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        <CardDescription>{product.description || 'Fresh, quality produce'}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="flex items-center">
              {product.farmer}
              {product.kycStatus === 'verified' && (
                <CheckCircle2 className="h-3 w-3 ml-1 text-blue-500 fill-blue-50" />
              )}
            </span>
            {product.distance ? ` • ${product.distance.toFixed(1)} km away` : ''}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-green-600">${product.price}</span>
              <span className="text-gray-500 ml-1">{product.unit}</span>
            </div>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs"
              onClick={onAddToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
