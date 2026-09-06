# Third-Party OAuth Broker & OIDC Identity Provider

> **Architecture & Implementation Guide**  
> Author: Meet Bhingradiya  
> Target Ecosystem: Next.js 16 (App Router), Better-Auth, Jose (RS256), OpenID Connect Core 1.0

---

## 1. Executive Summary

This platform implements a **two-tier authentication architecture**:
1. **Upstream Social OAuth Broker**: Ingests federated identities from third-party identity providers (Google, GitHub, Microsoft, Apple) and local credentials via [Better-Auth](https://www.better-auth.com/).
2. **Downstream OIDC Identity Provider (OAuth 2.0 / OpenID Connect Broker)**: Serves as an authoritative OIDC Identity Provider (IdP) for downstream clients (such as Immich photo backup, Nextcloud, custom mobile apps, and microservices) through the standard discovery endpoint `/.well-known/openid-configuration` and secure PKCE-governed authorization code flows.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 UPSTREAM IDENTITY PROVIDERS                            │
│              [Google OAuth]    [GitHub OAuth]    [Microsoft OAuth]    [Apple OAuth]    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL BETTER-AUTH GATEWAY (Next.js)                           │
│  • Multi-provider session management       • WebAuthn Passkeys                         │
│  • Avatar & profile synchronization        • Two-Factor Authentication (2FA)           │
│  • Session caching & IP audit logs         • Role-Based Access Control (RBAC)          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      DOWNSTREAM OIDC BROKER (/api/immich-sso)                          │
│  • /.well-known/openid-configuration       • /authorize (PKCE S256 + Gate Access Key)  │
│  • /token (RS256 ID Token + Bearer Token)  • /userinfo (Standard Claims)               │
│  • /jwks (RFC 7517 JSON Web Key Set)       • /check-access (Pre-flight validation)     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DOWNSTREAM CLIENT APPLICATIONS                           │
│               [Immich Server]     [Mobile Clients]     [External Microservices]        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Upstream Social OAuth Broker (Better-Auth)

### 2.1 Configuration Overview
The upstream authentication engine is defined in [`src/Library/auth.ts`](../src/Library/auth.ts). It connects to MongoDB via the Mongoose adapter and initializes Better-Auth with:
- **Social OAuth Providers**: Google, GitHub, Microsoft, Apple.
- **Passkeys (WebAuthn)**: Hardware security keys and biometric authentication.
- **Two-Factor Authentication (2FA)**: TOTP authenticator apps.
- **Phone Number Authentication**: OTP-based verification.
- **Custom Profile Synchronization**: High-resolution avatar synchronization for Google, GitHub, and Microsoft accounts.

### 2.2 Provider Environment Variables
To enable upstream OAuth providers, configure the following keys in `.env` or `.env.local`:

```env
# Base URL Configuration
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-ultra-secure-better-auth-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-client-secret"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Microsoft OAuth (Azure Entra ID)
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
MICROSOFT_TENANT_ID="common"

# Apple Sign-In
APPLE_CLIENT_ID="com.yourdomain.service"
APPLE_TEAM_ID="your-apple-team-id"
APPLE_KEY_ID="your-apple-key-id"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 2.3 Upstream Callback Endpoints
Better-Auth automatically mounts callback handlers at the following route hierarchy:
- **Google**: `/api/auth/callback/google`
- **GitHub**: `/api/auth/callback/github`
- **Microsoft**: `/api/auth/callback/microsoft`
- **Apple**: `/api/auth/callback/apple`

### 2.4 Profile & Avatar Synchronization
When users authenticate with social accounts, Better-Auth hooks intercept the callback to persist provider-specific avatars into dedicated user fields (`googleAvatar`, `githubAvatar`, `microsoftAvatar`). This allows the frontend to fall back gracefully and render authentic user identity badges across the site.

---

## 3. Downstream OIDC Broker Architecture

The downstream OpenID Connect server is implemented under [`src/app/api/immich-sso/`](../src/app/api/immich-sso/) and [`src/Utils/OIDCKeys.ts`](../src/Utils/OIDCKeys.ts). It complies with the [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) specification and the [OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749).

### 3.1 Supported Endpoints

| Endpoint | Method | Path | Description |
|---|---|---|---|
| **Discovery** | `GET` | `/.well-known/openid-configuration`<br>`/api/immich-sso/.well-known/openid-configuration` | Returns OIDC metadata, URLs, signing algorithms, and supported scopes. |
| **Authorize** | `GET` | `/api/immich-sso/authorize` | Initiates the authorization code flow with PKCE and gate protection. |
| **Token** | `POST` | `/api/immich-sso/token` | Exchanges authorization code + code verifier for an RS256 signed ID token & access token. |
| **UserInfo** | `GET` | `/api/immich-sso/userinfo` | Returns user claims for the authenticated bearer access token. |
| **JWKS** | `GET` | `/api/immich-sso/jwks` | Exposes RSA public key in RFC 7517 JSON Web Key Set format. |
| **Access Check**| `GET` | `/api/immich-sso/check-access` | Pre-flight check validating gate access before redirection. |

---

## 4. Cryptographic Key Management & JWKS

### 4.1 Key Architecture ([`src/Utils/OIDCKeys.ts`](../src/Utils/OIDCKeys.ts))
Tokens are signed with **RS256** (RSA Signature with SHA-256) via the `jose` library.

1. **Production Mode (Persistent Key)**:
   - Reads `IMMICH_SSO_PRIVATE_KEY_JWK` from the environment.
   - Strips private parameters (`d`, `p`, `q`, `dp`, `dq`, `qi`) to expose the clean public JWK on `/api/immich-sso/jwks`.
   - Ensures signature verification remains valid across server reboots, worker restarts, and horizontal scaling.

2. **Development / Fallback Mode (Ephemeral Key)**:
   - If `IMMICH_SSO_PRIVATE_KEY_JWK` is missing, invalid JSON, or contains a placeholder string, the system generates an in-memory 2048-bit RSA keypair dynamically.
   - Logs a clear warning without halting the development server.

### 4.2 Generating a Persistent RSA Keypair
To generate an RS256 JWK string for production deployment, execute:

```bash
bun -e "const {generateKeyPair,exportJWK}=require('jose');(async()=>{const k=await generateKeyPair('RS256',{modulusLength:2048});const j=await exportJWK(k.privateKey);j.kid='oidc-broker-key-1';console.log(JSON.stringify(j));})()"
```

Paste the single-line JSON output into your `.env`:
```env
IMMICH_SSO_PRIVATE_KEY_JWK='{"kty":"RSA","n":"...","e":"AQAB","d":"...","p":"...","q":"...","dp":"...","dq":"...","qi":"...","kid":"oidc-broker-key-1"}'
```

---

## 5. End-to-End Authorization Code Flow with PKCE

### 5.1 Protocol Flow Diagram

```
Downstream Client (e.g. Immich)        Next.js OIDC Broker             Better-Auth / User
              │                                │                                │
  1. Initiate Authorization Code Flow          │                                │
     (client_id, redirect_uri, state,          │                                │
      code_challenge, code_challenge_method)   │                                │
              ├───────────────────────────────►│                                │
              │                                │ 2. Verify Session & Gate Key   │
              │                                ├───────────────────────────────►│
              │                                │    User logs in if needed      │
              │                                │◄───────────────────────────────┤
              │                                │ 3. Mint Authorization Code     │
              │ 4. 302 Redirect with ?code=xyz │    (Store verifier hash, exp)  │
              │◄───────────────────────────────┤                                │
              │                                │                                │
  5. POST /api/immich-sso/token                │                                │
     (code, code_verifier, client_id, secret)  │                                │
              ├───────────────────────────────►│                                │
              │                                │ 6. Validate PKCE S256 verifier │
              │                                │    Sign RS256 ID Token & Access│
              │ 7. Return JSON response        │                                │
              │    { access_token, id_token }  │                                │
              │◄───────────────────────────────┤                                │
              │                                │                                │
  8. GET /api/immich-sso/userinfo              │                                │
     Authorization: Bearer <access_token>      │                                │
              ├───────────────────────────────►│                                │
              │                                │ 9. Verify Access Token Claims  │
              │ 10. Return User Profile Claims │                                │
              │◄───────────────────────────────┤                                │
```

### 5.2 Step 1: Authorization Request
The client redirects the user's browser to the authorize endpoint:

```http
GET /api/immich-sso/authorize?
  response_type=code
  &client_id=immich
  &redirect_uri=https%3A%2F%2Fphotos.example.com%2Fapi%2Foauth%2Fcallback
  &scope=openid%20profile%20email
  &state=xyzState123
  &code_challenge=E9Melhoa2OwvFrGMTJguCH5rtx64ZW_SoRO8VCN2-hU
  &code_challenge_method=S256
  &_gate=your_secret_gate_key
```

#### Parameters:
- `response_type`: Must be `code`.
- `client_id`: Configured in `IMMICH_SSO_CLIENT_ID` (default: `immich`).
- `redirect_uri`: Must match one of the allowed origins/paths specified in Server Config (`Immich_Origins`, `Immich_Endpoints`).
- `scope`: Must contain `openid`. May include `profile` and `email`.
- `state`: Anti-CSRF token generated by the client.
- `code_challenge`: Base64URL encoded SHA-256 hash of the `code_verifier`.
- `code_challenge_method`: Must be `S256` (plain is rejected).
- `_gate`: Optional administrative access gate key protecting unauthorized SSO attempts.

### 5.3 Step 2: Token Exchange Request
The client exchanges the code for tokens:

```http
POST /api/immich-sso/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=auth_code_783df8a2b...
&redirect_uri=https%3A%2F%2Fphotos.example.com%2Fapi%2Foauth%2Fcallback
&client_id=immich
&client_secret=your-immich-sso-client-secret
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

#### Successful Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Im9pZGMtYnJva2VyLWtleS0xI...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Im9pZGMtYnJva2VyLWtleS0xI...",
  "scope": "openid email profile"
}
```

### 5.4 Step 3: UserInfo Request
Clients retrieve user details by submitting the access token:

```http
GET /api/immich-sso/userinfo
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

#### Response:
```json
{
  "sub": "65b8c9f0e1a2b3c4d5e6f7a8",
  "name": "Meet Bhingradiya",
  "email": "me@meetbhingradiya.in",
  "email_verified": true,
  "picture": "https://meetbhingradiya.in/api/cdn/avatar-12345"
}
```

---

## 6. Configuring Downstream Clients (Immich Setup)

To use this platform as the SSO Identity Provider for an **Immich** instance:

1. In Immich Administration Settings, navigate to **Settings → OAuth / OIDC**.
2. Configure the following fields:
   - **Enabled**: `true`
   - **Issuer URL**: `https://your-domain.com/api/immich-sso`
   - **Client ID**: Value of `IMMICH_SSO_CLIENT_ID`
   - **Client Secret**: Value of `IMMICH_SSO_CLIENT_SECRET`
   - **Scope**: `openid email profile`
   - **Auto Register**: `true`
   - **Button Text**: `Login with Meet's Account`
3. Verify that the discovery endpoint resolves correctly:
   ```bash
   curl -s https://your-domain.com/api/immich-sso/.well-known/openid-configuration | jq .
   ```

---

## 7. Security Best Practices

1. **Strict PKCE Enforcement**: Only `S256` code challenge method is permitted.
2. **Single-Use Codes**: Authorization codes expire after 5 minutes and are deleted immediately upon exchange.
3. **Issuer Consistency**: The `iss` claim in ID tokens strictly mirrors `getPrimaryOrigin() + '/api/immich-sso'` to prevent token spoofing.
4. **Origin Validation**: All `redirect_uri` targets are strictly matched against trusted origins configured in [`src/Config/Server.ts`](../src/Config/Server.ts).
5. **No Secret Leakage**: Public endpoints never return private key data.
