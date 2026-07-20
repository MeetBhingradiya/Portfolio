/**
 * Discord Webhook Logger
 *
 * Sends rich embed messages to Discord webhooks for activity logging.
 * Similar to Discord server audit logs — tracks security events,
 * admin CRUD operations, CDN mutations, and permission changes.
 *
 * Supports separate or combined webhooks per category:
 *   DISCORD_WEBHOOK_URL       — fallback for all categories
 *   DISCORD_WEBHOOK_SECURITY  — rate limits, CSRF, auth failures
 *   DISCORD_WEBHOOK_ADMIN     — CRUD operations, role/permission changes
 *   DISCORD_WEBHOOK_CDN       — GitHub CDN upload/delete/restore
 *
 * All calls are fire-and-forget — webhook failures never break the app.
 */

import { UserAgent } from "@Library/UserAgent";
import { getClientIp } from "@Library/IP";

// ── Types ────────────────────────────────────────────────────────────────────

export type LogCategory = "security" | "admin" | "cdn" | "system" | "error";

export type LogSeverity = "info" | "warning" | "error" | "critical";

export interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface DiscordEmbed {
    title: string;
    description?: string;
    color?: number;
    fields?: DiscordEmbedField[];
    footer?: { text: string; icon_url?: string };
    timestamp?: string;
    thumbnail?: { url: string };
    author?: { name: string; icon_url?: string; url?: string };
}

export interface DeviceInfo {
    userAgent: string;
    browser: string;
    browserVersion: string;
    os: string;
    platform: string;
    deviceType: "Desktop" | "Mobile" | "Tablet" | "Bot" | "Unknown";
    ip: string | null;
    fingerprint: string | null;
}

// ── Color Constants ──────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<LogSeverity, number> = {
    info: 0x2ecc71,     // Green
    warning: 0xf39c12,  // Yellow/Amber
    error: 0xe74c3c,    // Red
    critical: 0x8e44ad   // Purple
};

const CATEGORY_COLORS: Record<LogCategory, number> = {
    security: 0xe74c3c,  // Red
    admin: 0x3498db,     // Blue
    cdn: 0x9b59b6,       // Purple
    system: 0x1abc9c,    // Teal
    error: 0xe74c3c      // Red
};

const CATEGORY_EMOJI: Record<LogCategory, string> = {
    security: "🛡️",
    admin: "⚙️",
    cdn: "📦",
    system: "🔧",
    error: "❌"
};

// ── Webhook URL Resolution ───────────────────────────────────────────────────

const WEBHOOK_ENV_KEYS: Record<LogCategory, string> = {
    security: "DISCORD_WEBHOOK_SECURITY",
    admin: "DISCORD_WEBHOOK_ADMIN",
    cdn: "DISCORD_WEBHOOK_CDN",
    system: "DISCORD_WEBHOOK_URL",
    error: "DISCORD_WEBHOOK_URL"
};

function getWebhookUrl(category: LogCategory): string | null {
    // Try category-specific webhook first, fall back to combined
    const specific = process.env[WEBHOOK_ENV_KEYS[category]]?.trim();
    if (specific) return specific;

    const fallback = process.env.DISCORD_WEBHOOK_URL?.trim();
    return fallback || null;
}

// ── Rate Limit Queue (respect Discord 429s) ──────────────────────────────────

let _webhookQueue: Promise<void> = Promise.resolve();
const MIN_DELAY_MS = 250; // Minimum delay between webhook calls

function enqueueWebhookCall(fn: () => Promise<void>): void {
    _webhookQueue = _webhookQueue
        .then(() => fn())
        .then(() => new Promise<void>((resolve) => setTimeout(resolve, MIN_DELAY_MS)))
        .catch(() => {
            // Swallow errors — webhook failures must never break the app
        });
}

// ── Device Info Extraction ───────────────────────────────────────────────────

/**
 * Extract rich device info from request headers.
 * Works with any object that has a `headers.get()` method (NextRequest, Headers).
 */
export function extractDeviceInfo(headers: { get(name: string): string | null }): DeviceInfo {
    const uaString = headers.get("user-agent") || "";
    const ua = new UserAgent().parse(uaString);

    // Determine device type
    let deviceType: DeviceInfo["deviceType"] = "Unknown";
    if (ua.isBot) deviceType = "Bot";
    else if (ua.isTablet) deviceType = "Tablet";
    else if (ua.isMobile) deviceType = "Mobile";
    else if (ua.isDesktop) deviceType = "Desktop";

    // Extract IP
    const ipRaw = getClientIp({ headers });
    const ip = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw ?? null;

    // Extract fingerprint
    const fingerprint = headers.get("x-device-fp") || null;

    return {
        userAgent: uaString.slice(0, 256), // Truncate to avoid embed limits
        browser: ua.browser || "Unknown",
        browserVersion: ua.version || "Unknown",
        os: ua.os || "Unknown",
        platform: ua.platform || "Unknown",
        deviceType,
        ip,
        fingerprint
    };
}

/**
 * Build Discord embed fields from DeviceInfo.
 */
function deviceInfoFields(device: DeviceInfo): DiscordEmbedField[] {
    const fields: DiscordEmbedField[] = [];

    if (device.browser !== "Unknown" || device.browserVersion !== "Unknown") {
        fields.push({ name: "🌐 Browser", value: `${device.browser} ${device.browserVersion}`, inline: true });
    }
    if (device.os !== "Unknown") {
        fields.push({ name: "💻 OS", value: device.os, inline: true });
    }
    if (device.platform !== "Unknown") {
        fields.push({ name: "📱 Platform", value: device.platform, inline: true });
    }
    fields.push({ name: "📟 Device Type", value: device.deviceType, inline: true });

    if (device.ip) {
        fields.push({ name: "🔗 IP Address", value: `\`${device.ip}\``, inline: true });
    }
    if (device.fingerprint) {
        fields.push({ name: "🔑 Fingerprint", value: `\`${device.fingerprint.slice(0, 16)}…\``, inline: true });
    }

    return fields;
}

// ── Core Send Function ───────────────────────────────────────────────────────

/**
 * Send a Discord webhook embed. Fire-and-forget.
 * If the webhook URL is not configured, silently returns.
 */
async function sendWebhook(url: string, embeds: DiscordEmbed[]): Promise<void> {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds })
        });

        // Handle Discord rate limit
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            const retryMs = (data as any)?.retry_after ? (data as any).retry_after * 1000 : 2000;
            await new Promise<void>((resolve) => setTimeout(resolve, retryMs));
            // Retry once
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ embeds })
            });
        }
    } catch {
        // Silently swallow — webhook issues must never affect the application
    }
}

/**
 * Send a log embed to the appropriate Discord webhook.
 */
export function sendLog(category: LogCategory, embed: DiscordEmbed): void {
    const url = getWebhookUrl(category);
    if (!url) return;

    // Always add timestamp
    if (!embed.timestamp) {
        embed.timestamp = new Date().toISOString();
    }

    // Add category footer if not present
    if (!embed.footer) {
        embed.footer = {
            text: `${CATEGORY_EMOJI[category]} ${category.toUpperCase()} • ${process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"}`
        };
    }

    enqueueWebhookCall(() => sendWebhook(url, [embed]));
}

// ── High-Level Helper: Security Logs ─────────────────────────────────────────

export type SecurityEvent =
    | "blocked_method"
    | "csrf_blocked"
    | "rate_limited"
    | "maintenance_blocked"
    | "admin_bypass"
    | "unauthenticated"
    | "permission_denied"
    | "admin_forbidden";

const SECURITY_EVENT_CONFIG: Record<SecurityEvent, { title: string; severity: LogSeverity; emoji: string }> = {
    blocked_method: { title: "Blocked HTTP Method", severity: "warning", emoji: "🚫" },
    csrf_blocked: { title: "CSRF Origin Rejected", severity: "error", emoji: "⛔" },
    rate_limited: { title: "Rate Limit Exceeded", severity: "warning", emoji: "⏱️" },
    maintenance_blocked: { title: "Maintenance Mode Block", severity: "info", emoji: "🔧" },
    admin_bypass: { title: "Admin Bypass Detected", severity: "info", emoji: "🔓" },
    unauthenticated: { title: "Unauthenticated Access", severity: "warning", emoji: "🔒" },
    permission_denied: { title: "Permission Denied", severity: "error", emoji: "🚷" },
    admin_forbidden: { title: "Admin Access Forbidden", severity: "error", emoji: "⛔" }
};

export function logSecurity(
    event: SecurityEvent,
    details: {
        path?: string;
        method?: string;
        device?: DeviceInfo;
        origin?: string;
        message?: string;
        // Rate limit specific
        ruleId?: string;
        ruleName?: string;
        remaining?: number;
        retryAfter?: number;
        triggeredBy?: string;
        // Permission specific
        permission?: string;
        userEmail?: string;
    }
): void {
    const config = SECURITY_EVENT_CONFIG[event];
    const fields: DiscordEmbedField[] = [];

    if (details.path) {
        fields.push({ name: "📍 Path", value: `\`${details.path}\``, inline: true });
    }
    if (details.method) {
        fields.push({ name: "📝 Method", value: `\`${details.method}\``, inline: true });
    }
    if (details.origin) {
        fields.push({ name: "🌍 Origin", value: `\`${details.origin}\``, inline: true });
    }
    if (details.userEmail) {
        fields.push({ name: "👤 User", value: details.userEmail, inline: true });
    }
    if (details.permission) {
        fields.push({ name: "🔐 Permission", value: `\`${details.permission}\``, inline: true });
    }

    // Rate limit specific fields
    if (details.ruleName) {
        fields.push({ name: "📏 Rule", value: details.ruleName, inline: true });
    }
    if (details.remaining !== undefined) {
        fields.push({ name: "📊 Remaining", value: String(details.remaining), inline: true });
    }
    if (details.retryAfter !== undefined) {
        fields.push({ name: "⏳ Retry After", value: `${details.retryAfter}s`, inline: true });
    }
    if (details.triggeredBy) {
        fields.push({ name: "🎯 Triggered By", value: details.triggeredBy, inline: true });
    }

    // Add device info fields
    if (details.device) {
        fields.push(...deviceInfoFields(details.device));
    }

    sendLog("security", {
        title: `${config.emoji} ${config.title}`,
        description: details.message || undefined,
        color: SEVERITY_COLORS[config.severity],
        fields
    });
}

// ── High-Level Helper: Admin Action Logs ─────────────────────────────────────

export type AdminAction = "create" | "update" | "delete" | "bulk_delete" | "permission_change" | "role_change";

const ADMIN_ACTION_CONFIG: Record<AdminAction, { emoji: string; verb: string; severity: LogSeverity }> = {
    create: { emoji: "✅", verb: "Created", severity: "info" },
    update: { emoji: "📝", verb: "Updated", severity: "info" },
    delete: { emoji: "🗑️", verb: "Deleted", severity: "warning" },
    bulk_delete: { emoji: "🗑️", verb: "Bulk Deleted", severity: "warning" },
    permission_change: { emoji: "🔐", verb: "Permission Changed", severity: "warning" },
    role_change: { emoji: "👔", verb: "Role Changed", severity: "warning" }
};

export function logAdminAction(
    action: AdminAction,
    details: {
        model: string;
        id?: string;
        summary?: string;
        changedFields?: string[];
        actor?: string;
    }
): void {
    const config = ADMIN_ACTION_CONFIG[action];
    const fields: DiscordEmbedField[] = [];

    fields.push({ name: "📂 Model", value: `\`${details.model}\``, inline: true });

    if (details.id) {
        fields.push({ name: "🆔 ID", value: `\`${details.id}\``, inline: true });
    }
    if (details.actor) {
        fields.push({ name: "👤 Actor", value: details.actor, inline: true });
    }
    if (details.changedFields?.length) {
        fields.push({
            name: "📋 Changed Fields",
            value: details.changedFields.map((f) => `\`${f}\``).join(", "),
            inline: false
        });
    }

    sendLog("admin", {
        title: `${config.emoji} ${config.verb} — ${details.model}`,
        description: details.summary || undefined,
        color: SEVERITY_COLORS[config.severity],
        fields
    });
}

// ── High-Level Helper: CDN Logs ──────────────────────────────────────────────

export type CDNAction = "upload" | "delete" | "restore" | "repo_created" | "history_compacted";

const CDN_ACTION_CONFIG: Record<CDNAction, { emoji: string; verb: string; severity: LogSeverity }> = {
    upload: { emoji: "📤", verb: "File Uploaded", severity: "info" },
    delete: { emoji: "🗑️", verb: "File Deleted", severity: "warning" },
    restore: { emoji: "🔄", verb: "File Restored", severity: "info" },
    repo_created: { emoji: "📁", verb: "New Repo Created", severity: "info" },
    history_compacted: { emoji: "🗜️", verb: "History Compacted", severity: "info" }
};

export function logCDNAction(
    action: CDNAction,
    details: {
        repo?: string;
        path?: string;
        sha?: string;
        size?: number;
        fromCommit?: string;
        reason?: string;
    }
): void {
    const config = CDN_ACTION_CONFIG[action];
    const fields: DiscordEmbedField[] = [];

    if (details.repo) {
        fields.push({ name: "📦 Repo", value: `\`${details.repo}\``, inline: true });
    }
    if (details.path) {
        fields.push({ name: "📄 Path", value: `\`${details.path}\``, inline: true });
    }
    if (details.sha) {
        fields.push({ name: "🔗 SHA", value: `\`${details.sha.slice(0, 12)}\``, inline: true });
    }
    if (details.size !== undefined) {
        const sizeStr = details.size > 1024 * 1024
            ? `${(details.size / (1024 * 1024)).toFixed(2)} MB`
            : `${(details.size / 1024).toFixed(1)} KB`;
        fields.push({ name: "📏 Size", value: sizeStr, inline: true });
    }
    if (details.fromCommit) {
        fields.push({ name: "⏪ From Commit", value: `\`${details.fromCommit.slice(0, 7)}\``, inline: true });
    }
    if (details.reason) {
        fields.push({ name: "💡 Reason", value: details.reason, inline: false });
    }

    sendLog("cdn", {
        title: `${config.emoji} ${config.verb}`,
        color: SEVERITY_COLORS[config.severity],
        fields
    });
}

// ── High-Level Helper: Error Logs ────────────────────────────────────────────

export function logError(
    source: string,
    details: {
        operation?: string;
        error: string;
        repo?: string;
        path?: string;
        statusCode?: number;
    }
): void {
    const fields: DiscordEmbedField[] = [];

    fields.push({ name: "📍 Source", value: `\`${source}\``, inline: true });

    if (details.operation) {
        fields.push({ name: "⚡ Operation", value: details.operation, inline: true });
    }
    if (details.repo) {
        fields.push({ name: "📦 Repo", value: `\`${details.repo}\``, inline: true });
    }
    if (details.path) {
        fields.push({ name: "📄 Path", value: `\`${details.path}\``, inline: true });
    }
    if (details.statusCode) {
        fields.push({ name: "📟 Status", value: String(details.statusCode), inline: true });
    }

    sendLog("error", {
        title: `❌ Error — ${source}`,
        description: `\`\`\`\n${details.error.slice(0, 1024)}\n\`\`\``,
        color: SEVERITY_COLORS.error,
        fields
    });
}
