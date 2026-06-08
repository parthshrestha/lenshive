import { useMemo, useState } from "react";
import { HiveMark } from "../components/ui.jsx";
import { COGNITO_CONFIGURED, confirmForgotPassword, forgotPassword } from "../lib/auth";
import { pickBackdrop } from "../lib/authBackdrop";

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
  width: "min(440px, 100%)",
  background: "var(--surface)",
  borderRadius: 18,
  padding: 36,
  boxShadow: "0 24px 70px rgba(20,16,8,.22), 0 0 0 1px rgba(0,0,0,.04)",
};
const homeBtn = {
  all: "unset", cursor: "default",
  position: "absolute", top: 18, left: 22, zIndex: 30,
  display: "flex", alignItems: "center", gap: 8,
  fontWeight: 700, fontSize: 15,
  color: "white",
  textShadow: "0 1px 3px rgba(0,0,0,.45)",
};
const input = {
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px", marginBottom: 11,
  border: "1px solid var(--line)", borderRadius: 10,
  background: "var(--bg)", color: "var(--text)", fontSize: 13.5,
  outline: "none",
};
const primaryBtn = {
  all: "unset", cursor: "default", display: "block",
  width: "100%", boxSizing: "border-box", textAlign: "center",
  padding: "12px 0", background: "var(--accent)", color: "white",
  borderRadius: 10, fontSize: 14, fontWeight: 600, marginTop: 6,
};
const linkBtn = {
  all: "unset", cursor: "default",
  fontSize: 12.5, color: "var(--accent)", marginTop: 10, display: "inline-block",
};
const formTitle = {
  margin: 0, marginBottom: 18,
  fontSize: 22, fontWeight: 700, letterSpacing: "-.01em",
  color: "var(--text)",
};
const errorStyle = {
  marginTop: 10, fontSize: 12.5, color: "#b3261e",
  background: "rgba(179,38,30,.06)", padding: "8px 10px", borderRadius: 8,
};

export function ForgotPasswordPage({ nav }) {
  const [step, setStep] = useState("request"); // "request" | "confirm"
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bg = useMemo(pickBackdrop, []);

  const run = async (fn) => {
    setError("");
    setBusy(true);
    try { await fn(); }
    catch (e) { setError(e?.message || String(e)); }
    finally { setBusy(false); }
  };

  const doRequest = () => run(async () => {
    await forgotPassword({ username: username.trim() });
    setStep("confirm");
  });
  const doConfirm = () => run(async () => {
    await confirmForgotPassword({
      username: username.trim(),
      code: code.trim(),
      newPassword: newPw,
    });
    nav("login");
  });

  return (
    <div style={page(bg)}>
      <button style={homeBtn} onClick={() => nav("home")}>
        <HiveMark size={22} />
        <span>Lens<span style={{ color: "var(--accent)" }}>Hive</span></span>
      </button>
      <div style={card}>
        <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 9 }}>
          <HiveMark size={22} />
          <span style={{ fontWeight: 700, fontSize: 17 }}>
            Lens<span style={{ color: "var(--accent)" }}>Hive</span>
          </span>
        </div>

        {!COGNITO_CONFIGURED ? (
          <>
            <h3 style={{ marginTop: 0 }}>Auth not configured</h3>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Cognito env vars are missing. See <code>infra/cognito.md</code>.
            </p>
            <button style={primaryBtn} onClick={() => nav("home")}>Back to home</button>
          </>
        ) : step === "request" ? (
          <>
            <h2 style={formTitle}>Reset password</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0, marginBottom: 16 }}>
              Enter your username or email and we'll send a reset code.
            </p>
            <input style={input} placeholder="Username or email" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && doRequest()} />
            <button style={primaryBtn} disabled={busy} onClick={doRequest}>{busy ? "Sending…" : "Send reset code"}</button>
            <button style={linkBtn} onClick={() => nav("login")}>Back to log in</button>
          </>
        ) : (
          <>
            <h2 style={formTitle}>Set a new password</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0, marginBottom: 16 }}>
              Check your email for the reset code, then enter it below with a new password.
            </p>
            <input style={input} placeholder="Reset code" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            <input style={input} placeholder="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doConfirm()} />
            <button style={primaryBtn} disabled={busy} onClick={doConfirm}>{busy ? "Resetting…" : "Set new password"}</button>
            <button style={linkBtn} onClick={() => setStep("request")}>Resend code</button>
          </>
        )}

        {error && <div style={errorStyle}>{error}</div>}
      </div>
    </div>
  );
}
