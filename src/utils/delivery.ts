import { haversineDistanceKm } from "@/utils/distanceCalculator";

/**
 * Formats a JSON address structure into a readable string.
 * @param address The address object from Supabase (Json)
 * @returns A formatted address string
 */
export const formatAddress = (address: any): string => {
    if (!address) return 'Address not available';

    // Handle case where address might be a string (though it should be Json/Object)
    if (typeof address === 'string') return address;

    const parts = [];

    if (address.street) parts.push(address.street);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);

    return parts.length > 0 ? parts.join(', ') : 'Address location';
};

/**
 * Calculates a simple ETA string based on distance and average speed.
 * @param distanceKm Distance in kilometers
 * @param averageSpeedKmh Average speed in km/h (default 30 for city driving)
 * @returns ETA string
 */
export const calculateETA = (distanceKm: number | null, averageSpeedKmh = 30): string => {
    if (distanceKm === null || distanceKm <= 0) return 'Calculating...';

    const hours = distanceKm / averageSpeedKmh;
    const minutes = Math.round(hours * 60);

    if (minutes < 1) return 'Arriving soon';
    if (minutes < 60) return `${minutes} min`;

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Calculates distance between two points using the Haversine formula.
 * @returns Distance in km
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return haversineDistanceKm(lat1, lon1, lat2, lon2);
};

/**
 * Calculates a base price based on distance.
 * @param distanceKm Distance in km
 * @returns Estimated price
 */
export const calculatePrice = (distanceKm: number): number => {
    const baseFare = 5.0;
    const perKm = 1.5;
    return parseFloat((baseFare + (distanceKm * perKm)).toFixed(2));
};
