# Project Architecture & Directory Structure Guide

> **Author:** Meet Bhingradiya  
> **Repository:** [MeetBhingradiya/My-Web-Site-Application](https://github.com/MeetBhingradiya/My-Web-Site-Application)  
> **Framework:** Next.js 16 (Turbopack, App Router) • React 19 • TypeScript • Mongoose (MongoDB) • Better-Auth

This document serves as the single source of truth for repository structure, module organization, architectural boundaries, and import conventions for human contributors and autonomous AI agents.

---

## 1. High-Level Architecture

The project follows the **Next.js App Router** paradigm, structured with clear separation of concerns across the presentation, business logic, persistence, and external service layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js App Router Layer                        │
│   src/app/ (Pages, Layouts, Server Components, Route Handlers)        │
└────────────────────────────────────────────────────────────────────────┘
          │                                              │
          ▼                                              ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│       UI Presentation        │        │      API & Middleware        │
│  src/Components/ (Atoms...)  │        │  src/app/api/ (Endpoints)    │
│  src/Hooks/ (Theme, Upload)  │        │  src/Library/ (Auth, Guard)  │
│  src/Contexts/ (Providers)   │        │  src/Utils/ (Crypto, OIDC)   │
└──────────────────────────────┘        └──────────────────────────────┘
          │                                              │
          └──────────────────────┬───────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Data & Storage Layer                            │
│  • src/Models/ (Mongoose Schema & Models)                              │
│  • src/Utils/dbConnect.ts (Cached MongoDB Client)                      │
│  • src/Utils/GitHubCDN.ts (Multi-Repo Private Cloud Git Storage)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Root Files & Infrastructure

| Path | Description |
| :--- | :--- |
| `package.json` | Project dependencies, scripts (`dev`, `build`, `start`, `lint`), metadata. |
| `next.config.ts` | Next.js configuration: image domains, remote patterns, headers, Webpack/Turbopack settings. |
| `tsconfig.json` | TypeScript configuration and path aliases mapping (`@/*`, `@App/*`, `@Components/*`, etc.). |
| `eslint.config.mjs` | ESLint flat configuration rules. |
| `postcss.config.mjs` | PostCSS pipeline including Tailwind / autoprefixer. |
| `.env.example` | Template for required environment variables across Database, Auth, and GitHub CDN. |
| `README.md` | Public repository overview and project introduction. |
| `CONTRIBUTING.md` | Open-source contribution lifecycle, PR standards, and local development setup. |
| `docs/` | Deep technical specifications, design system guides, and architecture documentation. |
| `public/` | Static web assets directly served at `/` (`manifest.json`, `sw.js`, icons, brand images). |
| `Scripts/` | Standalone operational scripts (key generation, RSA signers, deployment checks, cleanup). |

---

## 3. Directory Breakdown (`src/`)

### `src/app/` — Next.js App Router
Every subfolder represents a URL path segment. Route handlers exist inside `route.ts` files.

* **`src/app/admin/`**: High-privilege administrative dashboard.
  * Sub-panels: `ai-providers/`, `blogs/`, `cdn/`, `certificates/`, `documents/`, `education/`, `experience/`, `features/`, `immich-sso/`, `maintenance/`, `projects/`, `resume-presets/`, `roles/`, `sitemap/`, `skills/`, `support/`, `users/`, `vault-access/`.
  * Common admin utilities: `AdminCRUDPage.tsx`, `AdminSidebar.tsx`, `sidebarPermissions.ts`.
* **`src/app/api/`**: Server-side REST and OIDC endpoints.
  * `admin/`: Protected admin mutation and query endpoints.
  * `auth/`: Better-Auth handler (`[...all]/route.ts`), avatar history, linking, sync.
  * `cdn/`: File upload, asset retrieval, external API proxy, API key generation.
  * `immich-sso/`: Downstream OIDC broker endpoints (`.well-known/openid-configuration`, `authorize`, `token`, `userinfo`, `jwks`).
  * `productivity/`: Goals, habits, tasks, reminders, stats, AI productivity suggestions.
  * `shop/`: Cart management, product lookup, order placement, refund workflows.
  * `wallet/`: Asset tracking, wallet transactions, contacts.
  * `security/`: Debugger traps, phone verification, OTP challenges.
* **`src/app/auth/`**: Authentication pages (`login`, `register`, `verify`, `forgot-password`, `link-account`).
* **`src/app/shop/`**: Full-featured e-commerce storefront:
  * `cart/`, `checkout/`, `orders/`, `products/`, `refunds/`, `support/`.
* **`src/app/immich-sso/`**: User-facing authorization gate for Immich self-hosted photo backup SSO.
* **`src/app/profile/`**, **`src/app/settings/`**: User account settings, connected providers, theme toggles.
* **`src/app/dashboard/`**, **`src/app/productivity/`**, **`src/app/wallet/`**: User workspace and personal management suites.
* **`src/app/layout.tsx`**: Root HTML document wrapper, font injections, global provider bindings.
* **`src/app/page.tsx`**: Portfolio homepage and showcase.

---

### `src/Components/` — UI Component Hierarchy
Adheres to atomic and domain-driven design principles:

* **`Atoms/`**: Foundational primitives:
  * Buttons, inputs, modals, spinners, icons, badges, tooltips, glass containers.
* **`Common/`**: Reusable composite widgets:
  * Navigation bar (`Navbar.tsx`), Footer, Breadcrumbs, Theme Switchers, SEO Metadata banners.
* **`Organisms/`**: Complex multi-part views:
  * Hero banners, experience timelines, project showcase cards, blog feeds.
* **`Agreements/`**, **`Blogs/`**, **`Settings/`**: Domain-specific UI blocks.

---

### `src/Config/` — Application Configuration
* **`Client.ts`**: Client-safe configuration constants (site URL, branding, default theme, public features).
* **`Server.ts`**: Sensitive server-only configuration accessors and environment guards.
* **`Permissions.ts`**: Granular RBAC permission matrix for Admin and sub-role controls.
* **`type.ts`**: Configuration type declarations.

---

### `src/Contexts/` — React State Contexts
* **`Providers.tsx`**: Global React component tree provider wrapping:
  * `DesignThemeProvider` (Apple Liquid Glass vs Samsung One UI 7)
  * Session Provider
  * Toast / Notification Provider

---

### `src/Hooks/` — Custom React Hooks
* **`useDesignTheme.tsx`**: Manages design system (`apple` vs `samsung`), color modes (`light` vs `dark`), dynamic palette generation, and DOM attribute synchronization (`data-design-theme`).
* **`useAdminSession.ts`**: Validates authenticated admin credentials on client navigation.
* **`useCDNUpload.ts`**: Manages client file uploads to `/api/cdn/upload` with progress tracking and type validation.
* **`useToolDefaults.ts`**, **`useTradeFormState.ts`**: Specialized view model hooks.

---

### `src/Library/` — Core Infrastructure Libraries
* **`auth.ts`**: Server-side Better-Auth configuration (GitHub, Google, Microsoft, Apple OAuth plugins, database adapters).
* **`auth-client.tsx`**: Client-side Better-Auth SDK hook exports (`signIn`, `signOut`, `useSession`).
* **`adminApiMiddleware.ts`**: Server-side route handler guard verifying admin permissions, session cookies, and bearer tokens.
* **`permissions.ts`**: Role definitions, privilege checks, and authorization validators.
* **`CSP/`**: Content Security Policy header generation.
* **`IP/`**, **`UserAgent/`**: Request inspection, geolocation, and client verification.

---

### `src/Models/` — Mongoose Database Models
Strictly typed schemas registered against MongoDB:

| Model File | Entity | Purpose |
| :--- | :--- | :--- |
| `CDNAsset.ts` | `CDNAsset` | Metadata, checksums, GitHub repo routing, and status for CDN files. |
| `CDNAPIKey.ts` | `CDNAPIKey` | SHA-256 hashed API keys for third-party developer CDN access. |
| `CDNApplication.ts` | `CDNApplication` | Developer applications requesting external CDN access. |
| `CDNRateWindow.ts` | `CDNRateWindow` | Sliding-window request counters per API key. |
| `ShopProduct.ts` | `ShopProduct` | Physical and digital items sold on `/shop`. |
| `Order.ts` | `Order` | Customer purchases, line items, shipping status, and payment IDs. |
| `RefundRequest.ts` | `RefundRequest` | Customer return/refund disputes and admin resolution flow. |
| `UserRole.ts` | `UserRole` | RBAC role assignments mapped to Better-Auth user IDs. |
| `RoleDefinition.ts` | `RoleDefinition` | Custom system roles and permission sets. |
| `SiteSettings.ts` | `SiteSettings` | Dynamic site toggles (maintenance mode, theme defaults, registration locks). |
| `ImmichWhitelist.ts` | `ImmichWhitelist` | Authorized users permitted to authenticate via Immich OIDC SSO. |
| `VaultDocument.ts` | `VaultDocument` | Encrypted sensitive documents and secure notes. |

---

### `src/Utils/` — Utility Engine & Helpers
* **`dbConnect.ts`**: MongoDB connection pooler with global caching for serverless environments.
* **`GitHubCDN.ts`**: Multi-repo GitHub storage engine, automatic repo capacity selection, and single-commit privacy compaction.
* **`CDNKeyAuth.ts`**: Rate limiting, SHA-256 key hashing, and plan enforcement for third-party CDN access.
* **`OIDCKeys.ts`**: RSA cryptographic keypair loader, ephemeral dev fallback, and RFC 7517 JWKS generator.
* **`Theme_Palette_Generation.ts`**: Algorithmic palette engine computing accessible tints, surfaces, and shadows from any hex color.
* **`RolePermissions.ts`**: Verification helpers mapping user roles to action permits.
* **`ENV_Gateway.ts`**: Validated typed accessor for runtime environment variables.
* **`Email.ts`**, **`SMS.ts`**: Transactional messaging dispatchers (Resend, Twilio/Fast2SMS).
* **`AntiDebugger.ts`**: Defensive client-side anti-tampering guards.

---

### `src/Styles/` — Global Styling
* **`globals.sass`**: Tailwind directives, design token variables (`--glass-surface`, `--glass-blur`, `--touch-target`), and theme CSS rules for `data-design-theme="apple"` and `data-design-theme="samsung"`.

---

## 4. Path Aliases Reference

Aliases configured in `tsconfig.json` for clean, reliable imports:

```typescript
import { dbConnect } from "@Utils/dbConnect";
import { CDNAsset } from "@Models/CDNAsset";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { auth } from "@Library/auth";
import { GlassCard } from "@Components/Atoms/GlassCard";
```

| Alias | Target Path | Usage |
| :--- | :--- | :--- |
| `@/*` | `./src/*` | General src imports |
| `@App/*` | `./src/app/*` | App router pages and layouts |
| `@Components/*` | `./src/Components/*` | Atomic & organism UI components |
| `@Config` / `@Config/*` | `./src/Config/*` | System configuration |
| `@Contexts/*` | `./src/Contexts/*` | React context providers |
| `@Hooks` / `@Hooks/*` | `./src/Hooks/*` | Custom React hooks |
| `@Library` / `@Library/*` | `./src/Library/*` | Auth, middleware, permissions |
| `@Models` / `@Models/*` | `./src/Models/*` | Mongoose models |
| `@Static` / `@Static/*` | `./src/Static/*` | Static data & color presets |
| `@Styles/*` | `./src/Styles/*` | SASS/CSS style sheets |
| `@Types` / `@Types/*` | `./src/Types/*` | TypeScript declarations |
| `@Utils` / `@Utils/*` | `./src/Utils/*` | Utility engines & helpers |

---

## 5. File Placement Decision Tree (For AI Agents & Contributors)

```
New file to add?
│
├── Is it a page or API endpoint?
│   └── Place in `src/app/...` (`page.tsx` for views, `route.ts` for endpoints)
│
├── Is it visual UI?
│   ├── Foundational primitive (button, input, modal) ──► `src/Components/Atoms/`
│   ├── Site-wide layout/shared widget (navbar, footer) ─► `src/Components/Common/`
│   └── Complex domain-specific section (blog, shop) ───► `src/Components/<Domain>/`
│
├── Is it state logic or a reusable hook?
│   └── Place in `src/Hooks/`
│
├── Is it a database schema or entity?
│   └── Place in `src/Models/`
│
├── Is it business logic, crypto, or an external API client?
│   └── Place in `src/Utils/`
│
├── Is it authentication, permissions, or security middleware?
│   └── Place in `src/Library/`
│
└── Is it static mock data, color presets, or constants?
    └── Place in `src/Static/` or `src/Config/`
```
