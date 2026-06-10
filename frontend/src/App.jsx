import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminDashboardPage, AuthPage, DashboardPage, ForgotPasswordPage, HomePage, OnboardingPage, ProfilePage, SearchPage, SpotPage, UserDashboardPage } from "./pages";
import { API_BASE, DEFAULT_LOCATION, geocodeAddress, geocodePlaceId, getBrowserPosition, isBroadPlace, reverseGeocode } from "./lib/location";
import { DataProvider } from "./lib/DataContext";
import { AuthProvider, useAuth } from "./lib/AuthContext";

// Picks the right dashboard for the signed-in user's role. Admins get the
// admin dashboard (location management + suggestion review); creators
// (photographers/videographers) get the creator dashboard; regular users
// get the booking-side dashboard. Anyone not signed in gets bounced to /login.
function DashboardRoute(props) {
  const { me, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!me) props.nav("login");
    // First sign-in → role-specific onboarding questionnaire (admins skip).
    else if (!me.onboarded) props.nav("onboarding");
  }, [loading, me, props]);
  if (loading || !me || !me.onboarded) return null;
  if (me.role === "admin") return <AdminDashboardPage {...props} />;
  const isCreator = me.role === "photographer" || me.role === "videographer";
  return isCreator ? <DashboardPage {...props} /> : <UserDashboardPage {...props} />;
}

// Path segments owned by the route name itself (everything after `?` is open-ended
// page-state, exposed via the `params` prop / setParams helper).
function routePath(route) {
  switch (route.name) {
    case "home": return "/";
    case "login": return "/login";
    case "signup": return "/signup";
    case "forgot": return "/forgot";
    case "onboarding": return "/onboarding";
    case "dashboard": return "/dashboard";
    case "spot": return `/spot/${encodeURIComponent(route.spotId || "")}`;
    case "profile": return `/profile/${encodeURIComponent(route.photographerId || "")}`;
    case "search": return "/search";
    default: return "/";
  }
}

function routeToHref(route) {
  const path = routePath(route);
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(route.params || {})) {
    if (v == null || v === "") continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

function pathToRoute(pathname, search) {
  const sp = new URLSearchParams(search || "");
  const params = {};
  for (const [k, v] of sp.entries()) params[k] = v;

  const make = (name, extra = {}) => ({ name, params, ...extra });

  if (pathname === "/" || pathname === "") return make("home");
  if (pathname === "/login") return make("login");
  if (pathname === "/signup") return make("signup");
  if (pathname === "/forgot") return make("forgot");
  if (pathname === "/onboarding") return make("onboarding");
  if (pathname === "/dashboard") return make("dashboard");
  if (pathname === "/search") return make("search");
  const spotMatch = pathname.match(/^\/spot\/([^/]+)\/?$/);
  if (spotMatch) return make("spot", { spotId: decodeURIComponent(spotMatch[1]) });
  const profileMatch = pathname.match(/^\/profile\/([^/]+)\/?$/);
  if (profileMatch) return make("profile", { photographerId: decodeURIComponent(profileMatch[1]) });
  return make("home");
}

function AppShell() {
  const [route, setRoute] = useState(() =>
    typeof window !== "undefined"
      ? pathToRoute(window.location.pathname, window.location.search)
      : { name: "home", params: {} }
  );

  // Sync browser back/forward with route state.
  useEffect(() => {
    const onPop = () => {
      setRoute(pathToRoute(window.location.pathname, window.location.search));
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const [mapsApiKey, setMapsApiKey] = useState("");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [geolocating, setGeolocating] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/config`)
      .then(r => r.json())
      .then(d => setMapsApiKey(d.mapsApiKey || ""))
      .catch(() => {});
  }, []);

  const useMyLocation = useCallback(async () => {
    setGeolocating(true);
    try {
      const pos = await getBrowserPosition();
      const place = await reverseGeocode(pos.lat, pos.lng);
      // isMine === true so MapView renders the blue "you are here" dot.
      // kind "broad" — "around me" always means nearby portfolios, never a spot lookup.
      setLocation({ label: place.label, lat: place.lat, lng: place.lng, isMine: true, kind: "broad" });
      return true;
    } catch {
      return false;
    } finally {
      setGeolocating(false);
    }
  }, []);

  useEffect(() => {
    useMyLocation();
  }, [useMyLocation]);

  // Set the active search location. Two call shapes:
  //   searchLocation("chautauqua park")
  //     → free-text submit. Geocodes the text and keeps the typed text as the
  //       label so it isn't auto-corrected to "Boulder, CO".
  //   searchLocation({ placeId, label })
  //     → user picked an autocomplete suggestion. Resolves the place_id for
  //       coordinates and uses the suggestion's main text as the label.
  const searchLocation = useCallback(async (input) => {
    if (!input) return;
    try {
      let place, label;
      if (typeof input === "string") {
        const text = input.trim();
        if (!text) return;
        place = await geocodeAddress(text);
        label = text; // preserve what the user typed
      } else {
        const { placeId, label: chosen } = input;
        if (!placeId) return;
        place = await geocodePlaceId(placeId);
        label = chosen || place.label;
      }
      // isMine === false → the map renders a red search-result pin instead of the blue GPS dot.
      // kind tells SearchPage whether to do a spot lookup (specific place) or
      // show photographers with nearby portfolios (city/area search).
      setLocation({
        label,
        lat: place.lat,
        lng: place.lng,
        isMine: false,
        kind: isBroadPlace(place.types) ? "broad" : "specific",
        placeId: place.placeId || null,
      });
    } catch {
      /* leave current location unchanged on failure */
    }
  }, []);

  // Push a URL change without re-reading window.location, so `route` is the source of truth.
  const pushRoute = useCallback((next, { replace = false } = {}) => {
    const href = routeToHref(next);
    const current = window.location.pathname + window.location.search;
    if (href !== current) {
      if (replace) window.history.replaceState({}, "", href);
      else window.history.pushState({}, "", href);
    }
    setRoute(next);
  }, []);

  // Navigate to a new page. Clears query params unless `params` is passed in `extra`.
  const nav = useCallback((name, payload, extra) => {
    let next;
    if (name === "spot") {
      next = { name: "spot", spotId: typeof payload === "string" ? payload : "chautauqua" };
    } else if (name === "profile") {
      next = { name: "profile", photographerId: payload };
    } else if (name === "search") {
      // Back-compat: payload can carry initial query/kind, which become URL params.
      const p = { ...(extra?.params || {}) };
      if (payload?.q != null) p.q = payload.q;
      if (payload?.kind != null) p.kind = payload.kind;
      next = { name: "search", params: p };
    } else {
      next = { name };
    }
    next.params = next.params || extra?.params || {};
    pushRoute(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pushRoute]);

  // Patch URL query params on the current page without changing the page itself.
  // Pass `null`/`undefined` for a value to remove that key.
  const setParams = useCallback((patch, { replace = false } = {}) => {
    setRoute(prev => {
      const merged = { ...(prev.params || {}) };
      for (const [k, v] of Object.entries(patch || {})) {
        if (v == null || v === "") delete merged[k];
        else merged[k] = String(v);
      }
      const next = { ...prev, params: merged };
      const href = routeToHref(next);
      const current = window.location.pathname + window.location.search;
      if (href !== current) {
        if (replace) window.history.replaceState({}, "", href);
        else window.history.pushState({}, "", href);
      }
      return next;
    });
  }, []);

  const openSpot = (id) => nav("spot", id);
  const openPhotographer = (id) => nav("profile", id);

  const locationProps = { location, geolocating, useMyLocation, searchLocation };
  const params = useMemo(() => route.params || {}, [route.params]);
  const routeProps = { nav, params, setParams };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {route.name === "home" && <HomePage {...routeProps} openSpot={openSpot} openPhotographer={openPhotographer} />}
      {route.name === "search" && <SearchPage {...routeProps} openPhotographer={openPhotographer} mapsApiKey={mapsApiKey} {...locationProps} />}
      {route.name === "spot" && <SpotPage {...routeProps} spotId={route.spotId} openPhotographer={openPhotographer} mapsApiKey={mapsApiKey} />}
      {route.name === "profile" && <ProfilePage {...routeProps} photographerId={route.photographerId} openSpot={openSpot} />}
      {route.name === "dashboard" && <DashboardRoute {...routeProps} openPhotographer={openPhotographer} openSpot={openSpot} />}
      {/* Single AuthPage instance for both /login and /signup so the slide
          animation runs on state change (instead of remounting per route). */}
      {(route.name === "login" || route.name === "signup") && (
        <AuthPage {...routeProps} initialMode={route.name === "signup" ? "signup" : "signin"} />
      )}
      {route.name === "forgot" && <ForgotPasswordPage {...routeProps} />}
      {route.name === "onboarding" && <OnboardingPage {...routeProps} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppShell />
      </DataProvider>
    </AuthProvider>
  );
}
