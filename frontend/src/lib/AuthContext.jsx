import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { API_BASE } from "./location";
import { COGNITO_CONFIGURED, getCurrentUser, getIdToken, getUserAttributes, signOut as cognitoSignOut } from "./auth";

// Build a minimal user profile from Cognito attributes — used when /api/me
// isn't reachable so the UI still treats the user as signed in.
function meFromCognito(cognitoUser, attrs) {
  if (!cognitoUser) return null;
  const a = attrs || {};
  return {
    id: null,
    cognitoSub: cognitoUser.userId || a.sub || null,
    username: a.preferred_username || cognitoUser.username || null,
    email: a.email || "",
    name: a.name || a.preferred_username || cognitoUser.username || "",
    role: a["custom:role"] || "user",
  };
}

const AuthContext = createContext({
  me: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!COGNITO_CONFIGURED) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const cognitoUser = await getCurrentUser();
    if (!cognitoUser) {
      // No active Cognito session — actually signed out.
      setMe(null);
      setLoading(false);
      return;
    }

    // Cognito session exists. Prefer the backend's /api/me (canonical user row
    // with db id, role, etc.), but if the backend is unreachable or 5xxs,
    // fall back to Cognito attributes so the UI stays signed-in.
    try {
      const token = await getIdToken();
      const r = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        setMe(await r.json());
      } else if (r.status === 401 || r.status === 403) {
        // Token explicitly rejected — treat as signed out.
        setMe(null);
      } else {
        // Backend transient error: keep the user logged-in with Cognito-only data.
        const attrs = await getUserAttributes();
        setMe(meFromCognito(cognitoUser, attrs));
      }
    } catch {
      // Network/CORS failure reaching the backend — still treat as signed in.
      const attrs = await getUserAttributes();
      setMe(meFromCognito(cognitoUser, attrs));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSignOut = useCallback(async () => {
    await cognitoSignOut();
    setMe(null);
  }, []);

  return (
    <AuthContext.Provider value={{ me, loading, refresh, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
