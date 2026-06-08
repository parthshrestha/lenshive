export const API_BASE = "http://localhost:8000";

// Boulder, CO — used as the fallback when geolocation is denied/unavailable.
export const DEFAULT_LOCATION = { label: "Boulder, CO", lat: 40.01499, lng: -105.27055 };

export function haversineMiles(a, b) {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getBrowserPosition(options = { timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      options,
    );
  });
}

export async function geocodeAddress(address) {
  const r = await fetch(`${API_BASE}/api/geocode?address=${encodeURIComponent(address)}`);
  if (!r.ok) throw new Error("Geocode failed");
  return r.json(); // { lat, lng, label, formatted }
}

// Resolve a Google place_id (returned by placesAutocomplete) to coordinates.
export async function geocodePlaceId(placeId) {
  const r = await fetch(`${API_BASE}/api/geocode?place_id=${encodeURIComponent(placeId)}`);
  if (!r.ok) throw new Error("Place lookup failed");
  return r.json();
}

// Autocomplete predictions for a location query. `near` biases results around
// the user's current location so e.g. "chautauqua park" prefers the Boulder one.
export async function placesAutocomplete(input, near) {
  const params = new URLSearchParams({ input });
  if (near?.lat != null && near?.lng != null) {
    params.set("lat", String(near.lat));
    params.set("lng", String(near.lng));
  }
  const r = await fetch(`${API_BASE}/api/places-autocomplete?${params.toString()}`);
  if (!r.ok) return [];
  return r.json(); // [{ placeId, description, mainText, secondaryText }]
}

export async function reverseGeocode(lat, lng) {
  const r = await fetch(`${API_BASE}/api/reverse-geocode?lat=${lat}&lng=${lng}`);
  if (!r.ok) throw new Error("Reverse geocode failed");
  return r.json(); // { lat, lng, label, formatted }
}
