import { useEffect, useMemo, useState } from "react";
import { HiveMark } from "../components/ui.jsx";
import { useAuth } from "../lib/AuthContext";
import { submitOnboarding } from "../lib/api";

// ---------- question definitions ----------

const CLIENT_OCCASIONS = ["Graduation", "Engagement", "Wedding", "Family", "Portraits", "Events", "Brand / Content", "Just exploring"];
const CLIENT_BUDGETS = ["Under $150", "$150 – $300", "$300 – $750", "$750 – $1,500", "$1,500+"];
const CLIENT_TIMELINES = ["As soon as possible", "Within 1–3 months", "Later this year", "Just browsing"];
const CLIENT_STYLES = ["True-to-color", "Cinematic", "Light & airy", "Dark & moody", "Documentary", "Editorial"];

const PHOTOG_EXPERIENCE = ["Just starting out", "1–3 years", "3–7 years", "7+ years"];
const PHOTOG_SPECIALTIES = ["Graduation", "Engagement", "Wedding", "Family", "Portraits", "Events", "Brand / Content", "Real estate", "Automotive"];
const PHOTOG_STYLES = ["True-to-color", "Cinematic", "Light & airy", "Dark & moody", "Documentary", "Editorial"];
const PHOTOG_GOALS = ["Get more clients", "Showcase my portfolio", "Manage bookings & scheduling", "Get paid online", "Be found at photo spots", "Connect with other creators"];
const PHOTOG_VOLUME = ["This would be my first paid work", "1–3 shoots a month", "4–10 shoots a month", "10+ shoots a month"];

// ---------- styles ----------

const wrap = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "32px 20px",
  background: "var(--bg)",
};
const card = {
  width: "min(640px, 100%)",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 18,
  padding: "36px 40px",
  boxShadow: "0 18px 50px -18px rgba(20,16,8,.18)",
};
const h1 = { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-.015em" };
const sub = { margin: "8px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 };
const qLabel = { display: "block", margin: "22px 0 10px", fontSize: 13.5, fontWeight: 600 };
const chipRow = { display: "flex", flexWrap: "wrap", gap: 8 };
const chip = (on) => ({
  all: "unset", cursor: "default",
  padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
  background: on ? "var(--accent)" : "var(--chip)",
  color: on ? "white" : "var(--text)",
  transition: "background 150ms ease, color 150ms ease",
});
const textInput = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px", borderRadius: 10,
  border: "1px solid var(--line)", background: "var(--bg)",
  color: "var(--text)", fontSize: 13.5, outline: "none",
};
const primaryBtn = (disabled) => ({
  all: "unset", cursor: "default",
  padding: "12px 28px", borderRadius: 10,
  background: "var(--accent)", color: "white",
  fontSize: 14, fontWeight: 600,
  opacity: disabled ? 0.5 : 1,
});
const ghostBtn = {
  all: "unset", cursor: "default",
  padding: "12px 20px", borderRadius: 10,
  border: "1px solid var(--line)", color: "var(--text)",
  fontSize: 14, fontWeight: 600,
};
const errStyle = {
  marginTop: 14, fontSize: 12.5, color: "#b3261e",
  background: "rgba(179,38,30,.06)", padding: "8px 10px", borderRadius: 8,
};

function Chips({ options, value, onChange, multi = true }) {
  const toggle = (opt) => {
    if (!multi) { onChange([opt]); return; }
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  };
  return (
    <div style={chipRow}>
      {options.map(opt => (
        <button key={opt} style={chip(value.includes(opt))} onClick={() => toggle(opt)} aria-pressed={value.includes(opt)}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function Progress({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 999,
          background: i <= step ? "var(--accent)" : "var(--chip)",
          transition: "background 200ms ease",
        }} />
      ))}
    </div>
  );
}

// ---------- per-role steps ----------

function ClientSteps({ step, a, set }) {
  if (step === 0) {
    return (
      <>
        <h1 style={h1}>What brings you to LensHive?</h1>
        <p style={sub}>We'll use this to suggest the right photographers. Pick all that apply.</p>
        <label style={qLabel}>I'm looking for photos for…</label>
        <Chips options={CLIENT_OCCASIONS} value={a.occasions} onChange={v => set({ occasions: v })} />
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <h1 style={h1}>Budget & timing</h1>
        <p style={sub}>No commitment — this just helps us show realistic matches first.</p>
        <label style={qLabel}>Typical budget per session</label>
        <Chips options={CLIENT_BUDGETS} value={a.budget ? [a.budget] : []} onChange={v => set({ budget: v[0] })} multi={false} />
        <label style={qLabel}>When do you need a photographer?</label>
        <Chips options={CLIENT_TIMELINES} value={a.timeline ? [a.timeline] : []} onChange={v => set({ timeline: v[0] })} multi={false} />
      </>
    );
  }
  return (
    <>
      <h1 style={h1}>Your style</h1>
      <p style={sub}>Photographers on LensHive tag their work by style — pick what you're drawn to.</p>
      <label style={qLabel}>Preferred styles</label>
      <Chips options={CLIENT_STYLES} value={a.styles} onChange={v => set({ styles: v })} />
      <label style={qLabel}>Anything else we should know? (optional)</label>
      <textarea
        style={{ ...textInput, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
        placeholder="e.g. outdoor sunset shoot for two, dog included…"
        value={a.notes}
        onChange={e => set({ notes: e.target.value })}
      />
    </>
  );
}

function PhotographerSteps({ step, a, set }) {
  if (step === 0) {
    return (
      <>
        <h1 style={h1}>Tell us about your business</h1>
        <p style={sub}>This bootstraps your public LensHive profile — you can edit everything later.</p>
        <label style={qLabel}>Business or display name</label>
        <input style={textInput} placeholder="Aspen Light Photography" value={a.businessName} onChange={e => set({ businessName: e.target.value })} />
        <label style={qLabel}>Where are you based?</label>
        <input style={textInput} placeholder="Boulder, CO" value={a.location} onChange={e => set({ location: e.target.value })} />
        <label style={qLabel}>How long have you been shooting professionally?</label>
        <Chips options={PHOTOG_EXPERIENCE} value={a.experience ? [a.experience] : []} onChange={v => set({ experience: v[0] })} multi={false} />
      </>
    );
  }
  if (step === 1) {
    return (
      <>
        <h1 style={h1}>Your work</h1>
        <p style={sub}>Clients filter by specialty and style — pick what you want to be found for.</p>
        <label style={qLabel}>Specialties</label>
        <Chips options={PHOTOG_SPECIALTIES} value={a.specialties} onChange={v => set({ specialties: v })} />
        <label style={qLabel}>Styles</label>
        <Chips options={PHOTOG_STYLES} value={a.styles} onChange={v => set({ styles: v })} />
        <label style={qLabel}>Starting price per session (USD)</label>
        <input
          style={{ ...textInput, width: 180 }} type="number" min="0" placeholder="150"
          value={a.startingPrice} onChange={e => set({ startingPrice: e.target.value })}
        />
      </>
    );
  }
  return (
    <>
      <h1 style={h1}>How can LensHive help?</h1>
      <p style={sub}>We'll shape your dashboard around what matters to you.</p>
      <label style={qLabel}>I want LensHive to help me…</label>
      <Chips options={PHOTOG_GOALS} value={a.goals} onChange={v => set({ goals: v })} />
      <label style={qLabel}>How much paid work are you doing today?</label>
      <Chips options={PHOTOG_VOLUME} value={a.volume ? [a.volume] : []} onChange={v => set({ volume: v[0] })} multi={false} />
      <label style={qLabel}>Short bio for your profile (optional)</label>
      <textarea
        style={{ ...textInput, minHeight: 70, resize: "vertical", fontFamily: "inherit" }}
        placeholder="What you shoot, what working with you is like…"
        value={a.bio}
        onChange={e => set({ bio: e.target.value })}
      />
    </>
  );
}

// ---------- page ----------

const TOTAL_STEPS = 3;

export function OnboardingPage({ nav }) {
  const { me, loading, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isCreator = me?.role === "photographer" || me?.role === "videographer";

  const [answers, setAnswers] = useState({
    // client
    occasions: [], budget: null, timeline: null, notes: "",
    // photographer
    businessName: "", location: "", experience: null,
    specialties: [], startingPrice: "", goals: [], volume: null, bio: "",
    // shared
    styles: [],
  });
  const set = (patch) => setAnswers(prev => ({ ...prev, ...patch }));

  // Per-step "can continue" rules — light-touch, only the essentials.
  const canContinue = useMemo(() => {
    if (!isCreator) {
      if (step === 0) return answers.occasions.length > 0;
      if (step === 1) return !!answers.budget && !!answers.timeline;
      return true;
    }
    if (step === 0) return answers.businessName.trim().length > 0 && answers.location.trim().length > 0;
    if (step === 1) return answers.specialties.length > 0;
    return answers.goals.length > 0;
  }, [isCreator, step, answers]);

  // Signed out → login; already onboarded → dashboard. (Effect, not render-time nav.)
  useEffect(() => {
    if (loading) return;
    if (!me) nav("login");
    else if (me.onboarded) nav("dashboard");
  }, [loading, me, nav]);

  if (loading || !me || me.onboarded) return null;

  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      const role = me.role;
      const payload = isCreator
        ? {
            role,
            businessName: answers.businessName.trim(),
            location: answers.location.trim(),
            experience: answers.experience,
            specialties: answers.specialties,
            styles: answers.styles,
            startingPrice: answers.startingPrice,
            goals: answers.goals,
            volume: answers.volume,
            bio: answers.bio.trim(),
          }
        : {
            role,
            occasions: answers.occasions,
            budget: answers.budget,
            timeline: answers.timeline,
            styles: answers.styles,
            notes: answers.notes.trim(),
          };
      await submitOnboarding(payload);
      await refresh();
      nav("dashboard");
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const next = () => (step < TOTAL_STEPS - 1 ? setStep(s => s + 1) : finish());

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
          <HiveMark size={22} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Lens<span style={{ color: "var(--accent)" }}>Hive</span></span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>Step {step + 1} of {TOTAL_STEPS}</span>
        </div>
        <Progress step={step} total={TOTAL_STEPS} />

        {isCreator
          ? <PhotographerSteps step={step} a={answers} set={set} />
          : <ClientSteps step={step} a={answers} set={set} />}

        {error && <div style={errStyle}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
          {step > 0 && <button style={ghostBtn} onClick={() => setStep(s => s - 1)}>Back</button>}
          <div style={{ flex: 1 }} />
          <button
            style={primaryBtn(!canContinue || busy)}
            disabled={!canContinue || busy}
            onClick={next}
          >
            {busy ? "Saving…" : step < TOTAL_STEPS - 1 ? "Continue" : isCreator ? "Create my profile" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
