import { useState } from "react";
import { Nav, Footer, Img, Badge, Avatar, Stars, PhotographerCard, PinIcon, HeartIcon, ShareIcon } from "../components";
import { MapView } from "../components";
import { PHOTOS } from "../data";
import { useData } from "../lib/DataContext";

const iconBtn = {
  all: "unset", cursor: "default",
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", border: "1px solid var(--line)",
  borderRadius: 8, fontSize: 13, fontWeight: 500,
  color: "var(--text)", background: "var(--surface)",
};
const sectionH = { margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-.015em" };

function SpotStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 3, fontWeight: 500, letterSpacing: ".02em" }}>{label}</div>
      <div style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: bold ? 600 : 500 }}>{value}</span>
    </div>
  );
}

function PhotoModal({ photo, onClose, onOpen }) {
  if (!photo) return null;
  const p = PHOTOGRAPHERS.find(pg => pg.id === photo.photographerId);
  const spot = SPOTS.find(s => s.id === photo.spotId);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(20,18,14,.7)", backdropFilter: "blur(4px)",
      display: "grid", placeItems: "center", padding: 40,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 14, overflow: "hidden",
        display: "grid", gridTemplateColumns: "1fr 360px",
        maxWidth: 1100, width: "100%", maxHeight: "85vh",
        boxShadow: "0 20px 60px -10px rgba(0,0,0,.4)",
      }}>
        <div style={{ background: "#0c0a07" }}>
          <Img src={photo.url} style={{ width: "100%", height: "100%", maxHeight: "85vh" }} />
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <button onClick={onClose} style={{
            all: "unset", cursor: "default", alignSelf: "flex-end",
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--chip)", display: "grid", placeItems: "center",
            fontSize: 14, color: "var(--muted)",
          }}>×</button>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Photo by</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar src={p.avatar} initials={p.initials} size={44} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.01em" }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
                  <Stars rating={p.rating} size={10} />
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.rating.toFixed(1)}</span>
                  <span>({p.reviewCount})</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <Row label="Location" value={spot.name} />
            <Row label="Style" value={photo.styles.join(", ")} />
            <Row label="Service" value={photo.services.join(", ")} />
            <Row label="Starting at" value={`$${p.startingPrice}`} bold />
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => onOpen(p.id)} style={{
              all: "unset", cursor: "default",
              padding: "12px 0", background: "var(--accent)", color: "white",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center",
            }}>View photographer profile</button>
            <button style={{
              all: "unset", cursor: "default",
              padding: "12px 0", border: "1px solid var(--line)", color: "var(--text)",
              borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center",
            }}>Save photo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SpotPage({ nav, spotId, openPhotographer, mapsApiKey }) {
  const { photographers: PHOTOGRAPHERS, spots: SPOTS } = useData();
  // Hooks before any early return so hook order stays stable across loading states.
  const [openPhoto, setOpenPhoto] = useState(null);
  if (!SPOTS.length) return null;
  const spot = SPOTS.find(s => s.id === spotId) || SPOTS[0];
  const photos = PHOTOS.filter(p => p.spotId === spot.id);
  const photographers = PHOTOGRAPHERS.filter(p => p.spots.includes(spot.id));

  return (
    <div>
      <Nav route="spot" onNav={nav} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 28px 0", fontSize: 12.5, color: "var(--muted)" }}>
        <button onClick={() => nav("home")} style={{ all: "unset", cursor: "default", color: "var(--muted)" }}>Home</button>
        <span style={{ margin: "0 6px" }}>›</span>
        <button onClick={() => nav("home")} style={{ all: "unset", cursor: "default", color: "var(--muted)" }}>Photo Spots</button>
        <span style={{ margin: "0 6px" }}>›</span>
        <span style={{ color: "var(--text)" }}>{spot.name}</span>
      </div>

      <section style={{ maxWidth: 1280, margin: "16px auto 0", padding: "0 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, height: 440, borderRadius: "var(--card-radius)", overflow: "hidden" }}>
          <Img src={spot.image} style={{ gridRow: "1 / 3", height: "100%" }} />
          {photos.slice(0, 4).map((p) => (
            <Img key={p.id} src={p.url} style={{ height: "100%" }} />
          ))}
          {Array.from({ length: Math.max(0, 4 - photos.length) }).map((_, i) => (
            <div key={i} style={{ background: "var(--skeleton)", height: "100%" }} />
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "24px auto 0", padding: "0 28px",
        display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, letterSpacing: "-.02em" }}>{spot.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13, color: "var(--muted)" }}>
                <PinIcon size={13} />
                <span>{spot.city}</span>
                <span>•</span>
                <span>{spot.photographerCount} photographers shot here</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={iconBtn}><ShareIcon /> Share</button>
              <button style={iconBtn}><HeartIcon size={14} /> Save</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
            {spot.bestFor.map(t => <Badge key={t} kind="accent">{t}</Badge>)}
          </div>

          <div style={{ marginTop: 28, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
            <h2 style={sectionH}>About this spot</h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.6, maxWidth: 660 }}>
              {spot.notes}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 18, maxWidth: 660 }}>
              <SpotStat label="Best time" value={spot.bestTime} />
              <SpotStat label="Best for" value={spot.bestFor.slice(0, 2).join(", ")} />
              <SpotStat label="Photographers" value={`${spot.photographerCount} listed`} />
            </div>
          </div>

          <div style={{ marginTop: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h2 style={sectionH}>Photos taken here</h2>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Click a photo to see who took it</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 14 }}>
              {photos.map(p => (
                <button key={p.id} onClick={() => setOpenPhoto(p.id)} style={{
                  all: "unset", cursor: "default",
                  borderRadius: "calc(var(--card-radius) - 4px)", overflow: "hidden",
                  position: "relative", aspectRatio: "1 / 1",
                }}>
                  <Img src={p.url} style={{ width: "100%", height: "100%" }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 50%)",
                    opacity: 0, transition: "opacity .15s",
                  }} className="photo-hover" />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
            <h2 style={sectionH}>Photographers who shot here</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 14 }}>
              {photographers.map(p => (
                <PhotographerCard key={p.id} p={p} onOpen={openPhotographer} />
              ))}
            </div>
          </div>
        </div>

        <aside style={{ position: "sticky", top: 88, alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 280, borderRadius: "var(--card-radius)", overflow: "hidden", border: "1px solid var(--line)" }}>
            <MapView items={[{ ...spot }]} kind="spot" style="standard" height="100%" apiKey={mapsApiKey} />
          </div>
          <div style={{
            padding: 18, border: "1px solid var(--line)",
            borderRadius: "var(--card-radius)", background: "var(--surface)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", color: "var(--muted)", marginBottom: 8 }}>LOCAL TIPS</div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Aim for golden hour — 30 min before sunset gives the best light.",
                "Weekday mornings are quietest.",
                "Commercial shoots may require a permit — check city site.",
              ].map((t, i) => (
                <li key={i} style={{ display: "flex", gap: 10, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>·</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {openPhoto && (
        <PhotoModal photo={PHOTOS.find(p => p.id === openPhoto)}
          onClose={() => setOpenPhoto(null)}
          onOpen={(pgId) => { setOpenPhoto(null); openPhotographer(pgId); }} />
      )}

      <Footer />
    </div>
  );
}
