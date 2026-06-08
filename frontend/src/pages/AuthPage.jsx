import { useEffect, useMemo, useState } from "react";
import { HiveMark } from "../components/ui.jsx";
import {
  COGNITO_CONFIGURED,
  confirmSignUp,
  resendCode,
  signIn,
  signUp,
} from "../lib/auth";
import { useAuth } from "../lib/AuthContext";
import { pickBackdrop } from "../lib/authBackdrop";

// ---------- shared inline styles ----------
// Layered backdrop: Unsplash photo at the bottom, a warm gradient wash on top
// so the auth card still pops. `bg` is filled in per-render with a random URL.
const page = (bg) => ({
  position: "relative",
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "32px 20px",
  backgroundImage: `
    linear-gradient(135deg, rgba(20,16,8,0.55) 0%, rgba(20,16,8,0.35) 60%, color-mix(in oklab, var(--accent) 35%, rgba(20,16,8,0.5)) 100%),
    url("${bg}")
  `,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
});
const card = {
  position: "relative",
  width: "min(880px, 100%)",
  height: 540,
  background: "var(--surface)",
  borderRadius: 18,
  overflow: "hidden",
  boxShadow: "0 24px 70px rgba(20,16,8,.22), 0 0 0 1px rgba(0,0,0,.04)",
};
const homeBtn = {
  all: "unset",
  cursor: "default",
  position: "absolute",
  top: 18,
  left: 22,
  zIndex: 30,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 700,
  fontSize: 15,
  // White over the photo backdrop, with a soft glow so it reads on bright spots too.
  color: "white",
  textShadow: "0 1px 3px rgba(0,0,0,.45)",
};
// Material-standard easing keeps the slide and the form crossfade on the same
// motion curve so they read as one coordinated transition instead of two.
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

const formPane = (alignRight, faded) => ({
  position: "absolute",
  top: 0,
  bottom: 0,
  width: "50%",
  left: alignRight ? "50%" : 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "0 56px",
  background: "var(--surface)",
  opacity: faded ? 0 : 1,
  // Subtle outward drift on the outgoing pane so the swap doesn't feel stamped on.
  transform: faded ? `translateX(${alignRight ? 12 : -12}px)` : "translateX(0)",
  // Both panes cross-fade at the same rate the panel slides — no delay so the
  // incoming form is appearing as the panel uncovers it (was previously delayed
  // 380ms, which left ~300ms where neither form was visible).
  transition: `opacity 540ms ${EASE}, transform 540ms ${EASE}`,
  willChange: "opacity, transform",
});
const slidingPanel = (slid) => ({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: "50%",
  width: "50%",
  background:
    "linear-gradient(135deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 75%, #5b3a17) 100%)",
  color: "white",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "0 44px",
  textAlign: "center",
  transform: slid ? "translateX(-100%)" : "translateX(0)",
  // A bit longer + a touch of shadow softening makes the slide feel weighted
  // rather than snappy.
  transition: `transform 640ms ${EASE}, box-shadow 640ms ${EASE}`,
  boxShadow: slid
    ? "-18px 0 36px -16px rgba(20,16,8,.25)"
    : "18px 0 36px -16px rgba(20,16,8,.25)",
  willChange: "transform",
  zIndex: 20,
});
const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  marginBottom: 11,
  border: "1px solid var(--line)",
  borderRadius: 10,
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 13.5,
  outline: "none",
};
const primaryBtn = {
  all: "unset",
  cursor: "default",
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  padding: "12px 0",
  background: "var(--accent)",
  color: "white",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  marginTop: 6,
};
const ghostBtnOnAccent = {
  all: "unset",
  cursor: "default",
  display: "inline-block",
  padding: "10px 28px",
  border: "1.5px solid rgba(255,255,255,.85)",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: ".02em",
  color: "white",
  marginTop: 22,
};
const formTitle = {
  margin: 0,
  marginBottom: 18,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "-.01em",
  color: "var(--text)",
};
const linkBtn = {
  all: "unset",
  cursor: "default",
  fontSize: 12.5,
  color: "var(--accent)",
  marginTop: 10,
  display: "inline-block",
};
const errorStyle = {
  marginTop: 10,
  fontSize: 12.5,
  color: "#b3261e",
  background: "rgba(179,38,30,.06)",
  padding: "8px 10px",
  borderRadius: 8,
};
// Password validation rules — kept here so the live checklist UI and the
// submit-time guard use exactly the same definitions.
const PW_RULES = [
  { key: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { key: "digit", label: "One number", test: (v) => /\d/.test(v) },
  { key: "symbol", label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];
const evalPw = (v) => Object.fromEntries(PW_RULES.map(r => [r.key, r.test(v)]));
const allPwOk = (state) => Object.values(state).every(Boolean);

const pwFieldWrap = { position: "relative", marginBottom: 11 };
const pwInputStyle = { ...input, marginBottom: 0, paddingRight: 44 };
const showBtn = {
  all: "unset",
  cursor: "default",
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 28,
  display: "grid",
  placeItems: "center",
  color: "var(--muted)",
  borderRadius: 6,
};
const pwReqList = {
  margin: "8px 0 0",
  padding: 0,
  listStyle: "none",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "4px 12px",
};
const pwReqItem = (ok) => ({
  fontSize: 11.5,
  color: ok ? "#2d5d4f" : "var(--muted)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  transition: "color 200ms ease",
});
const pwReqDot = (ok) => ({
  width: 12,
  height: 12,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: ok ? "#2d5d4f" : "transparent",
  border: ok ? "1px solid #2d5d4f" : "1px solid var(--line)",
  color: "white",
  fontSize: 8.5,
  lineHeight: 1,
  flexShrink: 0,
});
const matchHint = (ok) => ({
  marginTop: 6,
  fontSize: 11.5,
  color: ok ? "#2d5d4f" : "#b3261e",
});

const roleToggle = {
  display: "flex",
  gap: 4,
  padding: 4,
  marginBottom: 14,
  background: "var(--chip)",
  borderRadius: 999,
};
const roleOption = (active) => ({
  all: "unset",
  cursor: "default",
  flex: 1,
  textAlign: "center",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12.5,
  fontWeight: 600,
  background: active ? "var(--surface)" : "transparent",
  color: active ? "var(--accent)" : "var(--muted)",
  boxShadow: active ? "0 1px 3px rgba(0,0,0,.06)" : "none",
  transition: "background 180ms ease, color 180ms ease",
});

// Password input with a show/hide toggle on the right. Style matches the
// page's `input` block so it slots in alongside the other fields.
function PasswordField({ value, onChange, placeholder, onKeyDown, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div style={pwFieldWrap}>
      <input
        style={pwInputStyle}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        style={showBtn}
      >
        {show ? <EyeOffSvg /> : <EyeSvg />}
      </button>
    </div>
  );
}
function EyeSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// Live checklist driven by `evalPw`. Each rule is greyed-out by default and
// flips green with a checkmark once satisfied.
function PasswordRequirements({ state }) {
  return (
    <ul style={pwReqList} aria-label="Password requirements">
      {PW_RULES.map(r => {
        const ok = !!state[r.key];
        return (
          <li key={r.key} style={pwReqItem(ok)}>
            <span style={pwReqDot(ok)} aria-hidden="true">{ok ? "✓" : ""}</span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 9 }}>
      <HiveMark size={22} />
      <span style={{ fontWeight: 700, fontSize: 17 }}>
        Lens<span style={{ color: "var(--accent)" }}>Hive</span>
      </span>
    </div>
  );
}

export function AuthPage({ nav, initialMode = "signin", params = {}, setParams }) {
  const { refresh } = useAuth();
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "signin");
  const [confirmStep, setConfirmStep] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Pick the backdrop once per mount so it stays stable while the user is on
  // the auth flow (different photo next time they visit).
  const bg = useMemo(pickBackdrop, []);

  // signin
  const [signinId, setSigninId] = useState("");
  const [signinPw, setSigninPw] = useState("");
  // signup
  const [suUsername, setSuUsername] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPw, setSuPw] = useState("");
  const [suCPw, setSuCPw] = useState("");
  // confirm
  const [confirmCode, setConfirmCode] = useState("");

  // Keep mode in sync if the parent route changes (e.g. nav("login") → nav("signup"))
  useEffect(() => {
    setMode(initialMode === "signup" ? "signup" : "signin");
    setError("");
  }, [initialMode]);

  // Signup role lives in the URL (?role=photographer) so it survives refresh and
  // the choice is shareable. Defaults to "user" (booking a photographer).
  const role = params.role === "photographer" ? "photographer" : "user";
  const setRole = (next) => {
    setError("");
    setParams?.({ role: next === "photographer" ? "photographer" : null });
  };

  const run = async (fn) => {
    setError("");
    setBusy(true);
    try { await fn(); }
    catch (e) { setError(e?.message || String(e)); }
    finally { setBusy(false); }
  };

  const doSignIn = () => run(async () => {
    await signIn({ usernameOrEmail: signinId.trim(), password: signinPw });
    await refresh();
    nav("home");
  });
  // Live password validation state, recomputed every render (cheap; just regex checks).
  const pwState = evalPw(suPw);
  const pwOk = allPwOk(pwState);
  const pwMatches = suCPw.length > 0 && suPw === suCPw;

  const doSignUp = () => run(async () => {
    if (!pwOk) {
      throw new Error("Password doesn't meet all the requirements yet.");
    }
    if (suPw !== suCPw) {
      throw new Error("Passwords don't match.");
    }
    await signUp({
      username: suUsername.trim(),
      email: suEmail.trim(),
      password: suPw,
      // No display-name field on the form for now — default to the username
      // so the Cognito `name` attribute is always populated.
      name: suUsername.trim(),
      role, // "user" | "photographer" — backend should map this to a Cognito group / profile flag.
    });
    setPendingUsername(suUsername.trim());
    setConfirmStep(true);
  });
  const doConfirm = () => run(async () => {
    await confirmSignUp({ username: pendingUsername, code: confirmCode.trim() });
    await signIn({ usernameOrEmail: pendingUsername, password: suPw });
    await refresh();
    nav("home");
  });

  const switchMode = (next) => {
    setError("");
    // Drive the slide via the URL so /login ↔ /signup stay shareable and
    // back/forward navigate between them.
    nav(next === "signup" ? "signup" : "login");
  };

  // Fallback when env vars aren't set yet
  if (!COGNITO_CONFIGURED) {
    return (
      <div style={page(bg)}>
        <button style={homeBtn} onClick={() => nav("home")}>
          <HiveMark size={22} />
          <span>Lens<span style={{ color: "var(--accent)" }}>Hive</span></span>
        </button>
        <div style={{ ...card, height: "auto", padding: 32, width: "min(440px, 100%)" }}>
          <h3 style={{ marginTop: 0 }}>Auth not configured</h3>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Set <code>VITE_COGNITO_REGION</code>, <code>VITE_COGNITO_USER_POOL_ID</code>, and{" "}
            <code>VITE_COGNITO_APP_CLIENT_ID</code> in <code>frontend/.env</code> and restart the dev server.
            See <code>infra/cognito.md</code>.
          </p>
          <button style={primaryBtn} onClick={() => nav("home")}>Back to home</button>
        </div>
      </div>
    );
  }

  // Email-confirmation step after signup (takes over the card)
  if (confirmStep) {
    return (
      <div style={page(bg)}>
        <button style={homeBtn} onClick={() => nav("home")}>
          <HiveMark size={22} />
          <span>Lens<span style={{ color: "var(--accent)" }}>Hive</span></span>
        </button>
        <div style={{ ...card, height: "auto", padding: 36, width: "min(440px, 100%)" }}>
          <Brand />
          <h2 style={formTitle}>Verify your email</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0, marginBottom: 16 }}>
            We sent a 6-digit code to your email. Enter it below to finish signing up.
          </p>
          <input style={input} placeholder="Confirmation code" value={confirmCode} onChange={(e) => setConfirmCode(e.target.value)} autoFocus />
          <button style={primaryBtn} disabled={busy} onClick={doConfirm}>{busy ? "Confirming…" : "Confirm + log in"}</button>
          <button style={linkBtn} onClick={() => run(() => resendCode({ username: pendingUsername }))}>Resend code</button>
          {error && <div style={errorStyle}>{error}</div>}
        </div>
      </div>
    );
  }

  // Main slide UI — login on the left, signup on the right
  const isSignup = mode === "signup";
  return (
    <div style={page(bg)}>
      <button style={homeBtn} onClick={() => nav("home")}>
        <HiveMark size={22} />
        <span>Lens<span style={{ color: "var(--accent)" }}>Hive</span></span>
      </button>
      <div style={card}>
        {/* Login pane (left) — fades out when signup mode is active */}
        <div style={formPane(false, isSignup)}>
          <Brand />
          <h2 style={formTitle}>Welcome back</h2>
          <input style={input} placeholder="Username or email" value={signinId} onChange={(e) => setSigninId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSignIn()} />
          <PasswordField
            placeholder="Password"
            value={signinPw}
            onChange={(e) => setSigninPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSignIn()}
          />
          <button style={primaryBtn} disabled={busy} onClick={doSignIn}>{busy && !isSignup ? "Signing in…" : "Log in"}</button>
          <button style={linkBtn} onClick={() => nav("forgot")}>Forgot password?</button>
          {!isSignup && error && <div style={errorStyle}>{error}</div>}
        </div>

        {/* Signup pane (right) — fades out when signin mode is active */}
        <div style={formPane(true, !isSignup)}>
          <Brand />
          <h2 style={{ ...formTitle, marginBottom: 12 }}>Join LensHive</h2>

          {/* Role toggle — picks the kind of account being created. */}
          <div style={roleToggle}>
            <button
              type="button"
              style={roleOption(role === "user")}
              onClick={() => setRole("user")}
              aria-pressed={role === "user"}
            >
              Book a photographer
            </button>
            <button
              type="button"
              style={roleOption(role === "photographer")}
              onClick={() => setRole("photographer")}
              aria-pressed={role === "photographer"}
            >
              I'm a photographer
            </button>
          </div>

          <input style={input} placeholder="Username" value={suUsername} onChange={(e) => setSuUsername(e.target.value)} />
          <input style={input} placeholder="Email" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} />
          <PasswordField
            placeholder="Password"
            value={suPw}
            onChange={(e) => setSuPw(e.target.value)}
          />
          {/* Live checklist — only shown once the user starts typing, to avoid
              cluttering the empty form. */}
          {suPw.length > 0 && <PasswordRequirements state={pwState} />}

          <div style={{ marginTop: suPw.length > 0 ? 11 : 0 }}>
            <PasswordField
              placeholder="Confirm password"
              value={suCPw}
              onChange={(e) => setSuCPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSignUp()}
            />
            {suCPw.length > 0 && (
              <div style={matchHint(pwMatches)}>
                {pwMatches ? "✓ Passwords match" : "✗ Passwords don't match"}
              </div>
            )}
          </div>

          <button style={primaryBtn} disabled={busy} onClick={doSignUp}>
            {busy && isSignup
              ? "Creating…"
              : role === "photographer"
                ? "Create photographer account"
                : "Create account"}
          </button>
          {isSignup && error && <div style={errorStyle}>{error}</div>}
        </div>

        {/* Sliding accent panel — covers signup by default, slides left to cover login */}
        <div style={slidingPanel(isSignup)}>
          <svg width="84" height="84" viewBox="0 0 100 100" style={{ opacity: 0.9, marginBottom: 14 }} aria-hidden>
            <polygon points="50,8 88,30 88,72 50,94 12,72 12,30" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" />
            <polygon points="50,28 70,40 70,62 50,74 30,62 30,40" fill="rgba(255,255,255,.18)" />
          </svg>
          {isSignup ? (
            <>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-.015em" }}>Already in the hive?</h2>
              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13.5, lineHeight: 1.55, opacity: 0.92, maxWidth: 280 }}>
                Sign in to manage your bookings, photographer profile, and saved spots.
              </p>
              <button style={ghostBtnOnAccent} onClick={() => switchMode("signin")}>Log in</button>
            </>
          ) : (
            <>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-.015em" }}>New to LensHive?</h2>
              <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13.5, lineHeight: 1.55, opacity: 0.92, maxWidth: 280 }}>
                Find photographers at real photo spots near you. Book in minutes.
              </p>
              <button style={ghostBtnOnAccent} onClick={() => switchMode("signup")}>Create account</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
