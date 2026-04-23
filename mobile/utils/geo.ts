/**
 * Calculates the Haversine distance between two geographic coordinates.
 * @param coordA - First coordinate with lat/lng in decimal degrees
 * @param coordB - Second coordinate with lat/lng in decimal degrees
 * @returns Object with distanceMeters and distanceMiles
 */
export function calculateDistance(
  coordA: { lat: number; lng: number },
  coordB: { lat: number; lng: number }
): { distanceMeters: number; distanceMiles: number } {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRad(coordB.lat - coordA.lat);
  const dLng = toRad(coordB.lng - coordA.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coordA.lat)) *
      Math.cos(toRad(coordB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = earthRadiusMeters * c;
  return {
    distanceMeters,
    distanceMiles: distanceMeters / 1609.344,
  };
}
