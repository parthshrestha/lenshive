import { useState, useMemo } from "react";
import { Img, Stars } from "./ui.jsx";

const mapBtn = {
  all: "unset", cursor: "default",
  width: 28, height: 28, display: "grid", placeItems: "center",
  background: "white", borderRadius: 6,
  boxShadow: "0 1px 3px rgba(0,0,0,.18)",
  fontSize: 14, fontWeight: 500, color: "#333",
};

function MapTiles({ styleKey }) {
  const palettes = {
    standard: { land: "#f1efe8", park: "#cfe2c1", water: "#a8c9e0", road: "#ffffff", roadOutline: "#dcd6c5", text: "#7e7666" },
    minimal:  { land: "#f5f3ee", park: "#e5e8df", water: "#e1e7ec", road: "#ffffff", roadOutline: "#e7e2d5", text: "#9c9486" },
    satellite:{ land: "#3a3d2c", park: "#4a5b35", water: "#1e3a4b", road: "#5c5444", roadOutline: "#46402f", text: "#c4b896" },
  };
  const c = palettes[styleKey] || palettes.standard;
  return (
    <g>
      <rect x="0" y="0" width="1000" height="800" fill={c.land} />
      <path d="M-20 540 L120 470 L220 510 L260 600 L180 720 L-20 760 Z" fill={c.park} opacity=".9" />
      <path d="M620 -20 L780 30 L860 120 L820 220 L700 240 L600 160 L580 60 Z" fill={c.park} opacity=".9" />
      <path d="M400 350 L520 320 L600 380 L580 460 L460 480 L400 420 Z" fill={c.park} opacity=".85" />
      <path d="M820 540 L960 510 L1020 600 L980 720 L860 740 L800 660 Z" fill={c.park} opacity=".9" />
      <path d="M-10 240 L120 220 L220 260 L300 240 L340 290 L260 320 L120 310 L-10 340 Z" fill={c.water} opacity=".85" />
      {[
        "M-20 380 Q 200 360 500 400 T 1020 420",
        "M-20 180 Q 240 220 480 200 T 1020 240",
        "M-20 640 Q 240 600 500 620 T 1020 600",
        "M260 -20 Q 280 200 320 400 T 360 820",
        "M620 -20 Q 600 200 640 400 T 680 820",
        "M820 -20 Q 800 200 840 400 T 860 820",
      ].map((d, i) => (
        <g key={`hwy-${i}`}>
          <path d={d} stroke={c.roadOutline} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d={d} stroke={c.road} strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
      ))}
      {[
        "M-20 80 L1020 90", "M-20 300 L1020 310", "M-20 480 L1020 470",
        "M-20 720 L1020 730", "M-20 560 L1020 555",
        "M80 -20 L90 820", "M180 -20 L200 820", "M380 -20 L400 820",
        "M520 -20 L530 820", "M720 -20 L740 820", "M920 -20 L930 820",
      ].map((d, i) => (
        <g key={`st-${i}`}>
          <path d={d} stroke={c.roadOutline} strokeWidth="5" fill="none" />
          <path d={d} stroke={c.road} strokeWidth="3" fill="none" />
        </g>
      ))}
      <text x="160" y="650" fontSize="13" fill={c.text} fontWeight="500" letterSpacing=".06em">CHAUTAUQUA</text>
      <text x="720" y="170" fontSize="13" fill={c.text} fontWeight="500" letterSpacing=".06em">FLATIRONS</text>
      <text x="490" y="430" fontSize="11" fill={c.text} fontWeight="500" letterSpacing=".06em">Boulder</text>
      <text x="850" y="610" fontSize="11" fill={c.text} fontWeight="500" letterSpacing=".06em">Mapleton</text>
      <text x="190" y="270" fontSize="10" fill={c.text} fontWeight="500" letterSpacing=".06em" opacity=".8">Reservoir</text>
    </g>
  );
}

function PinTail({ active, color }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" style={{ display: "block", margin: "0 auto", marginTop: -1, position: "relative" }}>
      <path d="M0 0 L5 6 L10 0 Z" fill={color || (active ? "var(--accent)" : "var(--text)")} />
    </svg>
  );
}

function Pin({ x, y, kind, item, active, onMouseEnter, onMouseLeave, onClick }) {
  const left = `${(x / 1000) * 100}%`;
  const top = `${(y / 800) * 100}%`;

  if (kind === "spot") {
    return (
      <button onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
        style={{
          all: "unset", cursor: "default",
          position: "absolute", left, top, transform: `translate(-50%, -100%) scale(${active ? 1.1 : 1})`,
          transition: "transform .15s",
          zIndex: active ? 10 : 1,
        }}>
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
      </button>
    );
  }

  if (kind === "photo") {
    return (
      <button onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
        style={{
          all: "unset", cursor: "default",
          position: "absolute", left, top, transform: `translate(-50%, -50%) scale(${active ? 1.15 : 1})`,
          transition: "transform .15s", zIndex: active ? 10 : 1,
        }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: "white", padding: 2,
          boxShadow: "0 2px 6px rgba(0,0,0,.25)",
          border: active ? "2px solid var(--accent)" : "2px solid white",
        }}>
          <img src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
        </div>
      </button>
    );
  }

  return (
    <button onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{
        all: "unset", cursor: "default",
        position: "absolute", left, top, transform: `translate(-50%, -100%) scale(${active ? 1.1 : 1})`,
        transition: "transform .15s",
        zIndex: active ? 10 : 1,
      }}>
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
    </button>
  );
}

function MapPopover({ x, y, item, kind, onClose, onOpen }) {
  const left = `${(x / 1000) * 100}%`;
  const top = `${(y / 800) * 100}%`;
  return (
    <div style={{
      position: "absolute", left, top, transform: "translate(-50%, calc(-100% - 18px))",
      width: 240, background: "white", borderRadius: 10,
      boxShadow: "0 8px 28px rgba(0,0,0,.18)",
      overflow: "hidden", zIndex: 20,
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

export function MapView({ items = [], activeId, onSelectItem, kind = "photographer", height = "100%", style: mapStyle = "standard" }) {
  const [, setHovered] = useState(null);
  const [popover, setPopover] = useState(null);

  const bounds = useMemo(() => {
    if (!items.length) return { minLat: 39.6, maxLat: 40.2, minLng: -105.4, maxLng: -104.9 };
    const lats = items.map(i => i.lat), lngs = items.map(i => i.lng);
    const padLat = Math.max(0.02, (Math.max(...lats) - Math.min(...lats)) * 0.3);
    const padLng = Math.max(0.02, (Math.max(...lngs) - Math.min(...lngs)) * 0.3);
    return {
      minLat: Math.min(...lats) - padLat, maxLat: Math.max(...lats) + padLat,
      minLng: Math.min(...lngs) - padLng, maxLng: Math.max(...lngs) + padLng,
    };
  }, [items]);

  const toXY = (lat, lng) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 1000;
    const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 800;
    return { x, y };
  };

  return (
    <div style={{
      position: "relative", width: "100%", height,
      borderRadius: "var(--card-radius)", overflow: "hidden",
      background: mapStyle === "satellite" ? "#3a3d2c" : mapStyle === "minimal" ? "#f3f1ec" : "#e8efe4",
      border: "1px solid var(--line)",
    }}>
      <svg viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
        <MapTiles styleKey={mapStyle} />
      </svg>
      <div style={{ position: "absolute", inset: 0 }}>
        {items.map((it) => {
          const { x, y } = toXY(it.lat, it.lng);
          const isActive = activeId === it.id;
          const isPop = popover === it.id;
          return (
            <Pin key={it.id}
              x={x} y={y} kind={kind} item={it}
              active={isActive || isPop}
              onMouseEnter={() => setHovered(it.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { setPopover(it.id); onSelectItem && onSelectItem(it.id); }}
            />
          );
        })}
        {popover && (() => {
          const it = items.find(i => i.id === popover);
          if (!it) return null;
          const { x, y } = toXY(it.lat, it.lng);
          return <MapPopover x={x} y={y} item={it} kind={kind} onClose={() => setPopover(null)} onOpen={() => onSelectItem && onSelectItem(it.id, true)} />;
        })()}
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <button style={mapBtn}>+</button>
        <button style={mapBtn}>−</button>
      </div>
      <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 9.5, color: "rgba(0,0,0,.45)", letterSpacing: ".02em" }}>
        Map data © LensHive
      </div>
    </div>
  );
}
