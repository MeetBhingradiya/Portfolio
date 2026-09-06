# Contributing to Meet Bhingradiya's Application & Portfolio

Thank you for your interest in contributing! This repository is an open-source, full-stack web application, developer portfolio, and cloud platform built with Next.js 16 App Router, React 19, Tailwind CSS v4, and MongoDB Atlas.

Whether you are a human software engineer or an autonomous AI agent, this guide outlines the workflow, architecture, and coding standards required to land pull requests cleanly.

---

## 📚 Essential Documentation Suite

Before contributing or modifying code, please consult the specialized documentation in the [`docs/`](./docs) directory:

| Guide | Description |
| :--- | :--- |
| [**AI Agent Guidelines**](./docs/AI_AGENT_GUIDELINES.md) | **Must-read for autonomous agents & contributors.** Checklists, Next.js 16 async params, Mongoose caching rules, and verification steps. |
| [**Folder Structure**](./docs/FOLDER_STRUCTURE.md) | Comprehensive map of repository directories, atomic design hierarchies, module boundaries, and file placement decision tree. |
| [**Theme System**](./docs/THEME_SYSTEM.md) | Apple Liquid Glass & Samsung One UI 7 design specifications, CSS custom properties, and component recipes. |
| [**OAuth Broker & OIDC SSO**](./docs/OAUTH_BROKER.md) | Dual-layer auth architecture: upstream social providers (Better-Auth) and downstream OIDC SSO Identity Provider (`/api/immich-sso/*`). |
| [**Private GitHub CDN**](./docs/CDN_SYSTEM.md) | Architecture of the multi-repo GitHub CDN, capacity balancing (<900MB cap), privacy history compaction, and streaming proxy. |
| [**CDN External Developer API**](./docs/CDN_EXTERNAL_API.md) | Third-party developer API guide, authentication, rate limits, and SDK integration examples. |

---

## 🛠️ Prerequisites & Local Development

- **Runtime:** [Bun](https://bun.sh) (preferred) or Node.js (v20+ LTS)
- **Database:** MongoDB Atlas or local MongoDB instance (URI configured in `.env`)
- **Git:** Git 2.30+

### Setup Steps

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/My-Web-Site-Application.git
   cd My-Web-Site-Application
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` (or configure `.env`) with your MongoDB URI, auth secrets, and GitHub PAT:
   ```bash
   cp .env.example .env # or verify .env exists
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```
   The site will be available at `http://localhost:3000`.

---

## 📋 Rules of Engagement for Contributors & AI Agents

1. **Next.js 16 Async Route Parameters:** Dynamic route parameters (`params` and `searchParams`) are asynchronous Promises and **must always be awaited**:
   ```typescript
   export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
   }
   ```
2. **Cached Mongoose Connections:** Never instantiate isolated database connections. Always import `connectDB` from `@/Utils/MongoDB`.
3. **Safe Model Compilation:** Use `mongoose.models.Name || mongoose.model('Name', schema)` to prevent hot-reload compilation errors.
4. **Theme Adherence:** All new UI components must be compatible with both the Apple Liquid Glass (`apple`) and Samsung One UI 7 (`samsung`) design systems.
5. **No Direct Git Media:** Never commit raw images, videos, or binary blobs directly to Git. Use the Private GitHub CDN pipeline (`/api/cdn/upload`).
6. **No Secret Leaks:** Never commit plaintext credentials, private JWKs, or environment tokens.

---

## 🔀 Pull Request Process

1. Create a dedicated topic branch:
   ```bash
   git checkout -b feature/my-enhancement
   ```
2. Make atomic, focused commits with descriptive messages following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat(shop): add support for Apple frosted glass refund status badges"
   ```
3. Verify your changes locally by testing affected routes and checking for TypeScript errors.
4. Push to your fork and submit a Pull Request to `main`.
5. Ensure your PR description includes:
   - Summary of changes
   - Associated issue numbers (if any)
   - Screenshots / screencasts for UI modifications
   - Verification steps performed

---

## 💬 Community & Contact

- **Author:** Meet Bhingradiya
- **Email:** [me@meetbhingradiya.in](mailto:me@meetbhingradiya.in)
- **Website:** [meetbhingradiya.in](https://meetbhingradiya.in)
- **GitHub:** [@MeetBhingradiya](https://github.com/MeetBhingradiya)

