# Meet Bhingradiya — Full-Stack Web Application & Portfolio

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-Proprietary_/_MIT_Docs-orange)](./COPYRIGHT)

A production-grade, full-stack personal portfolio, web application, and cloud infrastructure platform created by **Meet Bhingradiya**. This project showcases modern web engineering with Next.js 16 App Router, React 19, a dual-design system (Apple Liquid Glass & Samsung One UI 7), an e-commerce shop subsystem, a multi-repo Private GitHub CDN, and a dual-layer OAuth Broker & OIDC SSO Service.

## 🔒 Client Security Notes

- The anti-debugger shield is started only from the client-side React wrapper and is cleaned up on unmount, which keeps Next.js development remounts from stacking duplicate timers.
- No dynamic code execution is used in the debugger trap, so the page does not need `unsafe-eval` in CSP.
- The more noisy checks, such as devtools-size and extension-script detection, are gated behind explicit feature flags in `src/Utils/AntiDebugger.ts`.

---

## 🌟 Key Architecture & Highlights

- **Dual-Engine Design System:** Seamlessly toggles between **Apple Liquid Glass** (macOS/iOS frosted glass, specular highlights, dynamic blur) and **Samsung One UI 7 Book** (bold squircles, high-contrast surfaces, responsive colorways).
- **Private Multi-Repo GitHub CDN:** Scales asset storage across multiple private GitHub repositories (`PrivateCloud-1`, `PrivateCloud-2`, etc.) with automatic capacity balancing (<900MB soft cap), privacy history compaction (`parents: []`), and an immutable streaming reverse proxy.
- **Third-Party OAuth Broker & OIDC SSO:** Integrates upstream social logins (GitHub, Google, Microsoft, Apple) via Better-Auth, while simultaneously acting as a downstream OIDC Identity Provider with RFC 7517 JWKS, RS256 token signing, and PKCE verification for self-hosted apps like Immich.
- **E-Commerce & Digital Shop Subsystem:** Integrated storefront with digital product delivery, automated license key generation, order tracking, refund requests, and customer support channels.
- **Admin Control Plane:** Comprehensive management interface for sitemaps, dynamic page seeding, product catalogs, customer orders, support tickets, and external developer CDN API keys.

---

## 📖 Comprehensive Documentation Suite

Explore the detailed technical documentation in [`docs/`](./docs):

| Documentation Guide | Scope & Key Topics |
| :--- | :--- |
| [**AI Agent & Contributor Guidelines**](./docs/AI_AGENT_GUIDELINES.md) | **Essential reading for AI agents and human contributors.** Next.js 16 async params, Mongoose connection caching, theme compliance, and pre-PR checklists. |
| [**Repository Folder Structure**](./docs/FOLDER_STRUCTURE.md) | Full architectural breakdown of the codebase, path aliases (`@/*`), module boundaries, and file placement decision tree. |
| [**Theme System Specification**](./docs/THEME_SYSTEM.md) | In-depth guide to Apple Liquid Glass & Samsung One UI 7 design tokens, CSS custom properties, and UI component recipes. |
| [**OAuth Broker & OIDC Identity Provider**](./docs/OAUTH_BROKER.md) | Dual-layer authentication architecture: upstream social broker, downstream OIDC SSO endpoints (`/api/immich-sso/*`), JWKS, and PKCE. |
| [**Private GitHub CDN Architecture**](./docs/CDN_SYSTEM.md) | Multi-repo capacity balancing, tree compaction to eliminate history bloat, streaming proxy, and cryptographic checksum audits. |
| [**CDN External Developer API**](./docs/CDN_EXTERNAL_API.md) | Public developer API guide, SHA-256 key hashing, sliding-window rate limits, and SDK integration examples (TypeScript, Python, cURL). |

---

## 🚀 Quick Start for Development

### 1. Prerequisites
- **Runtime:** [Bun](https://bun.sh) (recommended) or Node.js (v20+ LTS)
- **Database:** MongoDB Atlas cluster or local instance

### 2. Installation
```bash
git clone https://github.com/MeetBhingradiya/My-Web-Site-Application.git
cd My-Web-Site-Application
bun install
```

### 3. Environment Setup
Configure your `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/portfolio?retryWrites=true&w=majority
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Auth & Secrets
BETTER_AUTH_SECRET=your_auth_secret_key
IMMICH_SSO_PRIVATE_KEY_JWK={"kty":"RSA",...} # Optional in dev; auto-generates ephemeral keys

# Private GitHub CDN
CDN_GITHUB_FINE_GRAINED_TOKEN=github_pat_...
CDN_STORAGE_REPO_OWNER=MeetBhingradiya
```

### 4. Run Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to explore the live application.

---

## 🧪 Build & Lint Commands

```bash
# Typecheck and build for production
bun run build

# Run Next.js linter
bun run lint
```

---

## 🤝 Contributing

Contributions are welcomed! Please review our [Contributing Guide](./CONTRIBUTING.md) and the [AI Agent Guidelines](./docs/AI_AGENT_GUIDELINES.md) prior to submitting pull requests.

---

## 👤 Author & Connect

**Meet Bhingradiya**  
*Full Stack Web Developer & Computer Science Engineer*

- **Website:** [meetbhingradiya.in](https://meetbhingradiya.in)
- **GitHub:** [@MeetBhingradiya](https://github.com/MeetBhingradiya)
- **LinkedIn:** [Meet Bhingradiya](https://www.linkedin.com/in/meet-bhingradiya)
- **Email:** [me@meetbhingradiya.in](mailto:me@meetbhingradiya.in)

---

© 2025–2026 Meet Bhingradiya. All Rights Reserved.

