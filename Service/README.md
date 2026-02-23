# Encryption Service

A secure, production-ready encryption/decryption microservice built with Express
and TypeScript.

## 🔒 Security Features

- **AES-256-GCM Encryption**: Industry-standard authenticated encryption
- **HMAC Signature Verification**: Request authentication with replay protection
- **Rate Limiting**: 100 requests per minute per IP (configurable)
- **CORS Protection**: Whitelisted origins only
- **Security Headers**: HSTS, CSP, X-Frame-Options, and more
- **Input Validation**: Comprehensive validation for all inputs
- **Nonce Tracking**: Optional replay attack prevention
- **Request Size Limits**: 1MB default to prevent DoS
- **Audit Logging**: Security events and metrics logging

## 🚀 Quick Start

### Installation

```bash
bun install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your secure values
```

### Development

```bash
bun run dev
```

### Production Build

```bash
bun run build
bun run start
```

## 📋 Environment Variables

| Variable                 | Description                     | Required | Example                                       |
| ------------------------ | ------------------------------- | -------- | --------------------------------------------- |
| `ENCRYPTION_KEY`         | 64 hex characters (32 bytes)    | ✅       | Generated with `openssl rand -hex 32`         |
| `SERVICE_SIGNING_SECRET` | Base64 encoded secret           | ✅       | Generated with `openssl rand -base64 32`      |
| `ALLOWED_ORIGINS`        | Comma-separated allowed origins | ✅       | `https://example.com,https://www.example.com` |
| `PORT`                   | Local development port          | ❌       | `3000` (default)                              |
| `NODE_ENV`               | Environment                     | ❌       | `production` or `development`                 |

## 🔑 Generating Secrets

```bash
# Generate encryption key
openssl rand -hex 32

# Generate signing secret
openssl rand -base64 32
```

## 📡 API Endpoints

### Health Check

```bash
GET /
```

Response:

```json
{
    "status": "online",
    "service": "encryption-service",
    "version": "2.0.0",
    "timestamp": 1702638000000
}
```

### Detailed Health

```bash
GET /health
```

Response:

```json
{
  "status": "healthy",
  "uptime": 12345,
  "timestamp": 1702638000000,
  "memory": {...},
  "rateLimitMapSize": 10,
  "usedNoncesSize": 5
}
```

### Encrypt

```bash
POST /encrypt
Headers:
  x-signature: <HMAC-SHA256-hex>
  x-timestamp: <unix-timestamp-ms>
  x-nonce: <unique-id> (optional)
  Content-Type: application/json

Body:
{
  "data": "sensitive text" | { "any": "object" }
}
```

Response:

```json
{
    "success": true,
    "result": "iv:authTag:encryptedData"
}
```

### Decrypt

```bash
POST /decrypt
Headers:
  x-signature: <HMAC-SHA256-hex>
  x-timestamp: <unix-timestamp-ms>
  x-nonce: <unique-id> (optional)
  Content-Type: application/json

Body:
{
  "data": "iv:authTag:encryptedData"
}
```

Response:

```json
{
  "success": true,
  "result": "decrypted text" | { "any": "object" }
}
```

## 🔐 Client Authentication

### Creating Signatures

The service requires HMAC-SHA256 signatures for all encrypt/decrypt operations.

**Node.js/TypeScript Example:**

```typescript
import crypto from "crypto";

function createSignature(payload: any, signingSecret: string) {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString("hex"); // Optional but recommended

    const dataToSign = `${JSON.stringify(payload)}::${timestamp}`;
    const signature = crypto
        .createHmac("sha256", signingSecret)
        .update(dataToSign)
        .digest("hex");

    return { signature, timestamp, nonce };
}

// Usage
const payload = { data: "Hello, World!" };
const { signature, timestamp, nonce } = createSignature(
    payload,
    process.env.SERVICE_SIGNING_SECRET
);

const response = await fetch("https://your-service.vercel.app/encrypt", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "x-signature": signature,
        "x-timestamp": timestamp,
        "x-nonce": nonce
    },
    body: JSON.stringify(payload)
});
```

**Python Example:**

```python
import hmac
import hashlib
import json
import time
import secrets

def create_signature(payload, signing_secret):
    timestamp = str(int(time.time() * 1000))
    nonce = secrets.token_hex(16)

    data_to_sign = f"{json.dumps(payload)}::{timestamp}"
    signature = hmac.new(
        signing_secret.encode(),
        data_to_sign.encode(),
        hashlib.sha256
    ).hexdigest()

    return signature, timestamp, nonce
```

## 📊 Scripts

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `bun run dev`            | Start development server with hot reload |
| `bun run dev:node`       | Start with Node.js runtime               |
| `bun run build`          | Build for production (Bun)               |
| `bun run build:node`     | Build for production (Node.js)           |
| `bun run start`          | Start production server                  |
| `bun run type-check`     | TypeScript type checking                 |
| `bun run lint`           | Lint code                                |
| `bun run lint:fix`       | Fix linting issues                       |
| `bun run format`         | Format code with Prettier                |
| `bun run test`           | Run tests                                |
| `bun run deploy`         | Deploy to Vercel production              |
| `bun run deploy:preview` | Deploy to Vercel preview                 |

## 🏗️ Project Structure

```
Service/
├── index.ts              # Main application file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vercel.json           # Vercel deployment config
├── .env                  # Environment variables (local)
├── .env.example          # Environment template
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── .vercelignore         # Files to ignore in deployment
├── DEPLOYMENT.md         # Detailed deployment guide
└── README.md             # This file
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
bun install -g vercel

# Link project
vercel link

# Set environment variables
vercel env add ENCRYPTION_KEY
vercel env add SERVICE_SIGNING_SECRET
vercel env add ALLOWED_ORIGINS

# Deploy to production
vercel --prod
```

## 🛡️ Security Best Practices

1. **Key Rotation**: Rotate encryption keys quarterly
2. **Separate Keys**: Use different keys for dev/staging/prod
3. **Secret Storage**: Never commit `.env` files
4. **CORS**: Restrict `ALLOWED_ORIGINS` to specific domains
5. **Monitoring**: Set up alerts for rate limit violations
6. **Logging**: Review security logs regularly
7. **HTTPS Only**: Always use HTTPS in production
8. **Updates**: Keep dependencies updated

## 🔍 Monitoring

### Check Production Logs

```bash
vercel logs --prod
```

### Monitor Health

```bash
# Basic health check
curl https://your-service.vercel.app/

# Detailed metrics
curl https://your-service.vercel.app/health
```

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**

- Verify origin is in `ALLOWED_ORIGINS`
- Check protocol (http vs https)
- Ensure CORS headers are sent

**Invalid Signature**

- Check timestamp (30-second window)
- Verify signing secret matches
- Ensure payload matches exactly

**Rate Limited**

- Implement exponential backoff
- Consider dedicated rate limiting (Redis)
- Monitor abuse patterns

**Encryption Failures**

- Verify key is 64 hex characters
- Check data size (<10MB)
- Validate input format

## 📝 License

See COPYRIGHT file for license information.

## 🤝 Contributing

See CONTRIBUTING.md for contribution guidelines.

## 📧 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ using Express, TypeScript, and Vercel**
