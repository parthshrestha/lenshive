import { useCallback, useEffect, useState } from "react";
import { Badge, LocationPicker, Nav } from "../components";
import { useAuth } from "../lib/AuthContext";
import {
  adminCreateSpot,
  adminDeleteSpot,
  adminListSuggestions,
  adminSetSuggestionStatus,
  adminUpdateSpot,
  fetchSpots,
} from "../lib/api";

const SECTIONS = ["locations", "suggestions"];

const NAV_ITEMS = [
  { k: "locations", label: "Locations" },
  { k: "suggestions", label: "Suggestions" },
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

const primaryBtn = {
  all: "unset",
  cursor: "default",
  background: "var(--accent)",
  color: "white",
  padding: "8px 16px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
};

const ghostBtn = {
  all: "unset",
  cursor: "default",
  padding: "7px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text)",
  border: "1px solid var(--line)",
  background: "var(--surface)",
};

const dangerBtn = { ...ghostBtn, color: "#b3261e" };

const inputStyle = {
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

const labelStyle = {
  display: "block",
  marginBottom: 5,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: ".05em",
};

const EMPTY_FORM = { name: "", city: "", image: "", bestTime: "", notes: "", bestFor: "", lat: "", lng: "", placeId: "" };

export function AdminDashboardPage({ nav, params, setParams }) {
  const { me } = useAuth();
  const section = SECTIONS.includes(params?.section) ? params.section : "locations";
  const setSection = (s) => setParams({ section: s === "locations" ? null : s });

  const [spots, setSpots] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // Add/edit form state. `editingSlug` set → editing that spot;
  // `fromSuggestionId` set → saving also marks that suggestion approved.
  const [form, setForm] = useState(null);
  const [editingSlug, setEditingSlug] = useState(null);
  const [fromSuggestionId, setFromSuggestionId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  // Existing spot matching the picked place — blocks save so the catalog
  // can't get two rows for one physical location.
  const [duplicateOf, setDuplicateOf] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [spotList, suggestionList] = await Promise.all([fetchSpots(), adminListSuggestions()]);
      setSpots(spotList);
      setSuggestions(suggestionList);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const openAddForm = (prefill = {}, suggestionId = null) => {
    setForm({ ...EMPTY_FORM, ...prefill });
    setEditingSlug(null);
    setFromSuggestionId(suggestionId);
    setFormError(null);
    setDuplicateOf(null);
    setSection("locations");
  };

  const openEditForm = (spot) => {
    setForm({
      name: spot.name,
      city: spot.city,
      image: spot.image || "",
      bestTime: spot.bestTime || "",
      notes: spot.notes || "",
      bestFor: (spot.bestFor || []).join(", "),
      lat: String(spot.lat),
      lng: String(spot.lng),
      placeId: spot.placeId || "",
    });
    setEditingSlug(spot.id);
    setFromSuggestionId(null);
    setFormError(null);
    setDuplicateOf(null);
  };

  const closeForm = () => {
    setForm(null);
    setEditingSlug(null);
    setFromSuggestionId(null);
    setFormError(null);
    setDuplicateOf(null);
  };

  // A Google place was picked: fill the form from it and flag if it's
  // already in the catalog (ignoring the spot currently being edited).
  const onPlacePicked = (picked, dup) => {
    if (!picked) return;
    setForm(f => ({
      ...f,
      name: picked.name,
      city: picked.city,
      lat: String(picked.lat),
      lng: String(picked.lng),
      placeId: picked.placeId || "",
    }));
    setDuplicateOf(dup && dup.id !== editingSlug ? dup : null);
  };

  const saveForm = async () => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (!form.name.trim() || !form.city.trim()) { setFormError("Name and city are required."); return; }
    if (Number.isNaN(lat) || Number.isNaN(lng)) { setFormError("Latitude and longitude must be numbers."); return; }
    if (duplicateOf) { setFormError(`“${duplicateOf.name}” already covers this location.`); return; }
    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      image: form.image.trim(),
      bestTime: form.bestTime.trim(),
      notes: form.notes.trim(),
      bestFor: form.bestFor.split(",").map(s => s.trim()).filter(Boolean),
      lat,
      lng,
      placeId: form.placeId || null,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editingSlug) {
        await adminUpdateSpot(editingSlug, payload);
      } else {
        await adminCreateSpot(payload);
        if (fromSuggestionId != null) {
          await adminSetSuggestionStatus(fromSuggestionId, "approved");
        }
      }
      closeForm();
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeSpot = async (spot) => {
    if (!window.confirm(`Delete "${spot.name}"? Photographers tagged to it will lose the link.`)) return;
    try {
      await adminDeleteSpot(spot.id);
      await reload();
    } catch (err) {
      setLoadError(err.message);
    }
  };

  const rejectSuggestion = async (s) => {
    try {
      await adminSetSuggestionStatus(s.id, "rejected");
      await reload();
    } catch (err) {
      setLoadError(err.message);
    }
  };

  const approveSuggestion = (s) => {
    // Prefill the add-location form from the suggestion; it's marked
    // approved once the location is actually saved.
    openAddForm(
      {
        name: s.name,
        city: s.city,
        notes: s.notes || "",
        lat: s.lat != null ? String(s.lat) : "",
        lng: s.lng != null ? String(s.lng) : "",
      },
      s.id,
    );
  };

  const pendingCount = suggestions.filter(s => s.status === "pending").length;

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
              Admin
            </div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600 }}>
              {me?.name || me?.username || "Admin"}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--muted)" }}>{me?.email}</div>
          </div>
          {NAV_ITEMS.map(item => (
            <button key={item.k} onClick={() => setSection(item.k)} style={sidebarBtn(section === item.k)}>
              {item.label}
              {item.k === "suggestions" && pendingCount > 0 && (
                <span style={{
                  marginLeft: 8, padding: "1px 7px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: "var(--accent)", color: "white",
                }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </aside>

        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
          {loadError && (
            <div style={{ ...card, marginBottom: 18, borderColor: "#b3261e55", color: "#b3261e", fontSize: 13, maxWidth: 1080 }}>
              {loadError}
            </div>
          )}

          {section === "locations" && (
            <LocationsSection
              spots={spots}
              form={form}
              setForm={setForm}
              editingSlug={editingSlug}
              saving={saving}
              formError={formError}
              duplicateOf={duplicateOf}
              onPlacePicked={onPlacePicked}
              onAdd={() => openAddForm()}
              onEdit={openEditForm}
              onDelete={removeSpot}
              onSave={saveForm}
              onCancel={closeForm}
            />
          )}
          {section === "suggestions" && (
            <SuggestionsSection
              suggestions={suggestions}
              onApprove={approveSuggestion}
              onReject={rejectSuggestion}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function LocationsSection({ spots, form, setForm, editingSlug, saving, formError, duplicateOf, onPlacePicked, onAdd, onEdit, onDelete, onSave, onCancel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1080 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={sectionTitle}>Locations</h1>
          <p style={{ ...muted, marginTop: 6 }}>
            Photo spots photographers can tag their photos to. {spots.length} total.
          </p>
        </div>
        {!form && <button onClick={onAdd} style={primaryBtn}>+ Add location</button>}
      </header>

      {form && (
        <section style={card} aria-label={editingSlug ? "Edit location" : "Add location"}>
          <h2 style={{ ...sectionTitle, fontSize: 16, marginBottom: 14 }}>
            {editingSlug ? `Edit “${form.name || editingSlug}”` : "Add a location"}
          </h2>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Find the place</label>
            <LocationPicker
              spots={spots}
              onSelect={onPlacePicked}
              placeholder="Search Google Maps — fills name, city & coordinates"
            />
            {duplicateOf && (
              <div style={{
                marginTop: 10, padding: "10px 12px", borderRadius: 9, fontSize: 13,
                border: "1px solid color-mix(in oklab, var(--accent) 40%, transparent)",
                background: "color-mix(in oklab, var(--accent) 7%, transparent)",
              }}>
                <strong>{duplicateOf.name}</strong> ({duplicateOf.city}) already covers this location
                — it can't be added twice. Edit the existing entry instead.
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Chautauqua Park" />
            <Field label="City" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Boulder, CO" />
            <Field label="Image URL" value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} placeholder="https://…" />
            <Field label="Best time" value={form.bestTime} onChange={v => setForm(f => ({ ...f, bestTime: v }))} placeholder="Golden hour" />
            <Field label="Latitude" value={form.lat} onChange={v => setForm(f => ({ ...f, lat: v }))} placeholder="39.9986" />
            <Field label="Longitude" value={form.lng} onChange={v => setForm(f => ({ ...f, lng: v }))} placeholder="-105.2817" />
            <Field label="Best for (comma-separated)" value={form.bestFor} onChange={v => setForm(f => ({ ...f, bestFor: v }))} placeholder="Engagement, Graduation" />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                placeholder="Parking, permits, lighting tips…"
              />
            </div>
          </div>
          {formError && <div style={{ marginTop: 12, fontSize: 13, color: "#b3261e" }}>{formError}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={onSave}
              style={{ ...primaryBtn, opacity: saving || duplicateOf ? 0.5 : 1 }}
              disabled={saving || !!duplicateOf}
            >
              {saving ? "Saving…" : editingSlug ? "Save changes" : "Add location"}
            </button>
            <button onClick={onCancel} style={ghostBtn}>Cancel</button>
          </div>
        </section>
      )}

      <section style={{ ...card, padding: 0, overflow: "hidden" }}>
        {spots.length === 0 ? (
          <div style={{ padding: "36px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No locations yet</div>
            <div style={muted}>Add the first photo spot photographers can tag.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)", fontSize: 12 }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Best for</th>
                <th style={thStyle}>Photographers</th>
                <th style={thStyle}>Coordinates</th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {spots.map(s => (
                <tr key={s.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                  <td style={tdStyle}>{s.city}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(s.bestFor || []).map(b => <Badge key={b}>{b}</Badge>)}
                    </div>
                  </td>
                  <td style={tdStyle}>{s.photographerCount}</td>
                  <td style={{ ...tdStyle, color: "var(--muted)", fontSize: 12.5 }}>
                    {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button onClick={() => onEdit(s)} style={{ ...ghostBtn, padding: "5px 10px", marginRight: 6 }}>Edit</button>
                    <button onClick={() => onDelete(s)} style={{ ...dangerBtn, padding: "5px 10px" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function SuggestionsSection({ suggestions, onApprove, onReject }) {
  const statusKind = { pending: "accent", approved: "verified", rejected: "outline" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 880 }}>
      <header>
        <h1 style={sectionTitle}>Suggestions</h1>
        <p style={{ ...muted, marginTop: 6 }}>
          Locations users think should be on LensHive. Approving opens the add-location form prefilled.
        </p>
      </header>

      {suggestions.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "36px 18px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No suggestions yet</div>
          <div style={muted}>When users suggest photo spots, they'll show up here for review.</div>
        </div>
      ) : (
        suggestions.map(s => (
          <article key={s.id} style={card}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{s.city}</span>
                  <Badge kind={statusKind[s.status] || "default"}>{s.status}</Badge>
                </div>
                {s.notes && <p style={{ ...muted, marginTop: 8, lineHeight: 1.5 }}>{s.notes}</p>}
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                  {s.suggestedBy ? `Suggested by ${s.suggestedBy.name} (${s.suggestedBy.email})` : "Suggested by a former user"}
                  {s.createdAt ? ` · ${new Date(s.createdAt).toLocaleDateString()}` : ""}
                  {s.lat != null && s.lng != null ? ` · ${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)}` : ""}
                </div>
              </div>
              {s.status === "pending" && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => onApprove(s)} style={primaryBtn}>Approve & add</button>
                  <button onClick={() => onReject(s)} style={dangerBtn}>Reject</button>
                </div>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

const thStyle = { padding: "12px 16px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" };
const tdStyle = { padding: "12px 16px", verticalAlign: "top" };

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}
