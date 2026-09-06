/**
 * Device Fingerprint Generator
 *
 * Lightweight client-side fingerprint using canvas rendering, WebGL
 * renderer info, and screen characteristics. The resulting hash is
 * deterministic per device/browser combination and survives IP changes.
 *
 * The fingerprint is automatically attached to all fetch requests via
 * the `x-device-fp` header through a global fetch interceptor.
 *
 * Techniques:
 *   1. Canvas 2D — render text + shapes → hash pixel data
 *   2. WebGL — extract renderer/vendor strings
 *   3. Screen — resolution, color depth, pixel ratio
 *   4. Combine all signals → SHA-256 hash
 */

const STORAGE_KEY = "__dfp_v1";
const HEADER_NAME = "x-device-fp";

/**
 * Generate a SHA-256 hash of the input string.
 * Uses the Web Crypto API (available in all modern browsers).
 */
async function sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a canvas fingerprint by rendering specific text and shapes
 * and hashing the resulting pixel data.
 */
function getCanvasFingerprint(): string {
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 280;
        canvas.height = 60;
        const ctx = canvas.getContext("2d");
        if (!ctx) return "no-canvas";

        // Text rendering with specific fonts creates unique pixel patterns
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);

        ctx.fillStyle = "#069";
        ctx.font = "11pt 'Arial', sans-serif";
        ctx.fillText("MBfp!@#$%^&*()", 2, 15);

        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.font = "18pt 'Times New Roman', serif";
        ctx.fillText("MBfp!@#$%^&*()", 4, 45);

        // Draw arc and gradient for additional uniqueness
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = "rgb(255,0,255)";
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        const gradient = ctx.createLinearGradient(0, 0, 280, 0);
        gradient.addColorStop(0, "rgb(255,0,0)");
        gradient.addColorStop(0.5, "rgb(0,255,0)");
        gradient.addColorStop(1, "rgb(0,0,255)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 280, 10);

        return canvas.toDataURL();
    } catch {
        return "canvas-error";
    }
}

/**
 * Extract WebGL renderer and vendor information.
 * These values are hardware-specific and persist across sessions.
 */
function getWebGLFingerprint(): string {
    try {
        const canvas = document.createElement("canvas");
        const gl =
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
        if (!gl) return "no-webgl";

        const glCtx = gl as WebGLRenderingContext;
        const debugInfo = glCtx.getExtension("WEBGL_debug_renderer_info");
        if (!debugInfo) return "no-debug-info";

        const vendor = glCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = glCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        return `${vendor}~${renderer}`;
    } catch {
        return "webgl-error";
    }
}

/**
 * Collect screen-related characteristics.
 */
function getScreenFingerprint(): string {
    try {
        return [
            screen.width,
            screen.height,
            screen.colorDepth,
            window.devicePixelRatio || 1,
            screen.availWidth,
            screen.availHeight,
            new Date().getTimezoneOffset()
        ].join(":");
    } catch {
        return "screen-error";
    }
}

/**
 * Collect additional browser signals for fingerprint uniqueness.
 */
function getBrowserSignals(): string {
    try {
        return [
            navigator.hardwareConcurrency || "unknown",
            navigator.maxTouchPoints || 0,
            navigator.language || "unknown",
            navigator.languages?.join(",") || "unknown",
            typeof navigator.getBattery === "function" ? "battery" : "no-battery",
            "ontouchstart" in window ? "touch" : "no-touch"
        ].join("|");
    } catch {
        return "signals-error";
    }
}

/**
 * Generate a device fingerprint combining all signals.
 * Returns a 64-character hex string (SHA-256 hash).
 */
export async function generateFingerprint(): Promise<string> {
    const signals = [
        getCanvasFingerprint(),
        getWebGLFingerprint(),
        getScreenFingerprint(),
        getBrowserSignals()
    ].join("|||");

    return sha256(signals);
}

/**
 * Get or generate the device fingerprint.
 * Caches in sessionStorage to avoid re-computation on every page load.
 */
export async function getDeviceFingerprint(): Promise<string> {
    // Check sessionStorage cache
    if (typeof window !== "undefined" && window.sessionStorage) {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached && cached.length === 64) {
            return cached;
        }
    }

    const fp = await generateFingerprint();

    // Cache in sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
        try {
            sessionStorage.setItem(STORAGE_KEY, fp);
        } catch {
            // Storage full — ignore
        }
    }

    return fp;
}

/**
 * Install a global fetch interceptor that automatically attaches
 * the device fingerprint to all outgoing requests via the
 * `x-device-fp` header.
 *
 * Must be called once on app initialization.
 */
export function installFetchInterceptor(fingerprint: string): void {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = function patchedFetch(
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<Response> {
        const headers = new Headers(init?.headers || {});

        // Only attach to same-origin requests
        let isSameOrigin = true;
        try {
            if (typeof input === "string" && input.startsWith("http")) {
                const url = new URL(input);
                isSameOrigin = url.origin === window.location.origin;
            } else if (input instanceof URL) {
                isSameOrigin = input.origin === window.location.origin;
            } else if (input instanceof Request) {
                const url = new URL(input.url);
                isSameOrigin = url.origin === window.location.origin;
            }
        } catch {
            // If URL parsing fails, assume same-origin
        }

        if (isSameOrigin && !headers.has(HEADER_NAME)) {
            headers.set(HEADER_NAME, fingerprint);
        }

        return originalFetch.call(window, input, { ...init, headers });
    };
}

/**
 * Initialize the device fingerprint system:
 * 1. Generate or retrieve cached fingerprint
 * 2. Install the global fetch interceptor
 *
 * Returns the fingerprint hash for component use.
 */
export async function initDeviceFingerprint(): Promise<string> {
    const fp = await getDeviceFingerprint();
    installFetchInterceptor(fp);
    return fp;
}
