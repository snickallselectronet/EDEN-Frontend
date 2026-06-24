# Security Model: Auth0 + React (ElectroNet Results Portal)

This document explains our Auth0 configuration, the JWTs we consume, and how the React app implements authorization. It also lists roles and permissions with what they unlock.

---

## 1) Auth0 configuration

### 1.1 Post-Login Action (custom claims we emit)

We add **company** and **roles** as **namespaced** custom claims to both **ID** and **Access** tokens.

```js
// Auth0 Action: PostLogin (minimal claims for portal)
exports.onExecutePostLogin = async (event, api) => {
  const ns = "https://electronetclientportal.com/user/";

  // Emit Auth0 roles assigned in the Dashboard
  if (event.authorization && event.authorization.roles?.length) {
    api.accessToken.setCustomClaim(ns + "roles", event.authorization.roles);
    api.idToken.setCustomClaim(ns + "roles", event.authorization.roles);
  }

  // Emit company (populated in app_metadata or elsewhere upstream)
  const company = event.user.app_metadata?.company;
  if (company) {
    api.accessToken.setCustomClaim(ns + "company", company);
    api.idToken.setCustomClaim(ns + "company", company);
  }
};
```

**Notes**

* **Permissions** are not set by the Action. They come from Auth0 **RBAC** and are automatically added to the **Access token** (not the ID token) when the SPA requests an API audience and RBAC is enabled for that API.

### 1.2 API & Application settings

* **Enable RBAC** on the API in Auth0.
* **Enable “Add Permissions in the Access Token.”**
* In the SPA (Auth0Provider), configure `authorizationParams.audience` to your API identifier (e.g., `http://localhost:8000`). Without this, the access token will not contain `permissions`.

---

## 2) JWT structure

### 2.1 ID Token (identity + roles/company for UI)

```json
{
  "https://electronetclientportal.com/user/roles": ["ELECTRONET_ADMIN"],
  "https://electronetclientportal.com/user/company": "ElectroNet",
  "iss": "https://<tenant>.us.auth0.com/",
  "sub": "auth0|<user_id>",
  "aud": ["<spa-client-id>", "https://<tenant>.us.auth0.com/userinfo"],
  "iat": 1761348654,
  "exp": 1761435054
}
```

### 2.2 Access Token (API authorization + fine-grained permissions)

```json
{
  "https://electronetclientportal.com/user/roles": ["ELECTRONET_ADMIN"],
  "https://electronetclientportal.com/user/company": "ElectroNet",
  "iss": "https://<tenant>.us.auth0.com/",
  "sub": "auth0|<user_id>",
  "aud": "http://localhost:8000",
  "permissions": ["approver", "reviewer"],
  "iat": 1761348654,
  "exp": 1761435054
}
```

---

## 3) Roles & permissions

### 3.1 Roles (from ID token)

| Role             | Purpose / High-Level Rights   |
| ---------------- | ----------------------------- |
| ELECTRONET_ADMIN | Full portal administrative UI |

### 3.2 Permissions (from Access token)

| Permission | Purpose (fine-grained)                       |
| ---------- | -------------------------------------------- |
| approver   | Approval-level actions (e.g., processing)    |
| reviewer   | Review/report access (read or limited write) |

> Extend this list over time (e.g., `admin:users`, `read:sites`, etc.). The React app currently checks only `approver`/`reviewer`.

---

## 4) React integration

### 4.1 Auth0Provider (must request API audience)

```tsx
<Auth0Provider
  domain="<tenant>.us.auth0.com"
  clientId="<spa_client_id>"
  authorizationParams={{
    redirect_uri: window.location.origin,
    audience: "http://localhost:8000", // API identifier
    scope: "openid profile email"
  }}
>
  <App />
</Auth0Provider>
```

### 4.2 `useAuthState` hook (centralized parsing)

* Reads **company** and **roles** from the **ID token** via the `user` object:

  * `https://electronetclientportal.com/user/company`
  * `https://electronetclientportal.com/user/roles`
* Decodes the **Access token** to extract `permissions`.
* Derives booleans:

  * `isAdmin` if roles include `ELECTRONET_ADMIN`
  * `canApprove` if permissions include `approver`
  * `canReview` if permissions include `reviewer` (or implied by `approver`)

**Hook shape (simplified):**

```ts
{
  isAuthenticated, isLoading, user,
  company: string | null,
  roles: string[],
  permissions: string[],
  isAdmin: boolean,
  canApprove: boolean,
  canReview: boolean,
  login(): void,
  logout(): void,
  getAccessToken(): Promise<string|null>,
  getAccessTokenSilently(...): Promise<any>
}
```

### 4.3 Axios client

Attach the **Access token** on all API requests:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 4.4 Back-compat mapping in `App.tsx`

To avoid large refactors now, we map the new model to existing props:

* `userPermissions = isAdmin ? "Admin" : "Standard"`
* `userRole = "Approver" | "Reviewer" | "Viewer"` derived from `permissions`
* `company` comes from `useAuthState()`

Components (e.g., `QAPanel`, `MitigationContent`) continue as before using these props.

---

## 5) UI & endpoint access matrix

| Area / Capability          | Needs Role (ID Token)     | Needs Permission (Access Token) | Enforced Where    |
| -------------------------- | ------------------------- | ------------------------------- | ----------------- |
| Admin Processing page      | `ELECTRONET_ADMIN`        | —                               | React (UI gating) |
| QA Panel (show/use)        | `ELECTRONET_ADMIN`        | —                               | React (UI gating) |
| Run processing scripts     | `ELECTRONET_ADMIN` or —   | `approver` **or** admin         | Backend (API)     |
| General site list (GetAll) | Same company **or** admin | —                               | Backend (API)     |

> The backend should **always** authorize independently (roles/permissions/company) from the Access token, regardless of UI gates.

---

## 6) Migration & testing checklist

1. **Auth0**

   * RBAC enabled, “Add Permissions in Access Token” enabled.
   * Post-Login Action deployed (emits roles + company).
   * Roles and permissions assigned in Dashboard.

2. **SPA**

   * Auth0Provider includes `audience` (API identifier).
   * `useAuthState` reads ID token claims & access token permissions.
   * Axios attaches bearer token.

3. **Sanity checks**

   * After login, `user` contains namespaced `company` and `roles`.
   * Decoded Access token has `permissions` array.
   * Admin UI appears only with `ELECTRONET_ADMIN`.
   * API calls succeed/fail according to backend rules.

---

## 7) Appendix: endpoint helper (optional)

If using a small helper to map route names:

```ts
export const API_URL = (name: string) => {
  if (name === "QA_view") return "/api/QA_view/";     // example
  return `/api/testdata/${name}/`;
};
```

(Adjust to match your backend routes.)

---

**Source of truth:**

* **Roles & company** → ID token namespaced claims (via Action)
* **Permissions** → Access token `permissions` (via RBAC + audience)
* **React** → `useAuthState` hook consolidates and exposes a stable interface for the app.
