import { useState } from "react";
import { Nav, Avatar, Badge, Img, Stars, PinIcon, CheckIcon, primaryBtn } from "../components";
import { PHOTOS, OCCASIONS } from "../data";
import { useData } from "../lib/DataContext";

const dashH3 = { margin: 0, fontSize: 14, fontWeight: 600 };
const primaryBtnSm = {
  all: "unset", cursor: "default",
  padding: "8px 16px", background: "var(--accent)", color: "white",
  borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
};
const chipBtnSm = {
  all: "unset", cursor: "default",
  padding: "4px 10px", borderRadius: 999,
  fontSize: 11.5, fontWeight: 500, background: "var(--surface)",
};
const selectStyleD = {
  all: "unset",
  padding: "10px 12px", border: "1px solid var(--line)",
  borderRadius: 8, fontSize: 13.5, background: "var(--bg)",
  width: "100%", boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-.015em" }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function OverviewSection({ me }) {
  return (
    <div>
      <SectionHeader title="Overview" subtitle={`Welcome back, ${me.name.split(" ")[0]}.`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 22 }}>
        {[
          { label: "Profile views", val: "1,284", trend: "+12% this week" },
          { label: "Open inquiries", val: "2", trend: "1 awaiting reply" },
          { label: "Bookings this month", val: "4", trend: "+1 vs last month" },
          { label: "Avg response", val: "2h", trend: "Faster than 84%" },
        ].map(s => (
          <div key={s.label} style={{
            padding: 18, border: "1px solid var(--line)",
            borderRadius: "var(--card-radius)", background: "var(--surface)",
          }}>
            <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, marginTop: 6, letterSpacing: "-.015em" }}>{s.val}</div>
            <div style={{ fontSize: 11.5, color: "var(--accent)", marginTop: 4, fontWeight: 500 }}>{s.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div style={{ padding: 22, border: "1px solid var(--line)", borderRadius: "var(--card-radius)", background: "var(--surface)" }}>
          <h3 style={dashH3}>Recent activity</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column" }}>
            {[
              { who: "Maya R.", what: "requested a quote", when: "2h ago" },
              { who: "Daniel K.", what: "left a 5-star review", when: "1d ago" },
              { who: "Priya S.", what: "saved your profile", when: "2d ago" },
              { who: "LensHive", what: "verified your portfolio", when: "5d ago" },
            ].map((a, i) => (
              <li key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none",
                fontSize: 13,
              }}>
                <span><span style={{ fontWeight: 600 }}>{a.who}</span> <span style={{ color: "var(--muted)" }}>{a.what}</span></span>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{a.when}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ padding: 22, border: "1px solid var(--line)", borderRadius: "var(--card-radius)", background: "var(--surface)" }}>
          <h3 style={dashH3}>Profile completeness</h3>
          <div style={{ marginTop: 14, height: 8, background: "var(--chip)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: "82%", height: "100%", background: "var(--accent)" }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--muted)" }}>82% complete</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { ok: true, t: "Add at least 10 portfolio photos" },
              { ok: true, t: "Set your starting price" },
              { ok: true, t: "Add service area" },
              { ok: false, t: "Connect a payout method" },
              { ok: false, t: "Add 5 more geo-tagged photos" },
            ].map((it, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: it.ok ? "color-mix(in oklab, #2d5d4f 14%, transparent)" : "var(--chip)",
                  color: it.ok ? "#2d5d4f" : "var(--muted)",
                  display: "grid", placeItems: "center",
                }}>{it.ok ? <CheckIcon size={9} /> : "·"}</span>
                <span style={{ color: it.ok ? "var(--muted)" : "var(--text)" }}>{it.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ onClose }) {
  const { spots: SPOTS } = useData();
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(20,18,14,.7)", backdropFilter: "blur(4px)",
      display: "grid", placeItems: "center", padding: 40,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 14,
        width: 560, padding: 28, boxShadow: "0 20px 60px -10px rgba(0,0,0,.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-.015em" }}>Upload photo</h2>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>Add a new piece to your portfolio</div>
          </div>
          <button onClick={onClose} style={{
            all: "unset", cursor: "default",
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--chip)", display: "grid", placeItems: "center",
            color: "var(--muted)", fontSize: 14,
          }}>×</button>
        </div>

        <div style={{
          marginTop: 20, padding: 32, border: "2px dashed var(--line)",
          borderRadius: 12, textAlign: "center", background: "var(--bg)",
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Drop a JPG or PNG here</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>or <span style={{ color: "var(--accent)" }}>browse files</span></div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>Max 20MB. Up to 4000×4000.</div>
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Photo spot">
            <select style={selectStyleD}>
              {SPOTS.map(s => <option key={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Photography type">
            <select style={selectStyleD}>
              {OCCASIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Style tags">
            <input style={selectStyleD} placeholder="Cinematic, True-to-color..." />
          </Field>
          <Field label="Visibility">
            <select style={selectStyleD}><option>Public</option><option>Draft</option></select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{
            all: "unset", cursor: "default",
            padding: "11px 18px", border: "1px solid var(--line)",
            borderRadius: 8, fontSize: 13.5, fontWeight: 600,
          }}>Cancel</button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={primaryBtnSm}>Upload photo</button>
        </div>
      </div>
    </div>
  );
}

function PortfolioSection({ me }) {
  const { spots: SPOTS } = useData();
  const [showUpload, setShowUpload] = useState(false);
  const photos = PHOTOS.filter(p => p.photographerId === me.id);
  const grid = [...photos, ...PHOTOS.slice(0, 12)].slice(0, 18);
  return (
    <div>
      <SectionHeader title="Portfolio" subtitle="Upload, tag, and organize the work you want clients to see." action={
        <button onClick={() => setShowUpload(true)} style={primaryBtnSm}>+ Upload photo</button>
      } />

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {["All", "Geo-tagged", "Untagged", "Featured", "Drafts"].map((t, i) => (
          <button key={t} style={{
            all: "unset", cursor: "default",
            padding: "6px 12px", borderRadius: 999,
            fontSize: 12.5, fontWeight: 500,
            background: i === 0 ? "var(--text)" : "var(--surface)",
            color: i === 0 ? "white" : "var(--text)",
            border: i === 0 ? "none" : "1px solid var(--line)",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 18 }}>
        {grid.map((ph, i) => (
          <div key={i} style={{
            position: "relative", aspectRatio: "1 / 1",
            borderRadius: "calc(var(--card-radius) - 2px)", overflow: "hidden",
            background: "var(--skeleton)",
          }}>
            <Img src={ph.url} style={{ width: "100%", height: "100%" }} />
            <div style={{
              position: "absolute", top: 8, left: 8,
              padding: "3px 8px", background: "rgba(0,0,0,.65)", color: "white",
              borderRadius: 999, fontSize: 10.5, fontWeight: 500,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <PinIcon size={9} color="white" />
              {ph.spotId ? SPOTS.find(s => s.id === ph.spotId)?.name : "Untagged"}
            </div>
            <button style={{
              all: "unset", cursor: "default",
              position: "absolute", top: 8, right: 8,
              width: 26, height: 26, borderRadius: "50%",
              background: "rgba(255,255,255,.9)", color: "var(--text)",
              display: "grid", placeItems: "center", fontSize: 14, fontWeight: 600,
            }}>⋯</button>
          </div>
        ))}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}

function ProfileInfoSection({ me }) {
  return (
    <div>
      <SectionHeader title="Profile info" subtitle="This is what clients see on your public listing." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
        <Field label="Business name"><input defaultValue={me.name} style={selectStyleD} /></Field>
        <Field label="Display name"><input defaultValue="Suman Shrestha" style={selectStyleD} /></Field>
        <Field label="Based in"><input defaultValue={me.location} style={selectStyleD} /></Field>
        <Field label="Service area"><input defaultValue={me.serviceArea} style={selectStyleD} /></Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="About">
            <textarea defaultValue={me.bio} style={{ ...selectStyleD, minHeight: 100, fontFamily: "inherit", resize: "vertical" }} />
          </Field>
        </div>
        <Field label="Styles">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg)" }}>
            {me.styles.map(s => <Badge key={s} kind="accent">{s} ×</Badge>)}
            <button style={{ ...chipBtnSm, color: "var(--muted)" }}>+ Add</button>
          </div>
        </Field>
        <Field label="Services">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 8, border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg)" }}>
            {me.services.map(s => <Badge key={s} kind="accent">{s} ×</Badge>)}
            <button style={{ ...chipBtnSm, color: "var(--muted)" }}>+ Add</button>
          </div>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
        <button style={{ ...primaryBtnSm, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--line)" }}>Discard</button>
        <button style={primaryBtnSm}>Save changes</button>
      </div>
    </div>
  );
}

function ServicesSection({ me }) {
  return (
    <div>
      <SectionHeader title="Services & pricing" subtitle="Build packages and set your starting price." action={
        <button style={primaryBtnSm}>+ New package</button>
      } />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
        {[
          { name: "Mini Session", price: me.startingPrice, dur: "30 min" },
          { name: "Standard", price: me.startingPrice * 2, dur: "90 min" },
          { name: "Premium", price: me.startingPrice * 4, dur: "3 hours" },
        ].map((p, i) => (
          <div key={i} style={{ padding: 18, border: "1px solid var(--line)", borderRadius: "var(--card-radius)", background: "var(--surface)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6 }}>${p.price}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{p.dur}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
              <button style={{ ...chipBtnSm, border: "1px solid var(--line)" }}>Edit</button>
              <button style={{ ...chipBtnSm, color: "var(--muted)" }}>Duplicate</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: 22, border: "1px solid var(--line)", borderRadius: "var(--card-radius)", background: "var(--surface)" }}>
        <h3 style={dashH3}>Public starting price</h3>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>Shown on search results and your profile card.</div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>$</span>
          <input defaultValue={me.startingPrice} style={{ ...selectStyleD, width: 120, fontSize: 18, fontWeight: 600 }} />
          <span style={{ fontSize: 13, color: "var(--muted)" }}>starting</span>
        </div>
      </div>
    </div>
  );
}

function SpotsSection({ me }) {
  const { spots: SPOTS } = useData();
  const myspots = SPOTS.filter(s => me.spots.includes(s.id));
  return (
    <div>
      <SectionHeader title="Photo spots" subtitle="The locations you frequently shoot at. Helps clients find you from spot pages." action={
        <button style={primaryBtnSm}>+ Add spot</button>
      } />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
        {myspots.map(s => (
          <div key={s.id} style={{ border: "1px solid var(--line)", borderRadius: "var(--card-radius)", overflow: "hidden", background: "var(--surface)" }}>
            <Img src={s.image} style={{ width: "100%", aspectRatio: "16 / 10" }} />
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.city}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8 }}>
                {PHOTOS.filter(p => p.photographerId === me.id && p.spotId === s.id).length} of your photos here
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InquiriesSection() {
  const inquiries = [
    { id: 1, name: "Maya R.", occasion: "Graduation", date: "May 22", spot: "Chautauqua Park", budget: "$300–$750", time: "2h ago", unread: true },
    { id: 2, name: "Daniel K.", occasion: "Engagement", date: "Jun 8", spot: "Lost Gulch", budget: "$750–$1,500", time: "1d ago", unread: true },
    { id: 3, name: "Priya S.", occasion: "Family", date: "Jun 14", spot: "Pearl Street", budget: "$150–$300", time: "3d ago" },
  ];
  return (
    <div>
      <SectionHeader title="Inquiries" subtitle="People who've asked for a quote. Respond fast to keep your response score up." />
      <div style={{ marginTop: 22, border: "1px solid var(--line)", borderRadius: "var(--card-radius)", background: "var(--surface)", overflow: "hidden" }}>
        {inquiries.map((q, i) => (
          <div key={q.id} style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 14, alignItems: "center",
            padding: "14px 18px",
            borderTop: i > 0 ? "1px solid var(--line)" : "none",
            background: q.unread ? "color-mix(in oklab, var(--accent) 4%, transparent)" : "transparent",
          }}>
            <Avatar size={36} initials={q.name.split(" ").map(n => n[0]).join("")} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{q.name} {q.unread && <span style={{ marginLeft: 6, padding: "1px 6px", background: "var(--accent)", color: "white", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>NEW</span>}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{q.occasion} • {q.date} at {q.spot} • {q.budget}</div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{q.time}</div>
            <button style={{ ...primaryBtnSm, padding: "7px 14px", fontSize: 12.5 }}>Respond</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsSection({ me }) {
  return (
    <div>
      <SectionHeader title="Reviews" subtitle={`${me.reviewCount} reviews • ${me.rating.toFixed(1)} average rating`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
        {[
          { name: "Maya R.", rating: 5, date: "2 weeks ago", text: "Suman captured our graduation shoot perfectly. So easy to work with." },
          { name: "Daniel K.", rating: 5, date: "1 month ago", text: "Patient, kind, and the photos are incredible." },
          { name: "Priya S.", rating: 4.5, date: "2 months ago", text: "Lovely cinematic style. Would book again." },
          { name: "Alex M.", rating: 5, date: "3 months ago", text: "Great photographer. Highly recommend for family sessions." },
        ].map((r, i) => (
          <div key={i} style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--card-radius)", background: "var(--surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
                <Stars rating={r.rating} size={10} /><span>{r.date}</span>
              </div>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div>
      <SectionHeader title="Settings" subtitle="Account, notifications, and payouts." />
      <div style={{ marginTop: 22, color: "var(--muted)", fontSize: 13.5 }}>
        Account settings would live here.
      </div>
    </div>
  );
}

const DASHBOARD_SECTIONS = ["overview", "portfolio", "profile", "services", "spots", "inquiries", "reviews", "settings"];

export function DashboardPage({ nav, openPhotographer, params, setParams }) {
  const { photographers: PHOTOGRAPHERS } = useData();
  if (!PHOTOGRAPHERS.length) return null;
  const section = DASHBOARD_SECTIONS.includes(params?.section) ? params.section : "portfolio";
  const setSection = (s) => setParams({ section: s === "portfolio" ? null : s });
  const me = PHOTOGRAPHERS[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav route="dashboard" onNav={nav} />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside style={{
          width: 240, flexShrink: 0, padding: "24px 16px",
          borderRight: "1px solid var(--line)", background: "var(--bg)",
        }}>
          <div style={{ padding: "0 8px", marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600, letterSpacing: ".08em" }}>SIGNED IN AS</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              <Avatar src={me.avatar} initials={me.initials} size={36} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name}</div>
                <button onClick={() => openPhotographer(me.id)} style={{
                  all: "unset", cursor: "default", fontSize: 11, color: "var(--accent)", fontWeight: 500,
                  whiteSpace: "nowrap",
                }}>View public profile →</button>
              </div>
            </div>
          </div>

          {[
            { k: "overview", label: "Overview" },
            { k: "portfolio", label: "Portfolio", count: 24 },
            { k: "profile", label: "Profile info" },
            { k: "services", label: "Services & pricing" },
            { k: "spots", label: "Photo spots", count: 3 },
            { k: "inquiries", label: "Inquiries", count: 2, badge: true },
            { k: "reviews", label: "Reviews" },
            { k: "settings", label: "Settings" },
          ].map(item => (
            <button key={item.k} onClick={() => setSection(item.k)} style={{
              all: "unset", cursor: "default",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", fontSize: 13, fontWeight: 500,
              color: section === item.k ? "var(--accent)" : "var(--text)",
              background: section === item.k ? "color-mix(in oklab, var(--accent) 8%, transparent)" : "transparent",
              borderRadius: 6, marginBottom: 2,
            }}>
              <span>{item.label}</span>
              {item.count && <span style={{
                fontSize: 11, fontWeight: 600,
                color: item.badge ? "white" : "var(--muted)",
                background: item.badge ? "var(--accent)" : "transparent",
                padding: item.badge ? "1px 6px" : 0,
                borderRadius: 999,
              }}>{item.count}</span>}
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
          {section === "overview" && <OverviewSection me={me} />}
          {section === "portfolio" && <PortfolioSection me={me} />}
          {section === "profile" && <ProfileInfoSection me={me} />}
          {section === "services" && <ServicesSection me={me} />}
          {section === "spots" && <SpotsSection me={me} />}
          {section === "inquiries" && <InquiriesSection me={me} />}
          {section === "reviews" && <ReviewsSection me={me} />}
          {section === "settings" && <SettingsSection me={me} />}
        </main>
      </div>
    </div>
  );
}
