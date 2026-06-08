import { useState } from "react";
import { Nav, Footer, Img, SearchIcon, HiveMark, SpotCard, PhotographerCard } from "../components";
import { CATEGORIES } from "../data";
import { useData } from "../lib/DataContext";
import { useAuth } from "../lib/AuthContext";

function CategoryGlyph({ k }) {
  const stroke = "var(--accent)";
  const sw = 1.6;
  const paths = {
    graduation: <g><path d="M2 9 L12 4 L22 9 L12 14 Z" /><path d="M7 11 L7 16 C7 17.5 10 18 12 18 C14 18 17 17.5 17 16 L17 11" /><path d="M22 9 L22 14" /></g>,
    wedding: <g><circle cx="9" cy="14" r="5" /><circle cx="15" cy="14" r="5" /></g>,
    family: <g><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M3 20 C3 16 5 14 8 14 C11 14 13 16 13 20" /><path d="M11 20 C11 16 13 14 16 14 C19 14 21 16 21 20" /></g>,
    headshots: <g><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M9 6 L10 4 L14 4 L15 6" /></g>,
    engagement: <g><path d="M12 20 C 5 14 3 10 6 7 C 9 4 12 8 12 8 C 12 8 15 4 18 7 C 21 10 19 14 12 20 Z" /></g>,
    events: <g><path d="M5 4 L12 18 L19 4 L17 4 L12 14 L7 4 Z" /><path d="M9 4 L15 4" /></g>,
    automotive: <g><path d="M3 14 L5 9 L19 9 L21 14 L21 18 L3 18 Z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></g>,
    realestate: <g><path d="M3 11 L12 4 L21 11 L21 20 L3 20 Z" /><path d="M9 20 L9 14 L15 14 L15 20" /></g>,
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths[k] || <circle cx="12" cy="12" r="6" />}
    </svg>
  );
}

function CategoryTile({ cat, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "default",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      padding: "22px 12px", borderRadius: "var(--card-radius)",
      background: "var(--surface)", border: "1px solid var(--line)",
      transition: "border-color .15s, transform .15s",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "color-mix(in oklab, var(--accent) 12%, transparent)",
        display: "grid", placeItems: "center", fontSize: 16,
      }}>
        <CategoryGlyph k={cat.key} />
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{cat.label}</div>
    </button>
  );
}

export function HomePage({ nav, openSpot, openPhotographer, params, setParams }) {
  const { photographers: PHOTOGRAPHERS, spots: SPOTS } = useData();
  const { me } = useAuth();
  const tab = params?.tab === "photographer" ? "photographer" : "spot";
  const setTab = (k) => setParams({ tab: k === "spot" ? null : k });
  const [q, setQ] = useState("");

  // "FOR PHOTOGRAPHERS" CTA: signed-in users go to their dashboard
  // (DashboardRoute dispatches creator vs user view); signed-out users land
  // on the signup form with the photographer role pre-selected.
  const onPhotographerCta = () => {
    if (me) nav("dashboard");
    else nav("signup", null, { params: { role: "photographer" } });
  };
  const popular = tab === "spot"
    ? ["Chautauqua Park", "Red Rocks", "Pearl Street", "Lost Gulch"]
    : ["Graduation", "Wedding", "Family", "Headshots"];

  return (
    <div>
      <Nav route="home" onNav={nav} />

      <section className="" style={{ position: "relative", padding: "0 28px", marginTop: 6 }}>
        <div style={{
          position: "relative",
          maxWidth: 1400, margin: "0 auto",
          borderRadius: 20, overflow: "hidden",
          height: 540, display: "flex", alignItems: "stretch",
          background: "#f1ece4",
        }}>
          <div style={{ flex: "0 0 50%", padding: "56px 56px 48px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
            <h1 style={{
              margin: 0, fontSize: 56, lineHeight: 1.05, fontWeight: 600, letterSpacing: "-.025em",
              color: "var(--text)",
            }}>
              Find the right<br />
              <span style={{ color: "var(--accent)" }}>photographer</span><br />
              for every moment.
            </h1>
            <p style={{ margin: 0, fontSize: 16, color: "var(--muted)", maxWidth: 460, lineHeight: 1.5 }}>
              Browse real photo examples from local spots and connect with the photographer who captured them.
            </p>
            <div className="bg-amber-50 rounded-2xl">
              <div className="p-0, bg-gray-500, flex-row ">
              {/* <div className="p-4, bg-gray-500, flex-row border-4" /*style={{ display: "flex", gap: 4, padding: 4, background: "rgba(255,255,255,.7)", borderRadius: 999, alignSelf: "flex-start" }}/ > */}
              {[
                { k: "spot", label: "Search by Spot" },
                { k: "photographer", label: "Search by Photographer" },
              ].map(t => (
                <button key={t.k} onClick={() => setTab(t.k)} style={{
                  all: "unset", cursor: "default",
                  padding: "8px 16px", borderRadius: 999,
                  fontSize: 13, fontWeight: 600,
                  background: tab === t.k ? "white" : "transparent",
                  color: tab === t.k ? "var(--accent)" : "var(--muted)",
                  boxShadow: tab === t.k ? "0 1px 3px rgba(0,0,0,.06)" : "none",
                }}>{t.label}</button>
              ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); nav("search", { q, kind: tab }); }} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: 6, background: "white", borderRadius: 12,
              boxShadow: "0 6px 24px -10px rgba(0,0,0,.15)",
            }}>
              <div style={{ paddingLeft: 12, color: "var(--muted)" }}><SearchIcon size={16} /></div>
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tab === "spot" ? 'Try "Chautauqua Park, Boulder"' : 'Try "Wedding photographer in Denver"'}
                style={{
                  all: "unset", flex: 1, fontSize: 14, padding: "10px 4px",
                  color: "var(--text)",
                }} />
              <button type="submit" style={{
                all: "unset", cursor: "default",
                padding: "10px 22px", background: "var(--accent)", color: "white",
                borderRadius: 8, fontSize: 14, fontWeight: 600,
              }}>Search</button>
            </form>
            </div>
            

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" }}>
              <span>Popular:</span>
              {popular.map(p => (
                <button key={p} onClick={() => nav("search", { q: p, kind: tab })} style={{
                  all: "unset", cursor: "default",
                  padding: "4px 10px", background: "rgba(255,255,255,.6)",
                  border: "1px solid rgba(0,0,0,.06)",
                  borderRadius: 999, fontSize: 12, color: "var(--text)",
                }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, position: "relative", minHeight: 540 }}>
            <Img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1600&q=80"
              style={{ position: "absolute", inset: 0, height: "100%" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #f1ece4 0%, rgba(241,236,228,0) 30%)" }} />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "48px auto 0", padding: "0 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
          padding: "28px 8px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          {[
            { n: "01", t: "Search by Photo Spot", d: "Explore popular locations and see the real photos taken there." },
            { n: "02", t: "Find Your Photographer", d: "Browse portfolios, styles, and reviews tied to actual work." },
            { n: "03", t: "Book with Confidence", d: "Verified photographers. Honest reviews. Transparent pricing." },
            { n: "04", t: "Capture Your Moment", d: "Communicate, plan, and remember it all in one place." },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", gap: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", letterSpacing: ".06em", paddingTop: 3 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>{s.t}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "56px auto 0", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-.015em" }}>Popular Photo Spots</h2>
          <button onClick={() => nav("spot", "chautauqua")} style={{
            all: "unset", cursor: "default", fontSize: 13, color: "var(--accent)", fontWeight: 600,
          }}>View all spots →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
          {SPOTS.slice(0, 5).map(s => <SpotCard key={s.id} spot={s} onOpen={openSpot} />)}
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "64px auto 0", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-.015em" }}>Browse by Occasion</h2>
          <button onClick={() => nav("search")} style={{
            all: "unset", cursor: "default", fontSize: 13, color: "var(--accent)", fontWeight: 600,
          }}>View all categories →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12 }}>
          {CATEGORIES.map(c => <CategoryTile key={c.key} cat={c} onClick={() => nav("search", { q: c.label })} />)}
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "64px auto 0", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-.015em" }}>Featured Photographers near Boulder</h2>
          <button onClick={() => nav("search")} style={{
            all: "unset", cursor: "default", fontSize: 13, color: "var(--accent)", fontWeight: 600,
          }}>See all →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {PHOTOGRAPHERS.slice(0, 4).map(p => (
            <PhotographerCard key={p.id} p={p} onOpen={openPhotographer} />
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "72px auto 0", padding: "0 28px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 24,
          padding: "28px 32px", borderRadius: "var(--card-radius)",
          background: "#1f3a32", color: "white",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".08em", opacity: .7, marginBottom: 6 }}>FOR PHOTOGRAPHERS</div>
            <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 600, letterSpacing: "-.015em" }}>List your work. Get found by the right clients.</h3>
            <div style={{ fontSize: 13.5, opacity: .8 }}>Free to join. Show your portfolio tied to the real locations you shoot.</div>
          </div>
          <button onClick={onPhotographerCta} style={{
            all: "unset", cursor: "default",
            padding: "12px 22px", background: "white", color: "#1f3a32",
            borderRadius: 8, fontSize: 14, fontWeight: 600,
          }}>Create your profile</button>
          <button style={{
            all: "unset", cursor: "default",
            padding: "12px 22px", color: "white", border: "1px solid rgba(255,255,255,.3)",
            borderRadius: 8, fontSize: 14, fontWeight: 600,
          }}>Learn more</button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
