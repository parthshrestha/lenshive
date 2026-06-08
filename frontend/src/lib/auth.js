import { Amplify } from "aws-amplify";
import {
  confirmSignUp as amplifyConfirmSignUp,
  fetchAuthSession,
  fetchUserAttributes as amplifyFetchUserAttributes,
  getCurrentUser as amplifyGetCurrentUser,
  resendSignUpCode,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
} from "aws-amplify/auth";

const region = import.meta.env.VITE_COGNITO_REGION;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;

export const COGNITO_CONFIGURED = Boolean(region && userPoolId && userPoolClientId);

if (COGNITO_CONFIGURED) {
  Amplify.configure({
    Auth: {
      Cognito: {
        region,
        userPoolId,
        userPoolClientId,
        loginWith: { username: true, email: true },
      },
    },
  });
}

// Sign up with username + email + password + display name.
// `role` is "user" (default) or "photographer" — stored as a custom Cognito
// attribute so the post-signup trigger / backend can route the account into
// the right group / profile table.
// Cognito sends a confirmation code to the email.
export async function signUp({ username, email, password, name, role = "user" }) {
  const userAttributes = { email, preferred_username: username, name };
  if (role && role !== "user") {
    // Cognito custom attributes must be configured in the user pool. If you
    // haven't added `custom:role` yet, comment this out or add it in the pool.
    userAttributes["custom:role"] = role;
  }
  return amplifySignUp({
    username,
    password,
    options: { userAttributes },
  });
}

export async function confirmSignUp({ username, code }) {
  return amplifyConfirmSignUp({ username, confirmationCode: code });
}

export async function resendCode({ username }) {
  return resendSignUpCode({ username });
}

// `usernameOrEmail` can be either — Cognito treats email as an alias.
export async function signIn({ usernameOrEmail, password }) {
  return amplifySignIn({ username: usernameOrEmail, password });
}

export async function signOut() {
  return amplifySignOut();
}

export async function forgotPassword({ username }) {
  return amplifyResetPassword({ username });
}

export async function confirmForgotPassword({ username, code, newPassword }) {
  return amplifyConfirmResetPassword({ username, confirmationCode: code, newPassword });
}

export async function getCurrentUser() {
  try {
    return await amplifyGetCurrentUser();
  } catch {
    return null;
  }
}

// Fetch the Cognito user attribute map (email, name, custom:role, ...). Used
// as a fallback when the backend's /api/me isn't reachable but Cognito still
// has a valid session.
export async function getUserAttributes() {
  try {
    return await amplifyFetchUserAttributes();
  } catch {
    return null;
  }
}

// Returns the ID token JWT for backend auth. Auto-refreshes when expired.
export async function getIdToken() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
}
