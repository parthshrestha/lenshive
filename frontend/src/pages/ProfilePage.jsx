import { useState } from "react";
import {
  Nav, Footer, Img, Avatar, Badge, Stars, SpotCard,
  VerifiedBadgeInline, PinIcon, HeartIcon, ShareIcon, CheckIcon,
} from "../components";
import { PHOTOS, OCCASIONS, BUDGETS } from "../data";
import { useData } from "../lib/DataContext";

const iconBtn = {
  all: "unset", cursor: "default",
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", border: "1px solid var(--line)",
  borderRadius: 8, fontSize: 13, fontWeight: 500,
  color: "var(--text)", background: "var(--surface)",
};
const sectionH2 = {
  fontSize: 13, fontWeight: 600, letterSpacing: ".04em",
  textTransform: "uppercase", color: "var(--muted)",
  marginTop: 28, marginBottom: 0,
};
const selectStyle = {
  all: "unset",
  padding: "10px 12px", border: "1px solid var(--line)",
  borderRadius: 8, fontSize: 13.5, background: "var(--bg)",
  width: "100%", boxSizing: "border-box",
};

function Stat({ label, value, accent, last }) {
  return (
    <div style={{ borderRight: last ? "none" : "1px solid var(--line)", paddingLeft: 4, paddingRight: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: accent ? "var(--accent)" : "var(--text)" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

function QuoteModal({ photographer, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ occasion: "Graduation", date: "", spot: "Chautauqua Park", budget: "300-750", notes: "" });
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(20,18,14,.7)", backdropFilter: "blur(4px)",
      display: "grid", placeItems: "center", padding: 40,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 14,
        width: 520, maxWidth: "100%",
        padding: 28, boxShadow: "0 20px 60px -10px rgba(0,0,0,.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: ".06em" }}>STEP {step} OF 3</div>
            <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: "-.015em" }}>
              {step === 1 ? "Tell us about your shoot" : step === 2 ? "When and where?" : "Anything else?"}
            </h2>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>Quote from {photographer.name}</div>
          </div>
          <button onClick={onClose} style={{
            all: "unset", cursor: "default",
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--chip)", display: "grid", placeItems: "center",
            color: "var(--muted)", fontSize: 14,
          }}>×</button>
        </div>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          {step === 1 && (
            <>
              <Field label="Occasion">
                <select value={form.occasion} onChange={e => setForm({ ...form, occasion: e.target.value })} style={selectStyle}>
                  {OCCASIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Budget">
                <select value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} style={selectStyle}>
                  {BUDGETS.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
                </select>
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="Preferred date">
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={selectStyle} />
              </Field>
              <Field label="Photo spot or location">
                <input value={form.spot} onChange={e => setForm({ ...form, spot: e.target.value })} style={selectStyle} placeholder="e.g. Chautauqua Park" />
              </Field>
            </>
          )}
          {step === 3 && (
            <Field label="Anything we should know?">
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ ...selectStyle, minHeight: 100, resize: "vertical", fontFamily: "inherit" }}
                placeholder="Group size, must-have shots, vibe..." />
            </Field>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={{
              all: "unset", cursor: "default",
              padding: "11px 18px", border: "1px solid var(--line)",
              borderRadius: 8, fontSize: 13.5, fontWeight: 600,
            }}>Back</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={() => step < 3 ? setStep(step + 1) : onClose()} style={{
            all: "unset", cursor: "default",
            padding: "11px 22px", background: "var(--accent)", color: "white",
            borderRadius: 8, fontSize: 13.5, fontWeight: 600,
          }}>{step < 3 ? "Continue" : "Send request"}</button>
        </div>
      </div>
    </div>
  );
}

const PROFILE_TABS = ["about", "portfolio", "reviews", "services", "availability"];

export function ProfilePage({ nav, photographerId, openSpot, params, setParams }) {
  const { photographers: PHOTOGRAPHERS, spots: SPOTS } = useData();
  // Hooks must run on every render — keep useState above any early return.
  const [showQuote, setShowQuote] = useState(false);
  if (!PHOTOGRAPHERS.length) return null;
  const p = PHOTOGRAPHERS.find(x => x.id === photographerId) || PHOTOGRAPHERS[0];
  const photos = PHOTOS.filter(ph => ph.photographerId === p.id);
  const spots = SPOTS.filter(s => p.spots.includes(s.id));
  const tab = PROFILE_TABS.includes(params?.tab) ? params.tab : "about";
  const setTab = (t) => setParams({ tab: t === "about" ? null : t });

  return (
    <div>
      <Nav route="profile" onNav={nav} />

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 28px 0" }}>
        <button onClick={() => nav("search")} style={{
          all: "unset", cursor: "default",
          fontSize: 13, color: "var(--muted)",
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
        }}>← Back to results</button>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, height: 460, borderRadius: "var(--card-radius)", overflow: "hidden" }}>
          <Img src={p.cover} style={{ gridRow: "1 / 3", height: "100%" }} />
          {(() => {
            const fill = [...photos];
            for (const ph of PHOTOS) {
              if (fill.length >= 4) break;
              if (!fill.find(x => x.id === ph.id)) fill.push(ph);
            }
            return fill.slice(0, 4).map((ph, i) => (
              <Img key={ph.id + i} src={ph.url} style={{ height: "100%" }} />
            ));
          })()}
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "24px auto 0", padding: "0 28px",
        display: "grid", gridTemplateColumns: "1fr 360px", gap: 36 }}>
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <Avatar src={p.avatar} initials={p.initials} size={64} />
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>{p.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontSize: 13.5, color: "var(--muted)" }}>
                <Stars rating={p.rating} size={13} />
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.rating.toFixed(1)}</span>
                <span>({p.reviewCount} reviews)</span>
                <span>•</span>
                <VerifiedBadgeInline />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 13, color: "var(--muted)" }}>
                <PinIcon size={12} />
                <span>{p.location}</span>
                <span>•</span>
                <span>Serves {p.serviceArea}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={iconBtn}><ShareIcon /></button>
              <button style={iconBtn}><HeartIcon size={14} /></button>
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0, marginTop: 24,
            borderTop: "1px solid var(--line)",
            borderBottom: "1px solid var(--line)",
            padding: "16px 0",
          }}>
            <Stat label="Starts at" value={`$${p.startingPrice}`} accent />
            <Stat label="Responds in" value={p.responseTime} />
            <Stat label="Member since" value={p.memberSince} />
            <Stat label="Bookings" value={p.bookings} last />
          </div>

          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginTop: 24 }}>
            {["about", "portfolio", "reviews", "services", "availability"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                all: "unset", cursor: "default",
                padding: "10px 14px", fontSize: 13.5, fontWeight: 500,
                color: tab === t ? "var(--accent)" : "var(--muted)",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
                textTransform: "capitalize",
              }}>{t === "services" ? "Services & Pricing" : t}</button>
            ))}
          </div>

          {tab === "about" && (
            <div style={{ paddingTop: 22 }}>
              <h3 style={{ ...sectionH2, marginTop: 0 }}>About</h3>
              <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--text)", lineHeight: 1.6, maxWidth: 680 }}>{p.bio}</p>

              <h3 style={sectionH2}>Styles</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {p.styles.map(s => <Badge key={s}>{s}</Badge>)}
              </div>

              <h3 style={sectionH2}>Services</h3>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {p.services.map(s => <Badge key={s}>{s}</Badge>)}
              </div>

              <h3 style={sectionH2}>Service area</h3>
              <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--text)" }}>
                <PinIcon size={12} /> {p.serviceArea}<br />
                <span style={{ color: "var(--muted)", fontSize: 12.5 }}>Up to {p.distance * 4} miles</span>
              </div>

              <h3 style={sectionH2}>Popular spots</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
                {spots.map(s => <SpotCard key={s.id} spot={s} onOpen={openSpot} />)}
              </div>
            </div>
          )}

          {tab === "portfolio" && (
            <div style={{ paddingTop: 22 }}>
              <h3 style={{ ...sectionH2, marginTop: 0 }}>Portfolio</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
                {[...photos, ...photos].slice(0, 9).map((ph, i) => (
                  <Img key={i} src={ph.url} style={{ aspectRatio: "1 / 1", borderRadius: "calc(var(--card-radius) - 4px)" }} />
                ))}
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div style={{ paddingTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ ...sectionH2, marginTop: 0 }}>{p.reviewCount} reviews</h3>
              {[
                { name: "Maya R.", rating: 5, date: "2 weeks ago", text: "Suman captured our graduation shoot at Chautauqua perfectly. So easy to work with — felt like a friend. Photos arrived in 5 days." },
                { name: "Daniel K.", rating: 5, date: "1 month ago", text: "Booked for an engagement session at Lost Gulch. Patient, kind, and the photos are incredible." },
                { name: "Priya S.", rating: 4.5, date: "2 months ago", text: "Lovely cinematic style. Very responsive over text. Would book again." },
              ].map((r, i) => (
                <div key={i} style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--card-radius)", background: "var(--surface)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                      <Stars rating={r.rating} size={11} />
                      <span>{r.date}</span>
                    </div>
                  </div>
                  <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--text)", lineHeight: 1.55 }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "services" && (
            <div style={{ paddingTop: 22 }}>
              <h3 style={{ ...sectionH2, marginTop: 0 }}>Packages</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
                {[
                  { name: "Mini Session", price: p.startingPrice, dur: "30 min", inc: ["15 edited photos", "1 location", "Online gallery"] },
                  { name: "Standard", price: p.startingPrice * 2, dur: "90 min", inc: ["45 edited photos", "2 locations", "Online gallery", "Print release"] },
                  { name: "Premium", price: p.startingPrice * 4, dur: "3 hours", inc: ["100+ edited photos", "Unlimited locations", "Same-week preview", "Print release"] },
                ].map((pkg, i) => (
                  <div key={i} style={{
                    padding: 18, border: `1px solid ${i === 1 ? "var(--accent)" : "var(--line)"}`,
                    borderRadius: "var(--card-radius)",
                    background: i === 1 ? "color-mix(in oklab, var(--accent) 5%, var(--surface))" : "var(--surface)",
                    position: "relative",
                  }}>
                    {i === 1 && <div style={{ position: "absolute", top: -10, left: 14, padding: "2px 8px", background: "var(--accent)", color: "white", borderRadius: 999, fontSize: 10.5, fontWeight: 600 }}>POPULAR</div>}
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{pkg.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>${pkg.price}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{pkg.dur}</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                      {pkg.inc.map(x => (
                        <li key={x} style={{ fontSize: 12.5, color: "var(--text)", display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ color: "var(--accent)" }}><CheckIcon size={11} /></span>{x}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "availability" && (
            <div style={{ paddingTop: 22 }}>
              <h3 style={{ ...sectionH2, marginTop: 0 }}>Availability — next 4 weeks</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginTop: 14 }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 11.5, color: "var(--muted)", padding: "4px 0", fontWeight: 600 }}>{d}</div>
                ))}
                {Array.from({ length: 28 }).map((_, i) => {
                  const avail = (i * 7) % 11 < 6;
                  return (
                    <div key={i} style={{
                      aspectRatio: "1 / 1", borderRadius: 6,
                      background: avail ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "var(--chip)",
                      color: avail ? "var(--accent)" : "var(--muted)",
                      display: "grid", placeItems: "center",
                      fontSize: 12, fontWeight: 600,
                    }}>{i + 1}</div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: "var(--muted)" }}>
                <span><span style={{ display: "inline-block", width: 10, height: 10, background: "color-mix(in oklab, var(--accent) 10%, transparent)", borderRadius: 3, verticalAlign: "middle", marginRight: 4 }} />Available</span>
                <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--chip)", borderRadius: 3, verticalAlign: "middle", marginRight: 4 }} />Booked</span>
              </div>
            </div>
          )}
        </div>

        <aside style={{ position: "sticky", top: 88, alignSelf: "flex-start" }}>
          <div style={{
            padding: 22, border: "1px solid var(--line)",
            borderRadius: "var(--card-radius)", background: "var(--surface)",
            boxShadow: "0 8px 28px -12px rgba(0,0,0,.10)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.015em" }}>${p.startingPrice}</span>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>starting</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowQuote(true)} style={{
                all: "unset", cursor: "default",
                padding: "12px 0", textAlign: "center",
                background: "var(--accent)", color: "white",
                borderRadius: 8, fontSize: 14, fontWeight: 600,
              }}>Request a quote</button>
              <button style={{
                all: "unset", cursor: "default",
                padding: "12px 0", textAlign: "center",
                background: "var(--surface)", color: "var(--text)",
                border: "1px solid var(--line)",
                borderRadius: 8, fontSize: 14, fontWeight: 600,
              }}>Message</button>
            </div>

            <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Free to request", val: "No booking fee" },
                { label: "Quote in", val: "~2 hours" },
                { label: "Cancellation", val: "Flexible" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "var(--muted)" }}>{r.label}</span>
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: 14, padding: 14,
            border: "1px solid var(--line)", borderRadius: "var(--card-radius)",
            background: "var(--surface)",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "color-mix(in oklab, #2d5d4f 12%, transparent)", color: "#2d5d4f",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 7L7 3L13 9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" fill="none" />
              </svg>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Communication on LensHive stays secure until you're ready to book. <span style={{ color: "var(--text)", fontWeight: 500 }}>Learn more</span>
            </div>
          </div>
        </aside>
      </section>

      {showQuote && <QuoteModal photographer={p} onClose={() => setShowQuote(false)} />}

      <Footer />
    </div>
  );
}
