/**
 * High-Performance Rate Limiter integrated with ControllerResponseMap
 * Uses BufferRateLimitStore for memory efficiency
 */

import { NextRequest, NextResponse } from "next/server";
import { BufferRateLimitStore, RateLimitInfo, StoreOptions } from "./store";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import { Controller_Response } from "@Types";
import { getClientIp } from "@Library/request-ip";

export interface RateLimitConfig extends StoreOptions {
    keyGenerator?: (request: NextRequest) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    message?: string;
    statusCode?: string | number;
    headers?: boolean;
    onLimitReached?: (key: string, info: RateLimitInfo) => void;
    useControllerResponse?: boolean;
}

export interface RateLimitResult {
    success: boolean;
    info: RateLimitInfo;
    response?: NextResponse;
}

export class RateLimiter {
    private store: BufferRateLimitStore;
    private config: Required<RateLimitConfig>;

    constructor(config: RateLimitConfig) {
        this.config = {
            ...config,
            cleanupInterval: 60 * 1000,
            keyGenerator: this.defaultKeyGenerator,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            message: "Too many requests, please try again later.",
            statusCode: "RATE_LIMIT_EXCEEDED",
            headers: true,
            onLimitReached: () => {},
            useControllerResponse: true
        };

        this.store = new BufferRateLimitStore({
            windowMs: this.config.windowMs,
            maxRequests: this.config.maxRequests,
            cleanupInterval: this.config.cleanupInterval
        });
    }

    /**
     * Check and consume rate limit for a request
     */
    public async limit(request: NextRequest): Promise<RateLimitResult> {
        const key = this.config.keyGenerator(request);
        const info = this.store.increment(key);

        if (info.totalHits > this.config.maxRequests) {
            this.config.onLimitReached(key, info);

            const response = this.createErrorResponse(info);
            return {
                success: false,
                info,
                response
            };
        }

        return {
            success: true,
            info
        };
    }

    /**
     * Check rate limit without consuming
     */
    public check(request: NextRequest): RateLimitInfo | null {
        const key = this.config.keyGenerator(request);
        return this.store.get(key);
    }

    /**
     * Reset rate limit for a specific key
     */
    public reset(request: NextRequest): void {
        const key = this.config.keyGenerator(request);
        this.store.reset(key);
    }

    /**
     * Reset all rate limits
     */
    public resetAll(): void {
        this.store.resetAll();
    }

    /**
     * Get store statistics
     */
    public getStats() {
        return this.store.getStats();
    }

    /**
     * Shutdown the rate limiter
     */
    public shutdown(): void {
        this.store.shutdown();
    }

    private defaultKeyGenerator(request: NextRequest): string {
        return `${getClientIp(request)}:${request.nextUrl.pathname}`;
    }

    private createErrorResponse(info: RateLimitInfo): NextResponse {
        if (this.config.useControllerResponse) {
            // Use your custom ControllerResponseMap
            const controllerResponse: Controller_Response = {
                Status: 0,
                Message: this.config.message,
                StatusCode: this.config.statusCode,
                StatusNumber: 429,
                StatusText: "Too Many Requests",
                Data: {
                    rateLimitInfo: {
                        limit: this.config.maxRequests,
                        remaining: info.remaining,
                        resetTime: info.resetTime,
                        retryAfter: Math.ceil(
                            (info.resetTime - Date.now()) / 1000
                        )
                    }
                }
            };

            // Create the response using your system
            const response = ControllerResponseMap(controllerResponse);

            // Add rate limit headers if enabled
            if (this.config.headers) {
                response.headers.set(
                    "X-RateLimit-Limit",
                    this.config.maxRequests.toString()
                );
                response.headers.set(
                    "X-RateLimit-Remaining",
                    info.remaining.toString()
                );
                response.headers.set(
                    "X-RateLimit-Reset",
                    Math.ceil(info.resetTime / 1000).toString()
                );
                response.headers.set(
                    "Retry-After",
                    Math.ceil((info.resetTime - Date.now()) / 1000).toString()
                );
            }

            return response;
        } else {
            // Fallback to standard NextResponse
            const body = {
                Status: 0,
                Message: this.config.message,
                StatusCode: this.config.statusCode,
                retryAfter: Math.ceil((info.resetTime - Date.now()) / 1000)
            };

            const headers: Record<string, string> = {};

            if (this.config.headers) {
                headers["X-RateLimit-Limit"] =
                    this.config.maxRequests.toString();
                headers["X-RateLimit-Remaining"] = info.remaining.toString();
                headers["X-RateLimit-Reset"] = Math.ceil(
                    info.resetTime / 1000
                ).toString();
                headers["Retry-After"] = Math.ceil(
                    (info.resetTime - Date.now()) / 1000
                ).toString();
            }

            return NextResponse.json(body, {
                status: 429,
                headers
            });
        }
    }
}

// Pre-configured limiters using your response system
export const defaultLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    statusCode: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests from this IP, please try again later.",
    useControllerResponse: true
});

export const strictLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    statusCode: "RATE_LIMIT_STRICT_EXCEEDED",
    message:
        "Rate limit exceeded for sensitive endpoint. Please wait before trying again.",
    useControllerResponse: true
});

export const publicLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    statusCode: "RATE_LIMIT_PUBLIC_EXCEEDED",
    message: "Public API rate limit exceeded.",
    useControllerResponse: true
});

export const contactLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3, // 3 requests per 15 minutes
    statusCode: "CONTACT_RATE_LIMIT_EXCEEDED",
    message:
        "Too many contact form submissions. Please wait 15 minutes before trying again.",
    useControllerResponse: true
});

// Helper function for middleware usage (updated for your system)
export async function rateLimitMiddleware(
    request: NextRequest,
    limiter: RateLimiter = defaultLimiter
): Promise<NextResponse | null> {
    const result = await limiter.limit(request);
    return result.success ? null : result.response!;
}

// Helper for getting rate limit info without consuming
export function getRateLimitInfo(
    request: NextRequest,
    limiter: RateLimiter = defaultLimiter
): Controller_Response {
    const info = limiter.check(request);

    return {
        Status: 1,
        Message: "Rate limit information retrieved successfully",
        StatusCode: "RATE_LIMIT_INFO_SUCCESS",
        StatusNumber: 200,
        Data: {
            rateLimitInfo: info || {
                totalHits: 0,
                remaining: limiter["config"].maxRequests,
                resetTime: Date.now() + limiter["config"].windowMs
            }
        }
    };
}
