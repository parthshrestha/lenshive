import { API_BASE } from "./location";
import { getIdToken } from "./auth";

// Fetch wrapper for endpoints that need the Cognito ID token (admin +
// suggestion routes). Throws with the backend's `detail` message on failure.
async function authedFetch(path, { method = "GET", body } = {}) {
  const token = await getIdToken();
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (r.status === 204) return null;
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.detail || `Request failed (${r.status})`);
  return data;
}

// --- Admin: location (spot) management ---
export const adminCreateSpot = (spot) => authedFetch("/api/admin/spots", { method: "POST", body: spot });
export const adminUpdateSpot = (slug, patch) => authedFetch(`/api/admin/spots/${encodeURIComponent(slug)}`, { method: "PUT", body: patch });
export const adminDeleteSpot = (slug) => authedFetch(`/api/admin/spots/${encodeURIComponent(slug)}`, { method: "DELETE" });

// --- Onboarding questionnaire (role-specific answers stored on the user) ---
export const submitOnboarding = (answers) => authedFetch("/api/me/onboarding", { method: "POST", body: { answers } });

// --- Stripe Connect verification (photographers) ---
export const stripeConnectStart = () => authedFetch("/api/stripe/connect/start", { method: "POST" });
export const stripeConnectStatus = () => authedFetch("/api/stripe/connect/status");

// --- Creators (photographers/videographers) can add new spots ---
export const createSpot = (spot) => authedFetch("/api/spots", { method: "POST", body: spot });

// --- Suggestions: users submit, admins review ---
export const submitSuggestion = (suggestion) => authedFetch("/api/suggestions", { method: "POST", body: suggestion });
export const fetchMySuggestions = () => authedFetch("/api/suggestions/mine");
export const adminListSuggestions = () => authedFetch("/api/admin/suggestions");
export const adminSetSuggestionStatus = (id, status) => authedFetch(`/api/admin/suggestions/${id}`, { method: "PATCH", body: { status } });

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
