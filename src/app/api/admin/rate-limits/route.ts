/**
 * Admin Rate Limits API — CRUD for Rate Limit Configuration
 *
 * Endpoints:
 *   GET  /api/admin/rate-limits — Get current rate limit config
 *   PUT  /api/admin/rate-limits — Update the entire rate limit config
 *   POST /api/admin/rate-limits — Add a new rule to the config
 *
 * Protected by requireAdminEmail middleware.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminEmail } from "@Library/adminApiMiddleware";
import dbConnect from "@Utils/dbConnect";
import { getSiteSettings, SiteSettings_Model } from "@Models/SiteSettings";
import {
    readRateLimitConfigFromCDN,
    writeRateLimitConfigToCDN
} from "@Utils/RateLimitCDN";
import {
    DEFAULT_RATE_LIMIT_CONFIG,
    type RateLimitConfig,
    type RateLimitRule
} from "@Library/RateLimit/RateLimitConfig";

// ── GET: Fetch current config ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const auth = await requireAdminEmail(req);
    if (auth.error) {
        return NextResponse.json(
            { Status: 0, StatusCode: auth.status, Message: auth.message },
            { status: auth.status }
        );
    }

    try {
        await dbConnect();

        // Try loading from GitHub CDN first
        let config = await readRateLimitConfigFromCDN();

        if (!config) {
            // Fall back to defaults
            config = { ...DEFAULT_RATE_LIMIT_CONFIG };
        }

        // Load site settings for sync metadata
        const settings = await getSiteSettings();
        const syncInfo = (settings as any).RateLimits || {};

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Data: {
                config,
                syncInfo: {
                    lastSyncedAt: syncInfo.lastSyncedAt || null,
                    lastSyncedBy: syncInfo.lastSyncedBy || null,
                    configRepoName: syncInfo.configRepoName || null
                }
            }
        });
    } catch (error: any) {
        console.error("[admin/rate-limits] GET error:", error);
        return NextResponse.json(
            {
                Status: 0,
                StatusCode: 500,
                Message: error.message || "Failed to load rate limit config"
            },
            { status: 500 }
        );
    }
}

// ── PUT: Update entire config ────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
    const auth = await requireAdminEmail(req);
    if (auth.error) {
        return NextResponse.json(
            { Status: 0, StatusCode: auth.status, Message: auth.message },
            { status: auth.status }
        );
    }

    try {
        const body = await req.json();
        const newConfig = body.config as RateLimitConfig;

        if (!newConfig || typeof newConfig.globalEnabled !== "boolean") {
            return NextResponse.json(
                { Status: 0, StatusCode: 400, Message: "Invalid config payload" },
                { status: 400 }
            );
        }

        // Validate rules have unique IDs
        const ruleIds = new Set<string>();
        for (const rule of newConfig.rules) {
            if (ruleIds.has(rule.id)) {
                return NextResponse.json(
                    {
                        Status: 0,
                        StatusCode: 400,
                        Message: `Duplicate rule ID: ${rule.id}`
                    },
                    { status: 400 }
                );
            }
            ruleIds.add(rule.id);
        }

        await dbConnect();

        const adminEmail = auth.session?.user?.email || "unknown";

        // Write to GitHub CDN
        const result = await writeRateLimitConfigToCDN(newConfig, adminEmail);

        // Update SiteSettings with sync metadata
        await SiteSettings_Model.updateOne(
            { ConfigID: "site_settings_singleton" },
            {
                $set: {
                    "RateLimits.globalEnabled": newConfig.globalEnabled,
                    "RateLimits.configRepoName": result.repo,
                    "RateLimits.configPath": "config/rate-limits.json",
                    "RateLimits.lastSyncedAt": new Date(),
                    "RateLimits.lastSyncedBy": adminEmail
                }
            }
        );

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Message: "Rate limit config updated successfully",
            Data: {
                repo: result.repo,
                sha: result.sha,
                rawUrl: result.rawUrl
            }
        });
    } catch (error: any) {
        console.error("[admin/rate-limits] PUT error:", error);
        return NextResponse.json(
            {
                Status: 0,
                StatusCode: 500,
                Message: error.message || "Failed to update rate limit config"
            },
            { status: 500 }
        );
    }
}

// ── POST: Add a new rule ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const auth = await requireAdminEmail(req);
    if (auth.error) {
        return NextResponse.json(
            { Status: 0, StatusCode: auth.status, Message: auth.message },
            { status: auth.status }
        );
    }

    try {
        const body = await req.json();
        const newRule = body.rule as RateLimitRule;

        if (!newRule || !newRule.id || !newRule.name) {
            return NextResponse.json(
                {
                    Status: 0,
                    StatusCode: 400,
                    Message: "Rule must have id and name"
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Load current config
        let config = await readRateLimitConfigFromCDN();
        if (!config) {
            config = { ...DEFAULT_RATE_LIMIT_CONFIG };
        }

        // Check for duplicate ID
        if (config.rules.some((r) => r.id === newRule.id)) {
            return NextResponse.json(
                {
                    Status: 0,
                    StatusCode: 409,
                    Message: `Rule with ID "${newRule.id}" already exists`
                },
                { status: 409 }
            );
        }

        // Add the new rule
        config.rules.push(newRule);

        const adminEmail = auth.session?.user?.email || "unknown";
        const result = await writeRateLimitConfigToCDN(config, adminEmail);

        return NextResponse.json({
            Status: 1,
            StatusCode: 201,
            Message: "Rule added successfully",
            Data: {
                rule: newRule,
                repo: result.repo,
                sha: result.sha
            }
        });
    } catch (error: any) {
        console.error("[admin/rate-limits] POST error:", error);
        return NextResponse.json(
            {
                Status: 0,
                StatusCode: 500,
                Message: error.message || "Failed to add rule"
            },
            { status: 500 }
        );
    }
}

// ── DELETE: Remove a rule by ID ──────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
    const auth = await requireAdminEmail(req);
    if (auth.error) {
        return NextResponse.json(
            { Status: 0, StatusCode: auth.status, Message: auth.message },
            { status: auth.status }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const ruleId = searchParams.get("ruleId");

        if (!ruleId) {
            return NextResponse.json(
                { Status: 0, StatusCode: 400, Message: "Missing ruleId parameter" },
                { status: 400 }
            );
        }

        if (ruleId === "default") {
            return NextResponse.json(
                {
                    Status: 0,
                    StatusCode: 400,
                    Message: "Cannot delete the default rule"
                },
                { status: 400 }
            );
        }

        await dbConnect();

        let config = await readRateLimitConfigFromCDN();
        if (!config) {
            return NextResponse.json(
                { Status: 0, StatusCode: 404, Message: "Config not found" },
                { status: 404 }
            );
        }

        const originalLength = config.rules.length;
        config.rules = config.rules.filter((r) => r.id !== ruleId);

        if (config.rules.length === originalLength) {
            return NextResponse.json(
                {
                    Status: 0,
                    StatusCode: 404,
                    Message: `Rule "${ruleId}" not found`
                },
                { status: 404 }
            );
        }

        const adminEmail = auth.session?.user?.email || "unknown";
        await writeRateLimitConfigToCDN(config, adminEmail);

        return NextResponse.json({
            Status: 1,
            StatusCode: 200,
            Message: `Rule "${ruleId}" deleted successfully`
        });
    } catch (error: any) {
        console.error("[admin/rate-limits] DELETE error:", error);
        return NextResponse.json(
            {
                Status: 0,
                StatusCode: 500,
                Message: error.message || "Failed to delete rule"
            },
            { status: 500 }
        );
    }
}
