import { useState, useMemo, useEffect, useRef } from "react";
import { Nav, PhotographerCard, ChevronDown, CheckIcon, findDuplicateSpot } from "../components";
import { MapView } from "../components";
import { STYLES, BUDGETS, OCCASIONS } from "../data";
import { DEFAULT_LOCATION, haversineMiles } from "../lib/location";
import { useData } from "../lib/DataContext";

const chipBtn = {
  all: "unset", cursor: "default",
  padding: "5px 10px", borderRadius: 999,
  fontSize: 11.5, fontWeight: 500,
};
const rowBtn = {
  all: "unset", cursor: "default",
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "8px 12px", fontSize: 13, fontWeight: 500,
  borderRadius: 6,
};

function FilterDropdown({ label, badge, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        all: "unset", cursor: "default",
        padding: "6px 12px", border: "1px solid var(--line)",
        borderRadius: 999, fontSize: 13, fontWeight: 500,
        display: "flex", alignItems: "center", gap: 6,
        background: badge ? "color-mix(in oklab, var(--accent) 8%, var(--surface))" : "var(--surface)",
        color: "var(--text)",
      }}>
        <span>{label}</span>
        {badge && <span style={{
          padding: "1px 6px", background: "var(--accent)", color: "white",
          borderRadius: 999, fontSize: 11, fontWeight: 600, fontVariantNumeric: "tabular-nums",
        }}>{typeof badge === "number" ? badge : badge}</span>}
        <ChevronDown />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 10, boxShadow: "0 8px 24px -4px rgba(0,0,0,.12)",
          zIndex: 30,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

const VIEW_MODES = ["split", "list", "map"];

export function SearchPage({
  nav,
  openPhotographer,
  params = {},
  setParams,
  mapsApiKey,
  location = DEFAULT_LOCATION,
  geolocating = false,
  useMyLocation,
  searchLocation,
}) {
  const { photographers, spots } = useData();

  // The search box lives in Nav (header). It submits via onNav("search", {q,...}),
  // which lands the query in the URL — so we just read it back from params here.
  const q = params.q ?? "";

  const view = VIEW_MODES.includes(params.view) ? params.view : "split";
  const setView = (v) => setParams({ view: v === "split" ? null : v });

  // Filters are URL-encoded so a filtered result page is shareable.
  const filters = useMemo(() => ({
    styles: new Set(params.styles ? params.styles.split(",").filter(Boolean) : []),
    budget: params.budget || null,
    occasion: params.occasion || null,
    distance: Number(params.distance) || 25,
    rating: Number(params.rating) || 0,
    verified: params.verified === "1",
  }), [params.styles, params.budget, params.occasion, params.distance, params.rating, params.verified]);

  const [active, setActive] = useState(null);

  const setF = (patch) => {
    const next = { ...filters, ...patch };
    setParams({
      styles: next.styles.size ? [...next.styles].join(",") : null,
      budget: next.budget || null,
      occasion: next.occasion || null,
      distance: next.distance === 25 ? null : next.distance,
      rating: next.rating ? next.rating : null,
      verified: next.verified ? "1" : null,
    });
  };
  const toggleStyle = (s) => {
    const next = new Set(filters.styles);
    next.has(s) ? next.delete(s) : next.add(s);
    setF({ styles: next });
  };

  const terms = useMemo(() => {
    const noise = new Set(["photographer", "photographers", "photography", "photo", "photos", "in", "near", "the", "a", "for", "and", "with", "co"]);
    return q.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2 && !noise.has(t));
  }, [q]);

  // When the searched location is a specific place (park, POI, address —
  // not a city), try to resolve it to a LensHive spot: by Google place_id
  // first, then by proximity. A match switches the page into "tagged only"
  // mode: just photographers who published photos at that spot.
  const spotMatch = useMemo(() => {
    if (location.kind !== "specific") return null;
    return findDuplicateSpot(spots, location.placeId, location.lat, location.lng);
  }, [location.kind, location.placeId, location.lat, location.lng, spots]);

  // Coordinates of each spot, for measuring how far a photographer's
  // *portfolio* is from the searched area (vs. where they live).
  const spotCoords = useMemo(() => {
    const m = new Map();
    for (const s of spots) m.set(s.id, { lat: s.lat, lng: s.lng });
    return m;
  }, [spots]);

  const filtered = useMemo(() => {
    return photographers
      .map(p => {
        // Portfolio distance: the nearest spot they've shot at. Falls back to
        // their home base for photographers with no tagged spots yet.
        const spotDists = (p.spots || [])
          .map(slug => spotCoords.get(slug))
          .filter(Boolean)
          .map(c => haversineMiles(location, c));
        const portfolioDistance = spotDists.length
          ? Math.min(...spotDists)
          : haversineMiles(location, { lat: p.lat, lng: p.lng });
        return { ...p, distance: Math.round(portfolioDistance) };
      })
      .filter(p => {
        // Specific spot search → only photographers tagged to that spot.
        if (spotMatch && !(p.spots || []).includes(spotMatch.id)) return false;
        if (terms.length) {
          const haystack = [
            p.name, p.location, p.serviceArea || "",
            ...p.services, ...p.styles,
          ].join(" ").toLowerCase();
          if (!terms.some(t => haystack.includes(t))) return false;
        }
        if (filters.styles.size && !p.styles.some(s => filters.styles.has(s))) return false;
        if (filters.budget) {
          const b = BUDGETS.find(x => x.key === filters.budget);
          if (b && (p.startingPrice < b.min || p.startingPrice > b.max)) return false;
        }
        if (filters.occasion && !p.services.includes(filters.occasion)) return false;
        // The radius filter only applies to area searches; an exact spot
        // match already pins the location.
        if (!spotMatch && p.distance > filters.distance) return false;
        if (filters.rating && p.rating < filters.rating) return false;
        if (filters.verified && !p.trustSignals.includes("Verified")) return false;
        return true;
      })
      .sort((a, b) => a.distance - b.distance);
  }, [filters, terms, location, photographers, spotMatch, spotCoords]);

  const count = filtered.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Nav
        route="search"
        onNav={nav}
        compact
        query={q}
        location={location}
        geolocating={geolocating}
        useMyLocation={useMyLocation}
        searchLocation={searchLocation}
      />

      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "10px 28px", background: "var(--bg)",
        borderBottom: "1px solid var(--line)", flexShrink: 0,
      }}>
        <FilterDropdown label="Style" badge={filters.styles.size || null}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 12, width: 280 }}>
            {STYLES.map(s => (
              <button key={s} onClick={() => toggleStyle(s)} style={{
                ...chipBtn,
                background: filters.styles.has(s) ? "var(--accent)" : "var(--chip)",
                color: filters.styles.has(s) ? "white" : "var(--text)",
              }}>{s}</button>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Budget" badge={filters.budget ? BUDGETS.find(b => b.key === filters.budget)?.label : null}>
          <div style={{ padding: 8, width: 220, display: "flex", flexDirection: "column" }}>
            {BUDGETS.map(b => (
              <button key={b.key} onClick={() => setF({ budget: filters.budget === b.key ? null : b.key })}
                style={{ ...rowBtn, color: filters.budget === b.key ? "var(--accent)" : "var(--text)" }}>
                <span>{b.label}</span>
                {filters.budget === b.key && <CheckIcon />}
              </button>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Occasion" badge={filters.occasion}>
          <div style={{ padding: 8, width: 220, display: "flex", flexDirection: "column", maxHeight: 280, overflowY: "auto" }}>
            {OCCASIONS.map(o => (
              <button key={o} onClick={() => setF({ occasion: filters.occasion === o ? null : o })}
                style={{ ...rowBtn, color: filters.occasion === o ? "var(--accent)" : "var(--text)" }}>
                <span>{o}</span>
                {filters.occasion === o && <CheckIcon />}
              </button>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Distance" badge={`${filters.distance} mi`}>
          <div style={{ padding: 16, width: 240 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Within {filters.distance} miles</div>
            <input type="range" min="1" max="50" value={filters.distance}
              onChange={e => setF({ distance: +e.target.value })}
              style={{ width: "100%", accentColor: "var(--accent)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              <span>1 mi</span><span>50 mi</span>
            </div>
          </div>
        </FilterDropdown>

        <FilterDropdown label="Rating" badge={filters.rating ? `${filters.rating}+` : null}>
          <div style={{ padding: 8, width: 180, display: "flex", flexDirection: "column" }}>
            {[0, 4, 4.5, 5].map(r => (
              <button key={r} onClick={() => setF({ rating: r })}
                style={{ ...rowBtn, color: filters.rating === r ? "var(--accent)" : "var(--text)" }}>
                <span>{r === 0 ? "Any rating" : `${r} stars & up`}</span>
                {filters.rating === r && <CheckIcon />}
              </button>
            ))}
          </div>
        </FilterDropdown>

        <FilterDropdown label="Trust">
          <div style={{ padding: 8, width: 200, display: "flex", flexDirection: "column" }}>
            <button onClick={() => setF({ verified: !filters.verified })} style={rowBtn}>
              <span>Verified profile</span>
              {filters.verified && <CheckIcon />}
            </button>
          </div>
        </FilterDropdown>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", background: "var(--chip)", borderRadius: 6, padding: 2 }}>
          {[
            { k: "split", label: "Split" },
            { k: "list", label: "List" },
            { k: "map", label: "Map" },
          ].map(v => (
            <button key={v.k} onClick={() => setView(v.k)} style={{
              all: "unset", cursor: "default",
              padding: "5px 12px", fontSize: 12, fontWeight: 600,
              borderRadius: 4,
              background: view === v.k ? "var(--bg)" : "transparent",
              color: view === v.k ? "var(--text)" : "var(--muted)",
              boxShadow: view === v.k ? "0 1px 2px rgba(0,0,0,.06)" : "none",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        padding: "16px 28px 12px", flexShrink: 0,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-.015em" }}>
            {spotMatch
              ? `${count} photographers who shot at ${spotMatch.name}`
              : `${count} photographers near ${location.label}`}
          </h1>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>
            {spotMatch
              ? <>Only photographers with photos tagged to this spot{q ? <> · matching <span style={{ color: "var(--text)" }}>"{q}"</span></> : null}</>
              : location.kind === "specific"
                ? <>This exact place isn't a LensHive spot yet — showing photographers with portfolios nearby{q ? <> for <span style={{ color: "var(--text)" }}>"{q}"</span></> : null}.</>
                : <>Showing results for <span style={{ color: "var(--text)" }}>"{q}"</span></>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
          <span>Sort by:</span>
          <button style={{
            all: "unset", cursor: "default",
            padding: "6px 12px", border: "1px solid var(--line)",
            borderRadius: 6, fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--surface)",
          }}>Best match <ChevronDown /></button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 16, padding: "0 28px 16px", minHeight: 0 }}>
        {(view === "split" || view === "list") && (
          <div style={{
            flex: view === "list" ? 1 : "0 0 480px",
            overflowY: "auto", paddingRight: 4,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                {spotMatch
                  ? `No photographers have published photos at ${spotMatch.name} yet.`
                  : "No photographers match these filters."}
              </div>
            ) : view === "list" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {filtered.map(p => (
                  <PhotographerCard key={p.id} p={p} onOpen={openPhotographer}
                    active={active === p.id} />
                ))}
              </div>
            ) : (
              filtered.map(p => (
                <PhotographerCard key={p.id} p={p} onOpen={openPhotographer}
                  active={active === p.id} />
              ))
            )}
          </div>
        )}
        {(view === "split" || view === "map") && (
          <div style={{ flex: 1, position: "sticky", top: 0, minHeight: 480 }}>
            <MapView
              items={filtered.map(p => ({ ...p }))}
              activeId={active}
              onSelectItem={(id, open) => {
                setActive(id);
                if (open) openPhotographer(id);
              }}
              kind="photographer"
              height="100%"
              style="standard"
              apiKey={mapsApiKey}
              center={location}
            />
          </div>
        )}
      </div>
    </div>
  );
}
