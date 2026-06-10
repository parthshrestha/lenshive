import { useEffect, useState } from "react";
import { Badge, Nav, PhotographerCard, SpotCard } from "../components";
import { useData } from "../lib/DataContext";
import { useAuth } from "../lib/AuthContext";
import { fetchMySuggestions, submitSuggestion } from "../lib/api";

const SECTIONS = ["overview", "bookings", "inquiries", "saved", "suggest", "settings"];

const NAV_ITEMS = [
  { k: "overview", label: "Overview" },
  { k: "bookings", label: "Bookings" },
  { k: "inquiries", label: "Inquiries" },
  { k: "saved", label: "Saved" },
  { k: "suggest", label: "Suggest a spot" },
  { k: "settings", label: "Settings" },
];

const sidebarBtn = (active) => ({
  all: "unset",
  cursor: "default",
  display: "block",
  padding: "10px 12px",
  marginBottom: 2,
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: active ? 600 : 500,
  color: active ? "var(--accent)" : "var(--text)",
  background: active ? "color-mix(in oklab, var(--accent) 8%, transparent)" : "transparent",
});

const card = {
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: 18,
  background: "var(--surface)",
};

const sectionTitle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 600,
  letterSpacing: "-.015em",
};

const muted = { fontSize: 13, color: "var(--muted)", margin: 0 };

export function UserDashboardPage({ nav, openPhotographer, openSpot, params, setParams }) {
  const { photographers: PHOTOGRAPHERS, spots: SPOTS } = useData();
  const { me } = useAuth();
  const section = SECTIONS.includes(params?.section) ? params.section : "overview";
  const setSection = (s) => setParams({ section: s === "overview" ? null : s });

  // Until real bookings/inquiries land server-side, surface mock featured data
  // so the page has something to render.
  const featured = PHOTOGRAPHERS.slice(0, 3);
  const savedSpots = SPOTS.slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav route="dashboard" onNav={nav} />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside style={{
          width: 240, flexShrink: 0, padding: "24px 16px",
          borderRight: "1px solid var(--line)", background: "var(--bg)",
        }}>
          <div style={{ padding: "0 8px 14px", borderBottom: "1px solid var(--line)", marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Signed in as
            </div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>
              {me?.name || me?.username || "You"}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--muted)" }}>{me?.email}</div>
          </div>
          {NAV_ITEMS.map(item => (
            <button key={item.k} onClick={() => setSection(item.k)} style={sidebarBtn(section === item.k)}>
              {item.label}
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
          {section === "overview" && (
            <OverviewSection
              me={me}
              featured={featured}
              openPhotographer={openPhotographer}
              setSection={setSection}
            />
          )}
          {section === "bookings" && <BookingsSection />}
          {section === "inquiries" && <InquiriesSection />}
          {section === "saved" && (
            <SavedSection
              photographers={featured}
              spots={savedSpots}
              openPhotographer={openPhotographer}
              openSpot={openSpot}
            />
          )}
          {section === "suggest" && <SuggestSpotSection />}
          {section === "settings" && <SettingsSection me={me} />}
        </main>
      </div>
    </div>
  );
}

function OverviewSection({ me, featured, openPhotographer, setSection }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1080 }}>
      <header>
        <h1 style={{ ...sectionTitle, fontSize: 26 }}>
          Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""}.
        </h1>
        <p style={{ ...muted, marginTop: 6 }}>
          Pick up where you left off, or find your next photographer.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard label="Upcoming bookings" value="0" />
        <StatCard label="Open inquiries" value="0" />
        <StatCard label="Saved photographers" value={String(featured.length)} />
      </div>

      <section style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ ...sectionTitle, fontSize: 16 }}>Suggested for you</h2>
          <button onClick={() => setSection("saved")} style={{
            all: "unset", cursor: "default",
            fontSize: 12.5, fontWeight: 600, color: "var(--accent)",
          }}>See saved →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {featured.map(p => <PhotographerCard key={p.id} p={p} onOpen={openPhotographer} />)}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={card}>
      <div style={muted}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>{value}</div>
    </div>
  );
}

function BookingsSection() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={sectionTitle}>Bookings</h1>
      <p style={{ ...muted, marginTop: 8, marginBottom: 18 }}>
        Confirmed sessions live here once a photographer accepts your inquiry.
      </p>
      <EmptyState
        title="No bookings yet"
        body="When a photographer confirms your request, the date and details will show up here."
      />
    </div>
  );
}

function InquiriesSection() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={sectionTitle}>Inquiries</h1>
      <p style={{ ...muted, marginTop: 8, marginBottom: 18 }}>
        Track the quote requests you've sent and what photographers replied.
      </p>
      <EmptyState
        title="No inquiries yet"
        body="Use “Request quote” on any photographer's profile to start a conversation."
      />
    </div>
  );
}

function SavedSection({ photographers, spots, openPhotographer, openSpot }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1080 }}>
      <header>
        <h1 style={sectionTitle}>Saved</h1>
        <p style={{ ...muted, marginTop: 8 }}>Photographers and photo spots you've bookmarked.</p>
      </header>

      <section>
        <h2 style={{ ...sectionTitle, fontSize: 16, marginBottom: 12 }}>Photographers</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {photographers.map(p => <PhotographerCard key={p.id} p={p} onOpen={openPhotographer} />)}
        </div>
      </section>

      <section>
        <h2 style={{ ...sectionTitle, fontSize: 16, marginBottom: 12 }}>Photo spots</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {spots.map(s => <SpotCard key={s.id} spot={s} onOpen={openSpot} />)}
        </div>
      </section>
    </div>
  );
}

const suggestInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13.5,
  outline: "none",
};

const suggestLabel = {
  display: "block",
  marginBottom: 5,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".05em",
};

// Users pitch new photo spots here; admins review them in the admin
// dashboard and approved ones become real locations.
function SuggestSpotSection() {
  const [form, setForm] = useState({ name: "", city: "", notes: "" });
  const [mine, setMine] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchMySuggestions().then(setMine).catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      setError("Please fill in the spot name and city.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const created = await submitSuggestion({
        name: form.name.trim(),
        city: form.city.trim(),
        notes: form.notes.trim(),
      });
      setMine(prev => [created, ...prev]);
      setForm({ name: "", city: "", notes: "" });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const statusKind = { pending: "accent", approved: "verified", rejected: "outline" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <header>
        <h1 style={sectionTitle}>Suggest a photo spot</h1>
        <p style={{ ...muted, marginTop: 8 }}>
          Know a great location that's missing? Tell us about it — our team reviews
          every suggestion and adds the best ones to LensHive.
        </p>
      </header>

      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={suggestLabel}>Spot name</label>
            <input
              style={suggestInput}
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setSent(false); }}
              placeholder="Chautauqua Park"
            />
          </div>
          <div>
            <label style={suggestLabel}>City</label>
            <input
              style={suggestInput}
              value={form.city}
              onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setSent(false); }}
              placeholder="Boulder, CO"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={suggestLabel}>Why is it great?</label>
            <textarea
              style={{ ...suggestInput, resize: "vertical", fontFamily: "inherit" }}
              rows={3}
              value={form.notes}
              onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setSent(false); }}
              placeholder="Wildflowers in June, mountain backdrop, free parking…"
            />
          </div>
        </div>
        {error && <div style={{ marginTop: 12, fontSize: 13, color: "#b3261e" }}>{error}</div>}
        {sent && !error && <div style={{ marginTop: 12, fontSize: 13, color: "#2d5d4f" }}>Thanks! Your suggestion is in the review queue.</div>}
        <button
          onClick={submit}
          disabled={sending}
          style={{
            all: "unset", cursor: "default", marginTop: 16, display: "inline-block",
            background: "var(--accent)", color: "white", padding: "8px 16px",
            borderRadius: 8, fontSize: 13, fontWeight: 600, opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? "Sending…" : "Submit suggestion"}
        </button>
      </div>

      {mine.length > 0 && (
        <section>
          <h2 style={{ ...sectionTitle, fontSize: 16, marginBottom: 12 }}>Your suggestions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mine.map(s => (
              <div key={s.id} style={{ ...card, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 12.5, color: "var(--muted)", marginLeft: 8 }}>{s.city}</span>
                </div>
                <Badge kind={statusKind[s.status] || "default"}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SettingsSection({ me }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={sectionTitle}>Account settings</h1>
      <p style={{ ...muted, marginTop: 8, marginBottom: 18 }}>
        These come from your Cognito profile.
      </p>
      <div style={card}>
        <Row label="Username" value={me?.username} />
        <Row label="Display name" value={me?.name} />
        <Row label="Email" value={me?.email} />
        <Row label="Role" value={me?.role || "user"} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: "36px 18px" }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={muted}>{body}</div>
    </div>
  );
}
