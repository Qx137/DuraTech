
/**
 * Calculates the Haversine distance between two points in km
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d;
};

/**
 * Calculates recommended minimum price
 * @param distanceKm distance in km
 * @param multiplier vehicle type multiplier
 * @returns minimum recommended price in USD
 */
export const calculateMinPrice = (distanceKm: number, multiplier: number): number => {
  const BASE_RATE = 2.50; // Base rate per KM
  const FLAT_FEE = 15.00; // Flat fee for management/processing
  
  const price = (distanceKm * BASE_RATE * multiplier) + FLAT_FEE;
  
  // Return rounded to 2 decimal places, with a floor of $2
  return Math.max(2, Math.round(price * 100) / 100);
};
