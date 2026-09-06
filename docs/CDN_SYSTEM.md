# Private GitHub CDN System

> **Architecture & Operational Specification**  
> **Author:** Meet Bhingradiya  
> **Related Documentation:** [CDN_EXTERNAL_API.md](./CDN_EXTERNAL_API.md) | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | [OAUTH_BROKER.md](./OAUTH_BROKER.md) | [AI_AGENT_GUIDELINES.md](./AI_AGENT_GUIDELINES.md)

---

## 1. Executive Summary

The **Private GitHub CDN System** is an enterprise-grade, zero-cost, scalable asset storage and content delivery engine embedded directly within Meet Bhingradiya's web application. It leverages one or more private GitHub repositories as an immutable object store while completely shielding raw GitHub URLs, authentication credentials, and commit histories from client browsers and external consumers.

Assets are served via Next.js 16 streaming reverse-proxy routes authenticated using GitHub Personal Access Tokens (PAT) and delivered with production-grade `Cache-Control: public, max-age=31536000, immutable` headers.

### Key Capabilities

* **Multi-Repository Capacity Discovery:** Automatically discovers all repositories matching a configured prefix (e.g., `PrivateCloud-*`), calculates available storage against safe soft caps (<900 MB), and routes new uploads to the repo with the highest remaining capacity.
* **Privacy Git Compaction (`CDN_COMPACT_HISTORY`):** Uses low-level GitHub Git Database API operations to force-rebase branches to single parentless root commits (`parents: []`), completely erasing historical blob revisions and saving repository quota.
* **Dual-Checksum Cryptographic Integrity:** Generates both MD5 and SHA-256 checksums at upload time to guarantee cryptographic verification, bit-rot detection, and idempotent deduplication.
* **Streaming Reverse Proxy:** High-throughput streaming directly to the client without buffering multi-megabyte payloads in Node.js heap memory.
* **Native Next.js 16 & React 19 Integration:** Fully integrated with custom React hooks (`useCDNUpload`), server components, and responsive image renderers.

---

## Architecture

```
Browser / Server Component
        │
        │  POST /api/cdn/upload   (multipart form)
        ▼
┌──────────────────────────────┐
│   Next.js API Route          │
│   • Compute MD5 + SHA256     │
│   • resolveBestRepo()        │──► GitHub Contents API (PUT)
│   • CDNAsset.create()        │         │
└──────────────────────────────┘         │ stores sha
        │                                ▼
        │                   PrivateCloud-1  (or -2, -3 …)
        │                   └── cdn/
        │                       └── avatars/
        │                       └── icons/
        │                       └── banners/
        │                       └── documents/
        │                       └── …
        ▼
   MongoDB (CDNAsset collection)
   • assetId, filename, githubRepo, githubPath, sha
   • checksumMd5, checksumSha256
   • mimeType, size, type, tags, context
   • status: active | missing | deleted

        │
        │  GET /api/cdn/<assetId>
        ▼
┌──────────────────────────────┐
│   CDN Proxy Route            │
│   • fetch from GitHub API    │──► PrivateCloud-{n} (private)
│   • stream bytes             │
│   Cache-Control: immutable   │
└──────────────────────────────┘
        │
        ▼
    Browser (receives image/video/pdf …)
```

---

## Quick Setup

### 1. Create GitHub Repos

Create one or more private repositories on GitHub.  
Name them with a consistent prefix: `PrivateCloud-1`, `PrivateCloud-2`, …

The system picks the repo with the most remaining capacity automatically.

### 2. Generate a PAT

GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained

Required permissions (for the `PrivateCloud-*` repos):

| Scope    | Permission   |
| -------- | ------------ |
| Contents | Read & Write |
| Metadata | Read         |

### 3. Add Environment Variables

```env
# .env (never commit this)
# Preferred (fine-grained token)
CDN_GITHUB_FINE_GRAINED_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Backward-compatible classic token aliases (optional)
# CDN_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# CDN_GITHUB_CLASSIC_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CDN_GITHUB_OWNER=YourGitHubUsername
CDN_GITHUB_REPO_PREFIX=PrivateCloud
CDN_GITHUB_BRANCH=main
# Soft cap per repo in KB (900 MB = 921600 KB is a safe GitHub limit)
CDN_REPO_SIZE_LIMIT_KB=921600
# Keep commit history compacted to one commit for privacy
CDN_COMPACT_HISTORY=true
```

### 4. MongoDB

The `CDNAsset` model is auto-registered on the existing `PRODUCTION_MeetBhingradiya` database.  
No migration needed — Mongoose creates indexes on first connect.

---

## File URL Pattern

```
https://yourdomain.com/api/cdn/<assetId>
```

The `assetId` is a UUID v4 generated on upload. Store it (or the full URL) in your entity documents.

---

## Upload API

### REST

```http
POST /api/cdn/upload
Content-Type: multipart/form-data

file      (required) — the binary file
type      (optional) — avatar | icon | banner | background | video | document | other
tags      (optional) — comma-separated list, e.g. "profile,thumbnail"
altText   (optional) — accessibility description
context   (optional) — "<kind>:<id>" e.g. "user:abc123", "company:Google"
```

**Response:**

```json
{
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "cdnUrl": "/api/cdn/550e8400-...",
    "filename": "avatar.png",
    "githubRepo": "PrivateCloud-1",
    "size": 148320,
    "mimeType": "image/png",
    "type": "avatar",
    "checksumMd5": "d41d8cd98f00b204e9800998ecf8427e",
    "checksumSha256": "e3b0c44298fc1c149afb..."
}
```

### React Hook

```typescript
import { useCDNUpload } from "@Hooks";

function AvatarPicker({ userId }: { userId: string }) {
    const { upload, uploading, progress, error } = useCDNUpload();

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await upload(file, {
            type: "avatar",
            context: `user:${userId}`,
            tags: ["profile", "avatar"],
            altText: "User profile picture",
        });

        // result.cdnUrl — store this in your user document
        await updateUserAvatar(userId, result.cdnUrl);
    }

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            {uploading && <progress value={progress} max={100} />}
            {error && <p>{error}</p>}
        </div>
    );
}
```

---

## Usage by Entity Type

### Account / User Avatar

```typescript
await upload(file, {
    type: "avatar",
    context: `user:${session.user.id}`,
    tags: ["profile", "avatar"],
    altText: `${session.user.name} profile picture`
});
```

Store returned `cdnUrl` in `User.avatar`.

---

### Project Images & Banners

```typescript
// Main banner / hero image
await upload(bannerFile, {
    type: "banner",
    context: `project:${project.slug}`,
    tags: ["project", "banner", project.slug],
    altText: `${project.title} hero image`
});

// Screenshot
await upload(screenshotFile, {
    type: "banner",
    context: `project:${project.slug}`,
    tags: ["project", "screenshot", project.slug]
});
```

Store `cdnUrl` in `Project.banner` or `Project.screenshots[]`.

---

### Education — Institute Logos

```typescript
await upload(logoFile, {
    type: "icon",
    context: `institute:${institute.name.replace(/\s+/g, "_")}`,
    tags: ["education", "logo", "institute"],
    altText: `${institute.name} logo`
});
```

Store in `Education.instituteLogo`.

---

### Experience — Company Icons

```typescript
await upload(iconFile, {
    type: "icon",
    context: `company:${company.name.replace(/\s+/g, "_")}`,
    tags: ["company", "logo", "experience"],
    altText: `${company.name} logo`
});
```

Store in `Experience.companyLogo`.

---

### Certificates

```typescript
await upload(certFile, {
    type: "document",
    context: `cert:${cert.id}`,
    tags: ["certificate", cert.issuer.toLowerCase()],
    altText: `${cert.title} certificate from ${cert.issuer}`
});
```

Store `cdnUrl` in `Certificate.image` or `Certificate.document`.

---

### Backgrounds & Global Assets

```typescript
await upload(bgFile, {
    type: "background",
    context: "global",
    tags: ["background", "hero"]
});
```

---

## Multi-Repo Scaling

The system automatically manages multiple `PrivateCloud-*` repos:

1. On each upload, all repos matching `CDN_GITHUB_REPO_PREFIX` are fetched from GitHub  
   (paginated, cached for 5 minutes in-process).
2. Repos are sorted by ascending `sizeKb`.
3. The first repo under `CDN_REPO_SIZE_LIMIT_KB` is selected.
4. If **all** repos exceed the cap, a new `PrivateCloud-N` repo is created automatically.
5. After a successful upload the cache is invalidated so the next upload sees the updated size.

**To add storage:** just create another repo named `PrivateCloud-2`, `PrivateCloud-3`, etc.  
No code or env var changes needed.

---

## Integrity Checks

### Standard Check

```http
POST /api/admin/cdn/check
```

Calls `GET contents/<path>` for every active asset. Detects:

- Files still present (SHA may have changed externally → updated in MongoDB)
- Files missing on GitHub → `status: "missing"`
- Previously missing files re-appearing → `status: "active"` restored

> Note: Because branch history is compacted to a single commit, historical rollback by commit is not available.

### Deep Check (Checksum Verification)

```http
POST /api/admin/cdn/check?deep=1
```

Downloads every active file and computes MD5. Compares against stored `checksumMd5`.

Returns:

```json
{
    "checked": 42,
    "restored": 0,
    "nowMissing": 0,
    "checksumMismatch": 1,
    "mismatchIds": ["550e8400-..."]
}
```

> Deep checks use a 200ms delay between files to avoid GitHub API rate limits.

---

## Admin Panel

Navigate to `/admin/cdn` to:

- **View all assets** filtered by repo, type, status, or free-text search
- **See per-repo usage** as cards with progress bars turning amber (>80%) / red (>95%)
- **Open asset detail drawer** for full metadata — checksums, GitHub path, context, edit tags/alt
- **Upload new assets** with the drag-drop modal
- **Run integrity checks** (standard or deep)
- **Delete assets** — removes from GitHub + marks `status: "deleted"` in MongoDB

---

## Asset Types Reference

| `type`       | Use case                                  |
| ------------ | ----------------------------------------- |
| `avatar`     | User profile pictures                     |
| `icon`       | Company / institute / tool logos          |
| `banner`     | Project hero images, screenshots, banners |
| `background` | Page/section background images            |
| `video`      | Short demo clips                          |
| `document`   | PDFs, certificates, exported files        |
| `other`      | Anything else                             |

## Context Format Reference

| Entity        | Recommended `context`       |
| ------------- | --------------------------- |
| User          | `user:<userId>`             |
| Project       | `project:<slug>`            |
| Company       | `company:<CompanyName>`     |
| Institute     | `institute:<InstituteName>` |
| Certificate   | `cert:<certId>`             |
| Course        | `course:<courseId>`         |
| Global/shared | `global`                    |

---

## 9. Streaming Reverse Proxy & HTTP Caching Details

The public CDN route handler at `src/app/api/cdn/[assetId]/route.ts` implements a high-performance streaming proxy:

```typescript
// Architectural Flow in /api/cdn/[assetId]
// 1. Resolve asset from MongoDB CDNAsset by assetId
// 2. Extract ETag from asset.checksumSha256
// 3. Evaluate If-None-Match header -> Return 304 if matched
// 4. Fetch raw binary stream from GitHub Git Database/Blob API
// 5. Stream response with Cache-Control: public, max-age=31536000, immutable
```

### Response Headers Enforced

```http
Cache-Control: public, max-age=31536000, immutable
Content-Type: <mimeType>
Content-Length: <sizeInBytes>
ETag: "<checksumSha256>"
Access-Control-Allow-Origin: *
Timing-Allow-Origin: *
```

* **Immutable Caching:** Because assets are identified by UUID v4 (`assetId`), their contents are immutable. Intermediate proxies, edge CDNs (Cloudflare), and browser caches cache the file indefinitely without revalidation round-trips.
* **304 Optimization:** If a client presents `If-None-Match: "<checksumSha256>"`, the route immediately halts processing and terminates with `304 Not Modified`, saving GitHub API quota and bandwidth.

---

## 10. Troubleshooting & Common Operational Pitfalls

| Symptom | Primary Cause | Remediation |
| :--- | :--- | :--- |
| `401 Unauthorized` during upload | Invalid or expired GitHub Personal Access Token | Regenerate PAT with `Contents (R/W)` and `Metadata (R)` and update `CDN_GITHUB_FINE_GRAINED_TOKEN`. |
| `404 Asset Not Found` on `/api/cdn/<id>` | Asset record missing in MongoDB or file missing on GitHub | Run `/api/admin/cdn/check` to audit repository status and inspect `CDNAsset` collection. |
| `413 Payload Too Large` | Upload file exceeds configured byte limit | Enforce client-side file compression before dispatching to `/api/cdn/upload`. |
| `Secondary Rate Limit Exceeded` | Too many parallel GitHub API mutations | Enable batching and use deep audit delays (200ms sleep) during integrity checks. |
| Branch history grows unexpectedly | `CDN_COMPACT_HISTORY` set to false | Set `CDN_COMPACT_HISTORY=true` in `.env` to enable parentless root commits on mutations. |

