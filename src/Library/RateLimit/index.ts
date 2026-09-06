/**
 * Rate Limit Library — Barrel Export
 *
 * Re-exports all public types, functions, and utilities from the
 * rate limiting system for clean imports:
 *
 *   import { checkRateLimit, loadRateLimitConfig } from "@Library/RateLimit";
 */

// Config schema, loader, and rule matching
export {
    type RateLimitRule,
    type RateLimitConfig,
    DEFAULT_RATE_LIMIT_CONFIG,
    loadRateLimitConfig,
    setRateLimitConfigCache,
    clearRateLimitConfigCache,
    resolveRule
} from "./RateLimitConfig";

// Core engine
export {
    type RateLimitIdentity,
    type RateLimitResult,
    extractIdentity,
    checkRateLimit,
    applyRateLimitHeaders,
    getStoreStats
} from "./RateLimitEngine";
