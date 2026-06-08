# LensHive — AWS Cognito Setup

Email/username sign-in. No federated IdPs (no Google/Facebook/Apple). SPA
public client (no client secret). **Free up to 50,000 monthly active users.**

## 1. Create the User Pool

Cognito → User pools → **Create user pool**

### Step 1 — Configure sign-in experience
- Provider types: **Cognito user pool** (only)
- Cognito user pool sign-in options: check **Username** *and* **Email** (this lets users sign in with either)
- User name requirements: check **Allow users to sign in with a preferred username** (enables `preferred_username`)

### Step 2 — Configure security requirements
- Password policy: **Cognito defaults** (8+ chars, mixed case, number, symbol) — adjust if too strict for your audience
- MFA: **No MFA** (lean — add later if needed)
- User account recovery: **Email only**

### Step 3 — Configure sign-up experience
- Self-registration: **Enable** (so users can sign up themselves)
- Allow Cognito to automatically send messages to verify and confirm: **Yes**
- Attributes to verify: **Send email message, verify email address**
- Verifying attribute changes: **Keep original active**
- Required attributes: check **email**, **preferred_username**, **name**
- Custom attributes: none

### Step 4 — Configure message delivery
- Email provider: **Send email with Cognito** (50 emails/day free; for production switch to SES)
- FROM email: leave as default (`no-reply@verificationemail.com`)

### Step 5 — Integrate your app
- User pool name: **`lenshive-users`**
- Hosted authentication pages: **Off** (we're using our own React UI)
- Initial app client: **Public client**
  - App client name: `lenshive-web`
  - Client secret: **Don't generate** (SPAs can't safely store secrets)
  - Auth flows: check **ALLOW_USER_SRP_AUTH** and **ALLOW_REFRESH_TOKEN_AUTH** (uncheck `USER_PASSWORD_AUTH` — SRP is the secure flow)

### Step 6 — Review and create

After creation, copy these values from the pool overview:

| Value | Where | Used for |
|---|---|---|
| **User pool ID** | "User pool overview" — `us-east-2_AbC123` | Backend JWT validation + frontend Amplify config |
| **App client ID** | "App integration" tab → App clients | Frontend Amplify config |
| **Region** | from the URL or pool ID prefix — `us-east-2` | Both sides |

## 2. Drop the values into env files

### `backend/.env`
```
COGNITO_REGION=us-east-2
COGNITO_USER_POOL_ID=us-east-2_AbC123
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### `frontend/.env`
```
VITE_COGNITO_REGION=us-east-2
VITE_COGNITO_USER_POOL_ID=us-east-2_AbC123
VITE_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

Both `.env` files are gitignored.

## 3. Verify

After the backend is restarted with the new env vars:
```bash
curl http://localhost:8000/api/me
# → {"detail":"Not authenticated"}  (401)
```

After you sign up via the frontend, /api/me returns your user record.

## Cost guardrails
- **Free tier**: 50,000 MAUs at $0/mo — covers a serious indie launch
- Beyond that: **$0.0055/MAU** ($55 per 10k MAU)
- Email: 50/day free via Cognito's sender. Switch to **SES** at scale ($0.10 per 1k emails)
- Advanced security (compromised-credential check, adaptive risk): extra $0.05/MAU — leave off

## Things NOT to do
- **Don't generate a client secret** for the SPA app client. SPAs can't store secrets safely.
- **Don't enable USER_PASSWORD_AUTH** — that flow sends passwords plaintext to Cognito's API. SRP keeps them on the client.
- **Don't put `cognito_sub` in URLs** — it's a stable identifier; treat it like a primary key, not a public handle. Use `username` in URLs (e.g., `/profile/jane`).

## Deleting the pool

User pools → `lenshive-users` → **Delete user pool**. Free to delete; no resource costs.
