import { useEffect, useRef, useState } from "react";
import { SearchIcon, PinIcon } from "./ui";
import { geocodePlaceId, haversineMiles, placesAutocomplete } from "../lib/location";

// Same threshold the backend uses (crud.DUPLICATE_RADIUS_MILES) so the UI
// catches duplicates before submit instead of surfacing a 409.
const DUPLICATE_RADIUS_MILES = 0.12;

export function findDuplicateSpot(spots, placeId, lat, lng) {
  if (placeId) {
    const byId = spots.find(s => s.placeId && s.placeId === placeId);
    if (byId) return byId;
  }
  if (lat == null || lng == null) return null;
  return spots.find(s => haversineMiles({ lat, lng }, { lat: s.lat, lng: s.lng }) <= DUPLICATE_RADIUS_MILES) || null;
}

// Google Places autocomplete input for picking a physical location.
// On selection, resolves the place to coordinates and reports back via
// onSelect({ name, city, formatted, lat, lng, placeId }, duplicateSpot|null).
// `spots` is the existing catalog used for duplicate detection; `near`
// biases predictions around the current map location.
export function LocationPicker({ spots = [], near, onSelect, placeholder = "Search for a place…" }) {
  const [text, setText] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) { setPredictions([]); return; }
    const handle = setTimeout(async () => {
      try {
        setPredictions(await placesAutocomplete(q, near));
      } catch {
        setPredictions([]);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [text, near]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const pick = async (p) => {
    setOpen(false);
    setPredictions([]);
    setText(p.mainText || p.description || "");
    setResolving(true);
    try {
      const place = await geocodePlaceId(p.placeId);
      const picked = {
        name: p.mainText || p.description || "",
        city: place.label || p.secondaryText || "",
        formatted: place.formatted || p.description || "",
        lat: place.lat,
        lng: place.lng,
        placeId: p.placeId,
      };
      onSelect(picked, findDuplicateSpot(spots, p.placeId, place.lat, place.lng));
    } catch {
      onSelect(null, null);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 11px", borderRadius: 9,
        border: "1px solid var(--line)", background: "var(--bg)",
      }}>
        <SearchIcon size={14} />
        <input
          value={text}
          onChange={e => { setText(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1, minWidth: 0, border: "none", outline: "none",
            background: "transparent", color: "var(--text)", fontSize: 13.5,
          }}
        />
        {resolving && <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Locating…</span>}
      </div>

      {open && predictions.length > 0 && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", zIndex: 60,
          overflow: "hidden", borderRadius: 10, border: "1px solid var(--line)",
          background: "var(--surface)", boxShadow: "0 18px 44px rgba(20,16,8,.18)",
        }}>
          {predictions.map(p => (
            <button
              key={p.placeId}
              onMouseDown={e => e.preventDefault()}
              onClick={() => pick(p)}
              style={{
                all: "unset", cursor: "default", boxSizing: "border-box",
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "9px 12px", borderBottom: "1px solid var(--line)",
              }}
            >
              <PinIcon size={12} color="var(--muted)" />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.mainText || p.description}
                </span>
                {p.secondaryText && (
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.secondaryText}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
