// Where the NGO map starts if the browser can't give us a location (denied, unsupported, timeout).
// Same city as the seed data (server/scripts/seed.js CENTER). Change both to your own city.
export const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567, label: 'Pune' };

// Convert degrees to radians (the maths below needs radians).
const toRadians = (degrees) => (degrees * Math.PI) / 180;

// Haversine formula: straight-line distance in km between two points on Earth.
// Docs: https://en.wikipedia.org/wiki/Haversine_formula
export function distanceKm(lat1, lng1, lat2, lng2) {
  const EARTH_RADIUS_KM = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// THE ONE PLACE where we swap order. MongoDB stores [lng, lat]; Leaflet wants [lat, lng].
export function listingLatLng(listing) {
  const [lng, lat] = listing.location.coordinates;
  return [lat, lng];
}

// Friendly text: "450 m" or "3.2 km"
export function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
