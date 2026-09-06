# AI Agent & Contributor Guidelines — My-Web-Site-Application

> **Target Audience:** Autonomous AI Agents (Claude, GPT, Copilot, Cursor, etc.) and Human Engineers  
> **Repository:** `MeetBhingradiya/My-Web-Site-Application`  
> **Maintainer:** Meet Bhingradiya  
> **Last Updated:** 2026

---

## 1. System Context & Core Principles

This repository powers **Meet Bhingradiya's production portfolio and full-stack web application**. It integrates high-performance frontend interfaces, an administrative control plane, a private multi-repository GitHub CDN, a dual-layer OAuth Broker / OIDC Identity Provider, an e-commerce shop subsystem, and a dual design system (Apple Liquid Glass & Samsung One UI 7).

### The Prime Directives for AI Agents

1. **Do Not Break Production:** Every change must preserve backwards compatibility, handle edge cases, and maintain zero regression.
2. **Surgical Precision:** Modify only files directly pertinent to the user's instructions. Do not rewrite unrelated components or reformat unaffected files.
3. **Async Next.js 16 Compatibility:** In Next.js 16 App Router, all dynamic route params (`params` and `searchParams`) are asynchronous `Promise` objects. **They must be awaited**.
4. **Resilient Database Caching:** Never create ad-hoc database connections. Always import and await the cached connection from `@/Utils/MongoDB`.
5. **No Broken In-Memory Keys:** Ensure cryptographic operations fail gracefully in local development (e.g., using ephemeral keys) rather than crashing with 500 errors.
6. **No Raw Secrets:** Never commit API keys, personal access tokens, private JWKs, or database credentials.

---

## 2. Next.js 16 App Router Architectural Standards

### 2.1 Async Dynamic Route Parameters (`params` & `searchParams`)

In Next.js 16, route context objects are native JavaScript Promises.

#### ✅ Correct Pattern
```typescript
// Route Handler (src/app/api/products/[id]/route.ts)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  // ...
}

// Server Component Page (src/app/shop/products/[slug]/page.tsx)
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  // ...
}
```

#### ❌ Incorrect Pattern
```typescript
// NEVER access params synchronously in Next.js 16!
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id; // THROWS RUNTIME PROMISE DEREFERENCE ERROR
}
```

---

### 2.2 Server vs. Client Boundary Rules

* **Server Components by Default:** All files in `src/app/` are React Server Components unless marked with `'use client'`.
* **When to use `'use client'`:**
  * Component uses React hooks (`useState`, `useEffect`, `useCallback`, `useContext`).
  * Component accesses browser APIs (`window`, `document`, `localStorage`, `navigator`).
  * Component interacts with `@/Hooks/useDesignTheme`.
  * Component uses interactive motion libraries (Framer Motion).
* **Directive Placement:** The `'use client';` directive **must** be the very first line of code (before all imports).

---

## 3. Database & Mongoose Operational Rules

### 3.1 Connection Caching
Next.js serverless functions and development fast-refresh cycles repeatedly evaluate route modules. If connections are not cached, MongoDB connection pools quickly exhaust.

```typescript
// Always connect through the cached singleton utility:
import { connectDB } from "@/Utils/MongoDB";

export async function GET() {
  await connectDB();
  // Safe to perform queries...
}
```

### 3.2 Safe Model Compilation
Mongoose schemas compiled multiple times during hot-reload trigger `OverwriteModelError`. Always compile models using the fallback pattern:

```typescript
import mongoose, { Schema, Model } from "mongoose";

export interface IProduct {
  title: string;
  price: number;
}

const ProductSchema = new Schema<IProduct>({
  title: { type: String, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
```

### 3.3 Safe ObjectId Casting
Never pass raw user strings directly to `new mongoose.Types.ObjectId(id)` or `Model.findById(id)` without verification:

```typescript
if (!mongoose.isValidObjectId(id)) {
  return NextResponse.json(
    { success: false, error: "Invalid resource identifier format" },
    { status: 400 }
  );
}
```

---

## 4. Theme System & UI Implementation Checklist

The application supports a dual-theme architecture: **Apple Liquid Glass** and **Samsung One UI 7**.

### 4.1 Theme Hook Usage
When building client-side UI components that respond to theme switches:

```tsx
'use client';

import React from "react";
import { useDesignTheme } from "@/Hooks/useDesignTheme";

export function CustomCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { designTheme, isDark } = useDesignTheme();

  return (
    <div
      className={
        designTheme === "apple"
          ? "apple-glass-card p-6 rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl"
          : "samsung-card p-6 rounded-[28px] border border-black/10 dark:border-white/10 shadow-lg bg-surface"
      }
    >
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
```

### 4.2 CSS Variable Directives
Avoid hardcoding hex color values for core backgrounds, borders, or text. Always map to design tokens:

| Token | Purpose | Fallback CSS |
| :--- | :--- | :--- |
| `var(--theme-bg)` | Main viewport background | `#000000` / `#ffffff` |
| `var(--theme-fg)` | Primary text color | `#f5f5f7` / `#1d1d1f` |
| `var(--theme-card-bg)` | Frosted glass card backdrop | `rgba(255, 255, 255, 0.08)` |
| `var(--theme-card-border)`| Specular highlight border | `rgba(255, 255, 255, 0.15)` |
| `var(--theme-primary)` | Accent and brand action color | `#2997ff` / `#0071e3` |

---

## 5. Private GitHub CDN Rules

1. **Zero Media in Git:** Never commit images, PDFs, videos, or raw blobs into this repository. All assets must be hosted via the Private GitHub CDN.
2. **Never Expose Raw GitHub URLs:** The underlying storage repositories (`PrivateCloud-1`, `PrivateCloud-2`, etc.) are private. Direct links to `raw.githubusercontent.com` will return `404 Not Found` for public users.
3. **Canonical Asset URL Format:** Always reference assets via the streaming proxy:
   ```typescript
   const imageUrl = `/api/cdn/${asset.assetId}`;
   ```
4. **Programmatic Uploads:** Use `uploadToGitHubCDN()` from `@/Utils/GitHubCDN`. It automatically manages multi-repo capacity balancing (<900MB cap) and executes history compaction (`parents: []`).

---

## 6. OAuth & OIDC Authentication Rules

1. **Dual-Layer Boundary:**
   * **Upstream Social Auth:** Managed via Better-Auth (`src/lib/auth.ts`, `/api/auth/*`).
   * **Downstream OIDC Identity Provider:** Custom endpoints under `/api/immich-sso/` for third-party apps like Immich.
2. **Cryptographic Key Resilience:**
   * When handling RS256 token signing in `src/Utils/OIDCKeys.ts`, verify `IMMICH_SSO_PRIVATE_KEY_JWK`.
   * In local development, if the key is missing or invalid, generate an ephemeral in-memory RSA keypair using `jose` rather than allowing the server to throw an unhandled 500 error.
3. **PKCE Enforcement:** Downstream `/token` requests must strictly validate `code_verifier` against the stored `code_challenge` using SHA-256 (`S256`).

---

## 7. Standard API Response Structure

All API route handlers in `src/app/api/` must return uniform JSON structures.

### 7.1 Success Payload Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation"
}
```

### 7.2 Error Payload Format
```json
{
  "success": false,
  "error": "Human readable explanation of the failure",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {}
}
```

### 7.3 HTTP Status Code Mapping
* `200 OK`: Request succeeded.
* `201 Created`: Resource successfully created.
* `304 Not Modified`: Cached asset matched ETag (`If-None-Match`).
* `400 Bad Request`: Validation failure or missing required fields.
* `401 Unauthorized`: Missing or invalid session/API key.
* `403 Forbidden`: Insufficient permissions or role mismatch.
* `404 Not Found`: Resource or asset not found.
* `413 Payload Too Large`: Upload exceeds size limits.
* `429 Too Many Requests`: Rate limit window exceeded.
* `500 Internal Server Error`: Uncaught server exception.

---

## 8. AI Agent Pre-Execution & Verification Checklist

Before marking any task as complete, an AI Agent must complete this checklist:

### Phase 1: Investigation & Discovery
- [ ] Read existing implementation files using `view` or `grep`.
- [ ] Understand existing data contracts and Mongoose models in `src/Models/`.
- [ ] Check related documentation in `docs/` for architecture rules.

### Phase 2: Implementation & Surgery
- [ ] Await all Next.js 16 dynamic route `params` and `searchParams`.
- [ ] Validate Mongoose ObjectIds with `mongoose.isValidObjectId()`.
- [ ] Cache all database queries via `await connectDB()`.
- [ ] Maintain theme compatibility with both Apple and Samsung modes.
- [ ] Ensure all client components have `'use client'` at line 1.
- [ ] Do not touch unrelated files or introduce unrelated formatting changes.

### Phase 3: Validation & Verification
- [ ] Check TypeScript compilation: verify no type errors or promise dereference warnings.
- [ ] Verify HTTP endpoints return correct status codes (e.g., via `curl` or testing tools).
- [ ] Ensure dev server runs cleanly without runtime 500 exceptions.

### Phase 4: Clean Up & Documentation
- [ ] Remove any temporary debug logs or temporary test files.
- [ ] Update corresponding markdown documentation in `docs/` if APIs, models, or tokens changed.
- [ ] Ensure zero secrets or sensitive keys were committed or exposed.
