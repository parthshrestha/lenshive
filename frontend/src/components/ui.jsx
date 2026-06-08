import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { placesAutocomplete } from "../lib/location";

// Signed-in user icon with a dropdown menu (My account / Log out).
// Only renders when there's a logged-in user; the signed-out state is handled
// in Nav with the original Log in / Sign up buttons.
function UserMenu({ onNav }) {
  const { me, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!me) return null;

  const go = (fn) => () => { setOpen(false); fn(); };
  const initial = (me.name || me.username || me.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu (${me.username || me.name || me.email})`}
        title={me.username || me.name || me.email}
        className="grid h-9 w-9 cursor-default place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] transition-[border-color,color] hover:border-[var(--accent)]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--chip)] text-[12.5px] font-semibold text-[var(--muted)]">
          {initial}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_44px_rgba(20,16,8,.18)]"
        >
          <div className="border-b border-[var(--line)] px-4 py-3">
            <div className="truncate text-[13.5px] font-semibold text-[var(--text)]">{me.name || me.username}</div>
            <div className="truncate text-[12px] text-[var(--muted)]">{me.email}</div>
          </div>
          <MenuItem onClick={go(() => onNav("dashboard"))} icon={<UserIcon />}>My account</MenuItem>
          <MenuItem onClick={go(signOut)} icon={<LogoutIcon />} variant="danger">Log out</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, icon, children, variant = "default" }) {
  const color = variant === "danger"
    ? "text-[#b3261e]"
    : variant === "accent"
      ? "text-[var(--accent)]"
      : "text-[var(--text)]";
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full cursor-default items-center gap-2.5 px-4 py-2.5 text-left text-[13.5px] font-medium ${color} hover:bg-[var(--chip)]`}
    >
      <span className="grid h-4 w-4 shrink-0 place-items-center opacity-80">{icon}</span>
      {children}
    </button>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const badgeClasses = {
  default: "bg-[var(--chip)] text-[var(--text)]",
  verified: "bg-[#2d5d4f]/10 text-[#2d5d4f]",
  accent: "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent)]",
  outline: "border border-[var(--line)] bg-transparent text-[var(--muted)]",
};

export const navLink = {
  all: "unset",
  cursor: "default",
  fontSize: 13.5,
  fontWeight: 500,
  color: "var(--text)",
  padding: "6px 2px",
  whiteSpace: "nowrap",
};

export const primaryBtn = {
  all: "unset",
  cursor: "default",
  background: "var(--accent)",
  color: "white",
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 600,
};

export function Stars({ rating, size = 12 }) {
  return (
    <span className="inline-flex gap-px text-[var(--accent)]" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 16 16" fill={i <= Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
          <path d="M8 1.5l1.9 4.1 4.5.4-3.4 3 1 4.4L8 11.2 3.9 13.4l1-4.4-3.4-3 4.5-.4z" />
        </svg>
      ))}
    </span>
  );
}

export function Badge({ children, kind = "default" }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px] text-[11.5px] font-medium ${badgeClasses[kind] || badgeClasses.default}`}>
      {children}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <Badge kind="verified">
      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0l2 1.7 2.5-.5.5 2.5L15 5.6 14 8l1 2.4-2 1.9-.5 2.5-2.5-.5L8 16l-2-1.7-2.5.5-.5-2.5L1 10.4 2 8 1 5.6l2-1.9.5-2.5L6 1.7z" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </Badge>
  );
}

export function VerifiedBadgeInline() {
  return (
    <span className="inline-flex items-center gap-1 font-medium text-[#2d5d4f]">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0l2 1.7 2.5-.5.5 2.5L15 5.6 14 8l1 2.4-2 1.9-.5 2.5-2.5-.5L8 16l-2-1.7-2.5.5-.5-2.5L1 10.4 2 8 1 5.6l2-1.9.5-2.5L6 1.7z" />
        <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}

export function Avatar({ src, initials, size = 40 }) {
  const [err, setErr] = useState(false);
  const dimension = { width: size, height: size };

  if (!src || err) {
    return (
      <div className="grid shrink-0 place-items-center rounded-full bg-[var(--chip)] font-semibold text-[var(--muted)]" style={{ ...dimension, fontSize: size * 0.4 }}>
        {initials}
      </div>
    );
  }

  return <img src={src} alt="" onError={() => setErr(true)} className="shrink-0 rounded-full object-cover" style={dimension} />;
}

export function Img({ src, alt, style, className = "", ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[var(--skeleton)] ${className}`} style={style}>
      {!err && (
        <img
          src={src}
          alt={alt || ""}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
          className={`block h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          {...rest}
        />
      )}
    </div>
  );
}

export function HiveMark({ size = 24 }) {
  return <img src="/logo-icon.png" width={size} height={size} className="block shrink-0" alt="LensHive" />;
}

export function SearchIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3" />
    </svg>
  );
}

export function PinIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden="true">
      <path d="M8 0a5 5 0 015 5c0 3.5-5 11-5 11S3 8.5 3 5a5 5 0 015-5zm0 7a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}

export function CrosshairIcon({ size = 15, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15" />
    </svg>
  );
}

export function HeartIcon({ size = 18, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "var(--accent)" : "none"} stroke={filled ? "var(--accent)" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export function ShareIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

export function ChevronDown({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function CheckIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8l3 3 7-7" />
    </svg>
  );
}

export function Nav({ onNav, compact = false, location, geolocating, useMyLocation, searchLocation, query = "" }) {
  const { me } = useAuth();
  const items = [
    { key: "explore", label: "Explore" },
    { key: "photographers", label: "Photographers" },
    { key: "spots", label: "Photo Spots" },
    { key: "how", label: "How it works" },
  ];

  const [locText, setLocText] = useState(location?.label || "");
  const [queryText, setQueryText] = useState(query);

  // Autocomplete dropdown state for the location field.
  const [predictions, setPredictions] = useState([]);
  const [showAc, setShowAc] = useState(false);
  const acRef = useRef(null);

  // Keep the location field in sync when the resolved location changes
  // (geolocation on load, "my location" click, or a typed search).
  useEffect(() => {
    if (location?.label) setLocText(location.label);
  }, [location?.label]);

  // Debounced Places Autocomplete. Bias around the current location so
  // ambiguous queries (e.g. "Chautauqua Park") prefer the nearby match.
  useEffect(() => {
    const text = locText.trim();
    if (!text || text === location?.label) {
      setPredictions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const preds = await placesAutocomplete(text, location);
        setPredictions(preds);
      } catch {
        setPredictions([]);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [locText, location?.lat, location?.lng, location?.label]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!showAc) return;
    const onClick = (e) => { if (acRef.current && !acRef.current.contains(e.target)) setShowAc(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showAc]);

  const submit = () => {
    const text = locText.trim();
    if (text && text !== location?.label) searchLocation?.(text);
    setShowAc(false);
    onNav("search", { q: queryText, kind: "photographer" });
  };

  const pickPrediction = (p) => {
    const label = p.mainText || p.description || "";
    setLocText(label);
    setPredictions([]);
    setShowAc(false);
    searchLocation?.({ placeId: p.placeId, label });
    onNav("search", { q: queryText, kind: "photographer" });
  };

  const onKey = (e) => {
    if (e.key === "Escape") { setShowAc(false); return; }
    if (e.key === "Enter") submit();
  };

  return (
    <header className="sticky top-0 z-50 flex items-center gap-6 border-b border-[var(--line)] bg-[var(--bg)] px-7 py-3.5">
      <button onClick={() => onNav("home")} className="flex cursor-default items-center gap-2 text-[19px] font-bold text-[var(--text)]">
        <HiveMark size={22} />
        <span>
          Lens<span className="text-[var(--accent)]">Hive</span>
        </span>
      </button>

      {compact ? (
        <div className="flex max-w-[480px] flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1.5 pl-3.5 pr-1.5">
          <div ref={acRef} className="relative flex min-w-0 flex-1 items-center gap-2">
            <SearchIcon size={14} />
            <input
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text)] outline-none"
              placeholder="City or address"
              value={locText}
              onChange={(e) => { setLocText(e.target.value); setShowAc(true); }}
              onFocus={() => setShowAc(true)}
              onKeyDown={onKey}
            />
            <button
              onClick={() => { setShowAc(false); useMyLocation?.(); }}
              title="Use my location"
              className={`grid h-[26px] w-[26px] shrink-0 cursor-default place-items-center rounded-full text-[var(--muted)] hover:text-[var(--accent)] ${geolocating ? "animate-pulse text-[var(--accent)]" : ""}`}
            >
              <CrosshairIcon size={15} />
            </button>
            {showAc && predictions.length > 0 && (
              <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[320px] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_44px_rgba(20,16,8,.18)]">
                {predictions.map(p => (
                  <button
                    key={p.placeId}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickPrediction(p)}
                    className="flex w-full cursor-default flex-col items-start gap-0.5 border-b border-[var(--line)] px-4 py-2.5 text-left last:border-0 hover:bg-[var(--chip)]"
                  >
                    <span className="truncate text-[13px] font-medium text-[var(--text)]">{p.mainText || p.description}</span>
                    {p.secondaryText && (
                      <span className="truncate text-[11.5px] text-[var(--muted)]">{p.secondaryText}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="h-[18px] w-px bg-[var(--line)]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text)] outline-none"
            placeholder="Graduation photographer"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={onKey}
          />
          <button onClick={submit} className="grid h-[30px] w-[30px] shrink-0 cursor-default place-items-center rounded-full bg-[var(--accent)]">
            <SearchIcon size={13} color="white" />
          </button>
        </div>
      ) : (
        <nav className="flex flex-1 gap-5">
          {items.map((it) => (
            <button key={it.key} onClick={() => onNav(it.key === "spots" ? "spot" : it.key === "photographers" ? "search" : "home")} className="cursor-default whitespace-nowrap px-0.5 py-1.5 text-[13.5px] font-medium text-[var(--text)]">
              {it.label}
            </button>
          ))}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2.5">
        {me ? (
          <UserMenu onNav={onNav} />
        ) : (
          <>
            <button className="cursor-default whitespace-nowrap px-0.5 py-1.5 text-[13.5px] font-medium text-[var(--text)]" onClick={() => onNav("login")}>Log in</button>
            <button onClick={() => onNav("signup")} className="cursor-default rounded-lg bg-[var(--accent)] px-4 py-2 text-[13.5px] font-semibold text-white">Sign up</button>
          </>
        )}
      </div>
    </header>
  );
}

export function PhotographerCard({ p, onOpen, active = false }) {
  return (
    <article
      onClick={() => onOpen(p.id)}
      className={`flex cursor-default gap-3.5 rounded-[var(--card-radius)] border bg-[var(--surface)] p-3 shadow-[var(--card-shadow)] transition-[border-color,box-shadow,transform] duration-150 ${active ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent),0_6px_24px_-8px_rgba(0,0,0,.10)]" : "border-[var(--line)]"}`}
    >
      <Img src={p.cover} className="h-[110px] w-[110px] shrink-0 rounded-[calc(var(--card-radius)-4px)]" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[15.5px] font-semibold text-[var(--text)]">{p.name}</h3>
          <button className="cursor-default text-[var(--muted)]">
            <HeartIcon size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
          <Stars rating={p.rating} />
          <span className="font-semibold text-[var(--text)]">{p.rating.toFixed(1)}</span>
          <span>({p.reviewCount})</span>
          {p.trustSignals.includes("Verified") && <><span>-</span><VerifiedBadgeInline /></>}
        </div>
        <div className="text-[12.5px] text-[var(--muted)]">{p.services.slice(0, 3).join(", ")}</div>
        <div className="text-[12.5px] text-[var(--muted)]">{p.location} - {p.distance} mi away</div>
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <span className="text-sm font-semibold text-[var(--text)]">${p.startingPrice}</span>
          <span className="text-[11.5px] text-[var(--muted)]">starting</span>
          <div className="ml-auto flex gap-1">
            {p.styles.slice(0, 2).map((s) => <Badge key={s}>{s}</Badge>)}
          </div>
        </div>
      </div>
    </article>
  );
}

export function SpotCard({ spot, onOpen, size = "md" }) {
  const isLg = size === "lg";
  return (
    <article onClick={() => onOpen(spot.id)} className="flex min-w-0 cursor-default flex-col gap-2">
      <Img src={spot.image} className={`w-full rounded-[var(--card-radius)] ${isLg ? "aspect-[4/5]" : "aspect-[5/4]"}`} />
      <div className="flex flex-col gap-0.5">
        <div className="text-sm font-semibold text-[var(--text)]">{spot.name}</div>
        <div className="text-[12.5px] text-[var(--muted)]">{spot.city}</div>
        <div className="mt-1 text-xs text-[var(--muted)]">
          {spot.photographerCount} photographers - Best for {spot.bestFor.slice(0, 2).join(", ").toLowerCase()}
        </div>
      </div>
    </article>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-[var(--bg)] px-7 pb-7 pt-10">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[1.4fr_repeat(4,1fr)] gap-8">
        <div>
          <div className="mb-2.5 flex items-center gap-2">
            <HiveMark size={20} />
            <div className="text-lg font-bold">Lens<span className="text-[var(--accent)]">Hive</span></div>
          </div>
          <p className="m-0 max-w-[280px] text-[12.5px] leading-6 text-[var(--muted)]">
            The easiest way to find and book amazing photographers near you.
          </p>
        </div>
        {[
          { t: "Explore", l: ["Photographers", "Photo Spots", "Categories", "How it works"] },
          { t: "For Photographers", l: ["Create profile", "Resources", "Pricing"] },
          { t: "Company", l: ["About us", "Blog", "Contact"] },
          { t: "Support", l: ["Help center", "Safety", "Terms", "Privacy"] },
        ].map((col) => (
          <div key={col.t}>
            <div className="mb-3 text-[12.5px] font-semibold text-[var(--text)]">{col.t}</div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {col.l.map((li) => <li key={li} className="text-[12.5px] text-[var(--muted)]">{li}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-[1400px] border-t border-[var(--line)] pt-5 text-[11.5px] text-[var(--muted)]">
        (c) 2026 LensHive. All rights reserved.
      </div>
    </footer>
  );
}