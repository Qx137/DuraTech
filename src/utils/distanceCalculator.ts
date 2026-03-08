// Distance calculation utilities similar to InDrive pricing

export interface Location {
  lat: number;
  lng: number;
}

export interface PricingConfig {
  basePrice: number;
  pricePerKm: number;
  minimumPrice: number;
  maximumPrice: number;
}

// Default pricing similar to InDrive
const DEFAULT_PRICING: PricingConfig = {
  basePrice: 2.50,
  pricePerKm: 1.20,
  minimumPrice: 3.00,
  maximumPrice: 25.00
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export async function calculateDistance(from: Location, to: Location): Promise<number> {
  return calculateDistanceFallback(from, to);
}

/**
 * Fallback: Calculate straight-line distance using Haversine formula
 */
function calculateDistanceFallback(from: Location, to: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

/**
 * Calculate shipping price based on distance
 */
export function calculateShippingPrice(
  distance: number, 
  config: PricingConfig = DEFAULT_PRICING
): number {
  const price = config.basePrice + (distance * config.pricePerKm);
  return Math.max(config.minimumPrice, Math.min(config.maximumPrice, price));
}

/**
 * Get seller location from product data
 */
export function getSellerLocationFromProduct(product: any): Location {
  // Use the pickup coordinates if available, otherwise fallback to default location
  if (product.pickup_latitude && product.pickup_longitude) {
    return {
      lat: Number(product.pickup_latitude),
      lng: Number(product.pickup_longitude)
    };
  }
  
  // Fallback to a default location if no coordinates are set
  return { lat: -17.8292, lng: 31.0522 }; // Harare as default
}

/**
 * Calculate total shipping for multiple products from different sellers
 */
export async function calculateTotalShipping(
  cartItems: any[],
  deliveryLocation: Location
): Promise<{ totalShipping: number; details: Array<{ sellerId: string; distance: number; price: number; }> }> {
  const sellerGroups = new Map<string, any[]>();
  
  // Group items by seller
  cartItems.forEach(item => {
    const sellerId = item.products.seller_id;
    if (!sellerGroups.has(sellerId)) {
      sellerGroups.set(sellerId, []);
    }
    sellerGroups.get(sellerId)!.push(item);
  });
  
  const details: Array<{ sellerId: string; distance: number; price: number; }> = [];
  let totalShipping = 0;
  
  // Calculate shipping for each seller (in parallel for efficiency)
  const promises = Array.from(sellerGroups.entries()).map(async ([sellerId, items]) => {
    // Use the first product in the group to get seller location
    const product = items[0].products;
    const sellerLocation = getSellerLocationFromProduct(product);
    const distance = await calculateDistance(sellerLocation, deliveryLocation);
    const price = calculateShippingPrice(distance);
    
    return { sellerId, distance, price };
  });
  
  const results = await Promise.all(promises);
  
  results.forEach(result => {
    details.push(result);
    totalShipping += result.price;
  });
  
  return { totalShipping, details };
}