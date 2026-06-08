import { API_BASE } from "./location";

export async function fetchPhotographers() {
  const r = await fetch(`${API_BASE}/api/photographers`);
  if (!r.ok) throw new Error("Failed to load photographers");
  return r.json();
}

export async function fetchSpots() {
  const r = await fetch(`${API_BASE}/api/spots`);
  if (!r.ok) throw new Error("Failed to load spots");
  return r.json();
}

export async function fetchPhotographer(slug) {
  const r = await fetch(`${API_BASE}/api/photographers/${slug}`);
  if (!r.ok) throw new Error("Photographer not found");
  return r.json();
}

export async function fetchSpot(slug) {
  const r = await fetch(`${API_BASE}/api/spots/${slug}`);
  if (!r.ok) throw new Error("Spot not found");
  return r.json();
}
