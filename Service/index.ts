import express, { type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';

// --- CONFIGURATION ---
// Ensure these are set in your Vercel Environment Variables
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY; // Must be 64 hex characters (32 bytes)
const SIGNING_SECRET = process.env.SERVICE_SIGNING_SECRET; // Strong random string for HMAC
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || []; // Whitelist of allowed origins
const MAX_REQUEST_SIZE = '1mb'; // Limit request body size
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

if (!ENCRYPTION_KEY_HEX || !SIGNING_SECRET) {
    throw new Error('Missing ENCRYPTION_KEY or SERVICE_SIGNING_SECRET env variables');
}

if (ENCRYPTION_KEY_HEX.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
}

if (!ALLOWED_ORIGINS.length) {
    console.warn('[WARNING] ALLOWED_ORIGINS not set. CORS will be disabled.');
}

const app = express();

// --- RATE LIMITING (In-Memory for Serverless) ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function cleanupRateLimitMap() {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}

// Cleanup old entries every 5 minutes
setInterval(cleanupRateLimitMap, 300000);

const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    
    let rateLimit = rateLimitMap.get(identifier as string);
    
    if (!rateLimit || now > rateLimit.resetTime) {
        rateLimit = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        rateLimitMap.set(identifier as string, rateLimit);
        return next();
    }
    
    rateLimit.count++;
    
    if (rateLimit.count > RATE_LIMIT_MAX_REQUESTS) {
        console.warn(`[Security] Rate limit exceeded for ${identifier}`);
        return res.status(429).json({ 
            error: 'Too many requests', 
            retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000) 
        });
    }
    
    next();
};

// --- MIDDLEWARE ---

// CORS Configuration
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    if (ALLOWED_ORIGINS.length && origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature, x-timestamp');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }
    
    next();
});

// Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.removeHeader('X-Powered-By');
    next();
});

// Request Size Limit
app.use(express.json({ limit: MAX_REQUEST_SIZE }));

// Rate Limiting
app.use(rateLimiter);

// Request Logging (exclude sensitive data)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// --- UTILS: CRYPTO (AES-256-GCM) ---

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const AUTH_TAG_LENGTH = 16; // GCM auth tag length
const MAX_DATA_SIZE = 10 * 1024 * 1024; // 10MB max for encryption/decryption

let KEY: Buffer;
try {
    KEY = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
    if (KEY.length !== 32) {
        throw new Error('Key must be 32 bytes');
    }
} catch (err) {
    throw new Error('Invalid ENCRYPTION_KEY format. Must be 64 hex characters.');
}

// Format: iv:authTag:encryptedData
function encryptData(text: string): string {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }
    
    if (Buffer.byteLength(text, 'utf8') > MAX_DATA_SIZE) {
        throw new Error('Data too large for encryption');
    }
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    
    if (authTag.length !== AUTH_TAG_LENGTH) {
        throw new Error('Invalid auth tag generated');
    }

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptData(text: string): string {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }
    
    const parts = text.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encryption format');
    }

    const ivHex = parts[0];
    const authTagHex = parts[1];
    const encryptedHex = parts[2];
    
    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Missing encryption components');
    }
    
    // Validate hex strings
    if (!/^[0-9a-f]+$/i.test(ivHex) || !/^[0-9a-f]+$/i.test(authTagHex) || !/^[0-9a-f]+$/i.test(encryptedHex)) {
        throw new Error('Invalid hex format');
    }
    
    // Validate lengths
    if (ivHex.length !== IV_LENGTH * 2 || authTagHex.length !== AUTH_TAG_LENGTH * 2) {
        throw new Error('Invalid IV or auth tag length');
    }
    
    if (encryptedHex.length > MAX_DATA_SIZE * 2) {
        throw new Error('Encrypted data too large');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// --- UTILS: SIGNATURE VERIFICATION ---

// In-memory nonce tracking (for replay attack prevention)
const usedNonces = new Set<string>();
const nonceCleanupInterval = 60000; // Clean up nonces older than 1 minute

setInterval(() => {
    if (usedNonces.size > 10000) {
        usedNonces.clear();
        console.log('[Security] Nonce cache cleared');
    }
}, nonceCleanupInterval);

function verifySignature(payload: any, timestamp: string, signature: string, nonce?: string): boolean {
    // Validate inputs
    if (!timestamp || !signature || !/^\d+$/.test(timestamp)) {
        return false;
    }
    
    // Prevent Replay Attacks (30 second window)
    const now = Date.now();
    const requestTime = parseInt(timestamp, 10);
    
    if (isNaN(requestTime) || Math.abs(now - requestTime) > 30000) {
        console.warn('[Security] Timestamp outside valid window');
        return false;
    }
    
    // Nonce-based replay protection (optional but recommended)
    if (nonce) {
        if (usedNonces.has(nonce)) {
            console.warn('[Security] Duplicate nonce detected');
            return false;
        }
        usedNonces.add(nonce);
    }

    // Reconstruct signature: HMAC(payload + "::" + timestamp)
    try {
        const dataToSign = `${JSON.stringify(payload)}::${timestamp}`;
        const expectedSignature = crypto
            .createHmac('sha256', SIGNING_SECRET!)
            .update(dataToSign)
            .digest('hex');

        // Constant-time comparison
        const source = Buffer.from(signature, 'hex');
        const target = Buffer.from(expectedSignature, 'hex');

        if (source.length !== target.length) return false;
        return crypto.timingSafeEqual(source, target);
    } catch (err) {
        console.error('[Security] Signature verification error:', err);
        return false;
    }
}

const requireSignature = (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    const nonce = req.headers['x-nonce'] as string; // Optional but recommended

    if (!signature || !timestamp) {
        console.warn(`[Security] Missing headers from ${req.ip}`);
        return res.status(401).json({ error: 'Missing security headers' });
    }
    
    // Validate signature format
    if (!/^[0-9a-f]{64}$/i.test(signature)) {
        console.warn(`[Security] Invalid signature format from ${req.ip}`);
        return res.status(401).json({ error: 'Invalid signature format' });
    }

    try {
        const isValid = verifySignature(req.body, timestamp, signature, nonce);
        if (!isValid) {
            console.error(`[Security] Invalid signature from IP: ${req.ip} at ${new Date().toISOString()}`);
            return res.status(403).json({ error: 'Invalid or expired signature' });
        }
        next();
    } catch (error) {
        console.error('[Security] Signature verification exception:', error);
        return res.status(403).json({ error: 'Signature verification failed' });
    }
};

// --- ROUTES ---

// Health check endpoint (no authentication required)
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'online', 
        service: 'encryption-service',
        version: '2.0.0',
        timestamp: Date.now()
    });
});

// Detailed health check (for monitoring)
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        rateLimitMapSize: rateLimitMap.size,
        usedNoncesSize: usedNonces.size
    };
    res.status(200).json(health);
});

app.post('/encrypt', requireSignature, (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
        const { data } = req.body;
        
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }
        
        // Validate data type
        if (typeof data !== 'string' && typeof data !== 'object') {
            return res.status(400).json({ error: 'Invalid data type' });
        }

        // Handle objects or strings
        const stringData = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Additional size check
        if (Buffer.byteLength(stringData, 'utf8') > MAX_DATA_SIZE) {
            return res.status(413).json({ error: 'Payload too large' });
        }
        
        const encrypted = encryptData(stringData);
        
        const duration = Date.now() - startTime;
        console.log(`[Metrics] Encryption completed in ${duration}ms for IP: ${req.ip}`);

        return res.json({ success: true, result: encrypted });
    } catch (err: any) {
        console.error(`[Error] Encryption failed for IP ${req.ip}:`, err.message);
        // Don't leak implementation details
        return res.status(500).json({ error: 'Encryption failed' });
    }
});

app.post('/decrypt', requireSignature, (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
        const { data } = req.body; // Expects "iv:tag:content" format
        
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }
        
        if (typeof data !== 'string') {
            return res.status(400).json({ error: 'Invalid data type' });
        }
        
        // Basic format validation before attempting decryption
        if (!data.includes(':') || data.split(':').length !== 3) {
            return res.status(400).json({ error: 'Invalid encrypted data format' });
        }

        const decrypted = decryptData(data);
        
        const duration = Date.now() - startTime;
        console.log(`[Metrics] Decryption completed in ${duration}ms for IP: ${req.ip}`);

        // Try to parse JSON, otherwise return string
        try {
            const parsed = JSON.parse(decrypted);
            return res.json({ success: true, result: parsed });
        } catch {
            return res.json({ success: true, result: decrypted });
        }
    } catch (err: any) {
        console.error(`[Error] Decryption failed for IP ${req.ip}:`, err.message);
        // Generic error to avoid leaking implementation details
        return res.status(500).json({ error: 'Decryption failed or invalid data' });
    }
});

// 404 handler
app.use((req, res) => {
    console.warn(`[Security] 404 - Undefined route accessed: ${req.method} ${req.path} from ${req.ip}`);
    res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error] Unhandled exception:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// --- START SERVER (LOCAL ONLY) ---
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`[Server] Encryption Service running on http://localhost:${PORT}`);
        console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`[Server] CORS Origins: ${ALLOWED_ORIGINS.join(', ') || 'None (disabled)'}`);
    });
}

// --- EXPORT FOR VERCEL ---
export default app;