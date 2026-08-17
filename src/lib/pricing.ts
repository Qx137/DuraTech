import { haversineDistanceKm } from "@/utils/distanceCalculator";

/**
 * Calculates the Haversine distance between two points in km
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  return haversineDistanceKm(lat1, lon1, lat2, lon2);
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

/**
 * Formats a numeric amount as a USD price string, e.g. 12.5 -> "$12.50".
 */
export const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`;
