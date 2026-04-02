# CDN External API — Developer Guide

> Last updated: 2026  
> Author: Meet Bhingradiya

Allow third-party applications to store and serve files through the same private GitHub CDN that powers this portfolio. Access is gated
behind an **API key** issued by the site owner after manually approving an application.

---

## Overview

```
External App
    │
    │  POST /api/cdn/external/upload    (with API key)
    ▼
┌──────────────────────────────────┐
│   External CDN API               │
│   • Validate API key             │
│   • Enforce rate limits          │
│   • Forward to GitHub CDN        │──► PrivateCloud-{n}
│   • Persist CDNAsset record      │──► MongoDB
└──────────────────────────────────┘
    │
    │  GET /api/cdn/external/<assetId>  (with API key, for private proxy)
    │  GET /api/cdn/<assetId>           (public, no key required once uploaded)
    ▼
    External App / Browser
```

Public asset URLs (`/api/cdn/<assetId>`) never require an API key — the key is only needed to **upload** files or to proxy downloads through
the rate-limited external endpoint.

---

## Access Request Flow

```
1. Developer fills in the application form  →  POST /api/cdn/applications
2. Admin reviews in the dashboard           →  PATCH /api/admin/cdn/applications/<id>  { action: "approve" }
3. Admin issues an API key                  →  POST  /api/admin/cdn/api-keys            { applicationId }
4. Admin copies the plaintext key and sends it to the developer
   (the key is shown ONLY ONCE — it is stored as a SHA-256 hash)
5. Developer uses the key in requests
```

---

## Getting Access

### Step 1 — Submit an Application

```http
POST /api/cdn/applications
Content-Type: application/json
```

**Request body:**

| Field                     | Type                           | Required | Description                                   |
| ------------------------- | ------------------------------ | -------- | --------------------------------------------- |
| `applicantName`           | string                         | ✅       | Your full name                                |
| `applicantEmail`          | string                         | ✅       | Contact email                                 |
| `applicantUserId`         | string                         | –        | Your user ID on this site (if registered)     |
| `appName`                 | string                         | ✅       | Name of your application                      |
| `appDescription`          | string                         | ✅       | Short description of your app                 |
| `useCaseDetails`          | string                         | ✅       | Why you need CDN access and how you'll use it |
| `appWebsite`              | string                         | –        | Your app website                              |
| `appGithub`               | string                         | –        | GitHub repo URL                               |
| `appOrganisation`         | string                         | –        | Organisation name                             |
| `requestedPlan`           | `free\|basic\|pro\|enterprise` | –        | Default: `free`                               |
| `expectedMonthlyRequests` | number                         | –        | Estimated monthly request volume              |

**Example:**

```json
{
    "applicantName": "Jane Smith",
    "applicantEmail": "jane@example.com",
    "appName": "Acme Dashboard",
    "appDescription": "Internal company dashboard that stores employee avatars and documents.",
    "useCaseDetails": "We need to store ~50 employee profile pictures (PNG/JPEG) and ~200 PDFs per month. We will serve them from our own backend.",
    "requestedPlan": "basic",
    "expectedMonthlyRequests": 5000,
    "appWebsite": "https://dashboard.acme.com"
}
```

**Response (201):**

```json
{
    "applicationId": "6641f3a7c4e2b8d0a1f2c3d4",
    "status": "pending",
    "message": "Application submitted. You will be notified by email once reviewed."
}
```

### Step 2 — Check Application Status

```http
GET /api/cdn/applications?email=jane@example.com
```

**Response:**

```json
{
    "applications": [
        {
            "_id": "6641f3a7c4e2b8d0a1f2c3d4",
            "appName": "Acme Dashboard",
            "status": "approved",
            "requestedPlan": "basic",
            "createdAt": "2026-03-01T12:00:00.000Z"
        }
    ]
}
```

An admin will contact you with your API key once the application is approved.

---

## Authentication

Every external API request must include your API key using **one** of the following methods:

| Method                 | Example                                   |
| ---------------------- | ----------------------------------------- |
| `Authorization` header | `Authorization: Bearer cdn_a1b2c3d4ef...` |
| `X-CDN-Key` header     | `X-CDN-Key: cdn_a1b2c3d4ef...`            |
| Query parameter        | `?api_key=cdn_a1b2c3d4ef...`              |

> ⚠ Keep your API key secret. Never expose it in client-side JavaScript or public repositories.

---

## Plans & Rate Limits

| Plan         | req/min | req/hour | req/day | Max file size |
| ------------ | ------- | -------- | ------- | ------------- |
| `free`       | 10      | 200      | 1,000   | 5 MB          |
| `basic`      | 30      | 1,000    | 10,000  | 20 MB         |
| `pro`        | 120     | 5,000    | 50,000  | 49 MB         |
| `enterprise` | 600     | 20,000   | 200,000 | 49 MB         |

Rate limit windows are **sliding per calendar UTC bucket** (minute / hour / day).

### Rate Limit Response Headers

Every successful response includes:

```
X-RateLimit-Remaining-Minute: 27
X-RateLimit-Remaining-Hour:   968
X-RateLimit-Remaining-Day:    9831
```

### Rate Limit Exceeded (429)

```json
{
    "error": "Rate limit exceeded: 30 requests/minute.",
    "retryAfter": 47
}
```

The `retryAfter` field is in **seconds**. The `Retry-After` HTTP header is also set.

---

## API Reference

### Upload a File

```http
POST /api/cdn/external/upload
Authorization: Bearer cdn_<your-key>
Content-Type: multipart/form-data
```

**Form fields:**

| Field     | Type   | Required | Description                                                            |
| --------- | ------ | -------- | ---------------------------------------------------------------------- |
| `file`    | File   | ✅       | The file to upload                                                     |
| `type`    | string | –        | `avatar \| icon \| banner \| background \| video \| document \| other` |
| `tags`    | string | –        | Comma-separated tags, e.g. `"profile,thumbnail"`                       |
| `altText` | string | –        | Accessibility description                                              |
| `context` | string | –        | Owning entity reference, e.g. `"user:abc123"`                          |

**Success response (201):**

```json
{
    "assetId": "a1b2c3d4e5f6...",
    "cdnUrl": "https://meetbhingradiya.vercel.app/api/cdn/a1b2c3d4e5f6...",
    "filename": "avatar.png",
    "githubRepo": "PrivateCloud-1",
    "size": 148320,
    "mimeType": "image/png",
    "type": "avatar",
    "checksumMd5": "d41d8cd98f00b204e9800998ecf8427e",
    "checksumSha256": "e3b0c44298fc1c149afb..."
}
```

**cURL example:**

```bash
curl -X POST https://meetbhingradiya.vercel.app/api/cdn/external/upload \
  -H "Authorization: Bearer cdn_a1b2c3d4ef..." \
  -F "file=@/path/to/avatar.png" \
  -F "type=avatar" \
  -F "tags=profile,user" \
  -F "context=user:jane123"
```

**JavaScript (fetch) example:**

```typescript
const form = new FormData();
form.append("file", file);
form.append("type", "avatar");
form.append("tags", "profile,user");
form.append("context", `user:${userId}`);

const res = await fetch("https://meetbhingradiya.vercel.app/api/cdn/external/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${CDN_API_KEY}` },
    body: form
});

const data = await res.json();
// data.cdnUrl — store this in your database
```

---

### Download an Asset (Rate-Limited Proxy)

```http
GET /api/cdn/external/<assetId>
Authorization: Bearer cdn_<your-key>
```

Use this when you need to proxy the CDN file through your own backend (counts against rate limits) and want to inspect rate-limit headers.

For **direct browser access**, the public endpoint requires no key:

```
GET /api/cdn/<assetId>
```

---

### Key Info & Current Usage

```http
GET /api/cdn/external/me
Authorization: Bearer cdn_<your-key>
```

**Response:**

```json
{
    "keyId": "key_a1b2c3d4",
    "keyPrefix": "cdn_a1b2c3",
    "appName": "Acme Dashboard",
    "plan": "basic",
    "status": "active",
    "expiresAt": null,
    "rateLimit": {
        "requestsPerMinute": 30,
        "requestsPerHour": 1000,
        "requestsPerDay": 10000,
        "maxFileSizeBytes": 20971520,
        "allowUpload": true,
        "allowDownload": true,
        "allowedMimeTypes": []
    },
    "usage": {
        "totalRequests": 1523,
        "totalUploads": 88,
        "totalDownloads": 1435,
        "lastUsedAt": "2026-03-03T09:12:44.000Z",
        "currentWindows": {
            "minute": { "used": 3, "limit": 30, "remaining": 27 },
            "hour": { "used": 32, "limit": 1000, "remaining": 968 },
            "day": { "used": 169, "limit": 10000, "remaining": 9831 }
        }
    }
}
```

---

## Error Reference

| HTTP Status | Meaning                                     |
| ----------- | ------------------------------------------- |
| `400`       | Bad request — missing required field        |
| `401`       | Missing or malformed API key                |
| `403`       | Key revoked, suspended, or expired          |
| `404`       | Asset not found                             |
| `409`       | Duplicate application or key already exists |
| `410`       | Asset has been permanently deleted          |
| `413`       | File exceeds the per-key size limit         |
| `415`       | MIME type not allowed for this key          |
| `422`       | Validation error — check the `error` field  |
| `429`       | Rate limit exceeded — see `retryAfter`      |
| `500`       | Internal server error                       |

---

## Key Lifecycle

```
issued (active)
    │
    ├── admin suspends → suspended  ──► admin reinstates → active
    │
    ├── admin revokes  → revoked    (permanent, cannot be reinstated)
    │
    └── expiresAt reached → expired (auto-detected on next request)
```

- **Suspended** keys return `403`. Contact the site owner to reinstate.
- **Revoked** keys return `403` permanently. Submit a new application for a replacement.
- **Expired** keys return `403`. Request a key renewal.

---

## File Size & Type Limits

| Asset type   | Sub-folder in repo     |
| ------------ | ---------------------- |
| `avatar`     | `uploads/avatars/`     |
| `icon`       | `uploads/icons/`       |
| `banner`     | `uploads/banners/`     |
| `background` | `uploads/backgrounds/` |
| `video`      | `uploads/videos/`      |
| `document`   | `uploads/documents/`   |
| `other`      | `uploads/misc/`        |

Maximum per-file size is determined by your plan (see the table above). GitHub's hard limit is 100 MB, but the system caps uploads at **49
MB** for safety.

---

## Admin Operations (Site Owner Only)

The following routes require admin session authentication (not an API key).

### List Applications

```http
GET /api/admin/cdn/applications?status=pending&page=1&limit=50
```

### Approve / Reject / Suspend an Application

```http
PATCH /api/admin/cdn/applications/<id>
Content-Type: application/json

{
  "action": "approve",
  "adminNotes": "Legit use case — approved for basic plan."
}
```

Actions: `approve` | `reject` | `suspend` | `reopen`

On rejection, include `rejectionReason` (shown to the applicant).

### Issue an API Key

```http
POST /api/admin/cdn/api-keys
Content-Type: application/json

{
  "applicationId": "6641f3a7c4e2b8d0a1f2c3d4",
  "notes": "Standard basic plan key",
  "expiresAt": "2027-01-01T00:00:00.000Z",
  "rateLimitOverride": {
    "requestsPerDay": 20000
  }
}
```

> ⚠ The plaintext API key is returned **only in this response**. Copy and deliver it to the developer securely. It cannot be recovered
> later.

### List / Manage API Keys

```http
GET    /api/admin/cdn/api-keys
GET    /api/admin/cdn/api-keys/<keyId>
PATCH  /api/admin/cdn/api-keys/<keyId>   { "action": "revoke", "revokeReason": "..." }
DELETE /api/admin/cdn/api-keys/<keyId>   (permanent hard delete)
```

PATCH actions: `revoke` | `suspend` | `reinstate`

---

## Security Considerations

1. **Keys are hashed** — only a SHA-256 hash is stored in MongoDB. A database breach does not expose active keys.
2. **Rate windows are server-side** — clients cannot bypass limits by rotating IPs; limits are per-key.
3. **MIME type restrictions** — admins can restrict a key to only allow specific file types (e.g. `["image/*"]`).
4. **Upload permission** — the `allowUpload` flag can be set to `false` to issue read-only keys.
5. **Size caps** — each plan enforces a per-file byte limit enforced server-side.
6. **Expiry** — keys can carry an explicit `expiresAt` for time-limited access.
7. **Audit trail** — every upload tagged with `api-key:<keyId>` and `app:<appName>` for admin searchability.
