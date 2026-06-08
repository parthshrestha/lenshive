import { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { Img, Stars } from "./ui.jsx";

const mapBtn = {
  all: "unset", cursor: "default",
  width: 28, height: 28, display: "grid", placeItems: "center",
  background: "white", borderRadius: 6,
  boxShadow: "0 1px 3px rgba(0,0,0,.18)",
  fontSize: 14, fontWeight: 500, color: "#333",
};

// Warm, minimal light style to match the LensHive palette.
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f1efe8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7e7666" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#faf8f3" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#cfe2c1" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dcd6c5" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#a8c9e0" }] },
];

function PinTail({ active, color }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" style={{ display: "block", margin: "0 auto", marginTop: -1 }}>
      <path d="M0 0 L5 6 L10 0 Z" fill={color || (active ? "var(--accent)" : "var(--text)")} />
    </svg>
  );
}

function PinContent({ kind, item, active }) {
  if (kind === "spot") {
    return (
      <div style={{ transform: `scale(${active ? 1.1 : 1})`, transition: "transform .15s" }}>
        <div style={{
          background: active ? "var(--accent)" : "var(--text)",
          color: "white", padding: "5px 9px", borderRadius: 999,
          fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
          boxShadow: "0 2px 6px rgba(0,0,0,.25)",
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="4" width="14" height="10" rx="1.5" />
            <circle cx="8" cy="9" r="3" fill="currentColor" stroke="white" strokeWidth="1" />
            <rect x="5" y="2.5" width="6" height="2" rx=".5" />
          </svg>
          <span>{item.photographerCount || ""}</span>
        </div>
        <PinTail active={active} />
      </div>
    );
  }

  if (kind === "photo") {
    return (
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: "white", padding: 2,
        boxShadow: "0 2px 6px rgba(0,0,0,.25)",
        border: active ? "2px solid var(--accent)" : "2px solid white",
        transform: `scale(${active ? 1.15 : 1})`, transition: "transform .15s",
      }}>
        <img src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div style={{ transform: `scale(${active ? 1.1 : 1})`, transition: "transform .15s" }}>
      <div style={{
        background: active ? "var(--accent)" : "white",
        color: active ? "white" : "var(--text)",
        padding: "5px 10px", borderRadius: 999,
        fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums",
        boxShadow: "0 2px 6px rgba(0,0,0,.25)",
        border: active ? "1px solid var(--accent)" : "1px solid rgba(0,0,0,.1)",
        whiteSpace: "nowrap",
      }}>
        ${item.startingPrice}
      </div>
      <PinTail active={active} color={active ? "var(--accent)" : "white"} />
    </div>
  );
}

function MapPopover({ item, kind, onClose, onOpen }) {
  return (
    <div style={{
      width: 240, background: "white", borderRadius: 10,
      boxShadow: "0 8px 28px rgba(0,0,0,.18)",
      overflow: "hidden", position: "relative",
    }}>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
        all: "unset", cursor: "default",
        position: "absolute", top: 6, right: 6, zIndex: 2,
        width: 22, height: 22, borderRadius: "50%",
        background: "rgba(0,0,0,.55)", color: "white",
        display: "grid", placeItems: "center", fontSize: 12, lineHeight: 1,
      }}>×</button>
      <Img src={item.cover || item.image || item.url} style={{ width: "100%", height: 120 }} />
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.name || item.spotName || "Photo"}</div>
        {item.startingPrice && (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Starts at <span style={{ color: "var(--text)", fontWeight: 600 }}>${item.startingPrice}</span> • {item.distance} mi
          </div>
        )}
        {item.city && <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.city}</div>}
        {item.rating && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
            <Stars rating={item.rating} size={10} />
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{item.rating.toFixed(1)}</span>
            <span>({item.reviewCount})</span>
          </div>
        )}
        <button onClick={onOpen} style={{
          all: "unset", cursor: "default",
          marginTop: 6, padding: "7px 0",
          background: "var(--accent)", color: "white",
          borderRadius: 6, textAlign: "center",
          fontSize: 12, fontWeight: 600,
        }}>View {kind === "spot" ? "Spot" : "Profile"}</button>
      </div>
    </div>
  );
}

function MapFallback({ height, message }) {
  return (
    <div style={{
      width: "100%", height,
      borderRadius: "var(--card-radius)", border: "1px solid var(--line)",
      background: "var(--chip)", display: "grid", placeItems: "center",
      color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24,
    }}>
      {message}
    </div>
  );
}

export function MapView({ items = [], activeId, onSelectItem, kind = "photographer", height = "100%", style: mapStyle = "standard", apiKey, center: userLocation }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "lenshive-google-maps",
    googleMapsApiKey: apiKey || "",
  });

  const mapRef = useRef(null);
  const [popover, setPopover] = useState(null);

  const center = useMemo(() => {
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng };
    if (!items.length) return { lat: 39.99, lng: -105.15 };
    const lats = items.map(i => i.lat), lngs = items.map(i => i.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [items, userLocation]);

  const fitToItems = (map) => {
    if (!map || !window.google) return;
    const points = items.map(i => ({ lat: i.lat, lng: i.lng }));
    if (userLocation) points.push({ lat: userLocation.lat, lng: userLocation.lng });
    if (!points.length) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(13);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, 80);
  };

  useEffect(() => {
    fitToItems(mapRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, userLocation]);

  if (!apiKey) return <MapFallback height={height} message="Map unavailable — add a Google Maps API key to the backend (.env)." />;
  if (loadError) return <MapFallback height={height} message="Failed to load Google Maps." />;
  if (!isLoaded) return <MapFallback height={height} message="Loading map…" />;

  return (
    <div style={{
      position: "relative", width: "100%", height,
      borderRadius: "var(--card-radius)", overflow: "hidden",
      border: "1px solid var(--line)",
    }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={12}
        onLoad={(map) => { mapRef.current = map; fitToItems(map); }}
        onClick={() => setPopover(null)}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          mapTypeId: mapStyle === "satellite" ? "satellite" : "roadmap",
          styles: mapStyle === "satellite" ? undefined : MAP_STYLES,
        }}
      >
        {userLocation && (userLocation.isMine ? (
          // Real GPS-derived location → blue "you are here" dot.
          <OverlayView
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h / 2) })}
          >
            <div title={userLocation.label || "Your location"} style={{ position: "relative", width: 18, height: 18 }}>
              <div style={{
                position: "absolute", inset: -7, borderRadius: "50%",
                background: "rgba(37,99,235,.18)",
              }} />
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#2563eb", border: "2.5px solid white",
                boxShadow: "0 1px 4px rgba(0,0,0,.35)",
              }} />
            </div>
          </OverlayView>
        ) : (
          // Searched / chosen location → red drop pin.
          <OverlayView
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            // Anchor the pin's tip at the lat/lng point, not its center.
            getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}
          >
            <div title={userLocation.label || "Search location"} style={{ width: 26, height: 34, lineHeight: 0 }}>
              <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true">
                <path
                  d="M13 1.5 C20 1.5 24.5 6.5 24.5 12.5 C24.5 21 13 32.5 13 32.5 C13 32.5 1.5 21 1.5 12.5 C1.5 6.5 6 1.5 13 1.5 Z"
                  fill="#dc2626"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="13" cy="12.5" r="4" fill="white" />
              </svg>
            </div>
          </OverlayView>
        ))}

        {items.map((it) => {
          const isActive = activeId === it.id || popover === it.id;
          return (
            <OverlayView
              key={it.id}
              position={{ lat: it.lat, lng: it.lng }}
              mapPaneName={OverlayView.FLOAT_PANE}
              getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setPopover(it.id); onSelectItem && onSelectItem(it.id); }}
                style={{ all: "unset", cursor: "default", zIndex: isActive ? 10 : 1 }}
              >
                <PinContent kind={kind} item={it} active={isActive} />
              </button>
            </OverlayView>
          );
        })}

        {popover && (() => {
          const it = items.find(i => i.id === popover);
          if (!it) return null;
          return (
            <OverlayView
              position={{ lat: it.lat, lng: it.lng }}
              mapPaneName={OverlayView.FLOAT_PANE}
              getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h + 44) })}
            >
              <MapPopover
                item={it} kind={kind}
                onClose={() => setPopover(null)}
                onOpen={() => onSelectItem && onSelectItem(it.id, true)}
              />
            </OverlayView>
          );
        })()}
      </GoogleMap>

      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <button style={mapBtn} onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 12) + 1)}>+</button>
        <button style={mapBtn} onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || 12) - 1)}>−</button>
      </div>
      <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 9.5, color: "rgba(0,0,0,.45)", letterSpacing: ".02em" }}>
        Map data © LensHive
      </div>
    </div>
  );
}
