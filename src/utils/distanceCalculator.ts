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
export function calculateDistance(from: Location, to: Location): number {
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
 * Get seller locations for products (mock data - replace with actual seller data)
 */
export function getSellerLocation(sellerId: string): Location {
  // This would normally fetch from your database
  // For now, returning mock locations
  const mockSellerLocations: Record<string, Location> = {
    'seller1': { lat: 40.7128, lng: -74.0060 }, // New York
    'seller2': { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    'seller3': { lat: 41.8781, lng: -87.6298 }, // Chicago
  };
  
  return mockSellerLocations[sellerId] || { lat: 40.7128, lng: -74.0060 };
}

/**
 * Calculate total shipping for multiple products from different sellers
 */
export function calculateTotalShipping(
  cartItems: any[],
  deliveryLocation: Location
): { totalShipping: number; details: Array<{ sellerId: string; distance: number; price: number; }> } {
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
  
  // Calculate shipping for each seller
  sellerGroups.forEach((items, sellerId) => {
    const sellerLocation = getSellerLocation(sellerId);
    const distance = calculateDistance(sellerLocation, deliveryLocation);
    const price = calculateShippingPrice(distance);
    
    details.push({ sellerId, distance, price });
    totalShipping += price;
  });
  
  return { totalShipping, details };
}