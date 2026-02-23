import { parseMultipartResponse } from "./MultipartParser";
import { getCSRFToken } from "./getTrace";
import { RedirectProtocolExecuter } from "./RedirectProtocolExecuter";

// Global state for CSRF token management
let csrfToken: any = null;
let csrfRetryAttempted = false;
let CSRF_UnderProgress = false;

/**
 * Get CSRF token from localStorage or fetch new one
 */
async function getValidCSRFToken(): Promise<string> {
    if (!csrfToken) {
        if (CSRF_UnderProgress) {
            throw new Error("CSRF token retrieval in progress");
        }

        CSRF_UnderProgress = true;
        try {
            console.log("[getValidCSRFToken] Fetching new CSRF token...");
            csrfToken = await getCSRFToken();
            console.log("[getValidCSRFToken] Received token response:", csrfToken);
            
            if (csrfToken?.Status === 1) {
                localStorage.setItem("trace", JSON.stringify(csrfToken));
                console.log("[getValidCSRFToken] Token stored in localStorage");
            } else {
                console.error("[getValidCSRFToken] Invalid token response:", csrfToken);
                // Handle redirect protocols
                RedirectProtocolExecuter(csrfToken?.StatusCode);
                csrfToken = null;
                throw new Error("CSRF token retrieval failed");
            }
        } catch (error) {
            console.error("[getValidCSRFToken] Error fetching token:", error);
            csrfToken = null;
            throw error;
        } finally {
            CSRF_UnderProgress = false;
        }
    }

    const token = csrfToken.Data?.token || "";
    console.log("[getValidCSRFToken] Returning token:", token ? "✓" : "✗");
    return token;
}

/**
 * Custom fetch function that handles CSRF tokens with automatic refresh,
 * rate limiting, and can parse multipart responses
 */
export async function fetchWithCSRF(
    url: string,
    options: RequestInit = {}
): Promise<{
    data: any;
    isMultipart: boolean;
    metadata?: any;
    files?: Array<{
        name: string;
        filename: string;
        blob: Blob;
        index: number;
    }>;
}> {
    // Try to get CSRF token
    let token = "";
    try {
        console.log("[fetchWithCSRF] Attempting to get CSRF token...");
        token = await getValidCSRFToken();
        console.log("[fetchWithCSRF] Successfully obtained CSRF token");
    } catch (error) {
        console.log("[fetchWithCSRF] Failed to get new CSRF token, trying localStorage fallback...");
        // If we can't get a token, try to get it from localStorage as fallback
        const trace = localStorage.getItem("trace");
        if (trace) {
            try {
                const parsedTrace = JSON.parse(trace);
                if (parsedTrace?.Data?.token) {
                    token = parsedTrace.Data.token;
                    // Also restore the token to memory
                    csrfToken = parsedTrace;
                    console.log("[fetchWithCSRF] Using token from localStorage fallback");
                } else {
                    console.error("[fetchWithCSRF] Invalid trace structure in localStorage:", parsedTrace);
                }
            } catch (e) {
                console.error(
                    "[fetchWithCSRF] Failed to parse CSRF token from localStorage:",
                    e
                );
            }
        } else {
            console.error("[fetchWithCSRF] No trace found in localStorage");
        }
    }

    // If no token available, try to get one before making the request
    if (!token) {
        console.log("[fetchWithCSRF] No CSRF token available, fetching new token...");
        try {
            token = await getValidCSRFToken();
            if (token) {
                console.log("[fetchWithCSRF] Successfully obtained new CSRF token");
            }
        } catch (tokenError) {
            console.error("[fetchWithCSRF] Failed to obtain CSRF token:", tokenError);
            // Continue without token - let the server handle the error
        }
    }

    // Prepare headers
    const headers = new Headers(options.headers);
    if (token) {
        headers.set("x-csrf", token);
        console.log("[fetchWithCSRF] Added CSRF token to headers");
    } else {
        console.warn("[fetchWithCSRF] No CSRF token available - request will likely fail");
    }

    // Make the request
    let response = await fetch(url, {
        ...options,
        headers,
        credentials: "include"
    });

    // Handle different response scenarios
    if (!response.ok) {
        // Handle rate limiting first (HTTP 429)
        if (response.status === 429) {
            try {
                const rateLimitData = await response.json();
                console.warn("Rate limit exceeded:", rateLimitData);

                // Extract retry-after information if available
                const retryAfter =
                    response.headers.get("retry-after") ||
                    rateLimitData?.Data?.rateLimitInfo?.retryAfter;

                if (retryAfter) {
                    console.warn(
                        `Rate limited. Retry after: ${retryAfter} seconds`
                    );
                }

                // Don't retry rate limited requests automatically
                throw new Error(
                    `Rate limit exceeded. ${rateLimitData?.Message || "Please try again later."}`
                );
            } catch (parseError) {
                throw new Error(`Rate limit exceeded. HTTP ${response.status}`);
            }
        }

        // Handle other errors
        try {
            const errorData = await response.json();

            // Check for invalid authorization (expired CSRF token)
            if (errorData?.StatusCode === "INVALID_AUTHORIZATION") {
                console.log("[fetchWithCSRF] CSRF token expired, attempting to refresh...");
                localStorage.removeItem("trace");
                csrfToken = null;

                // Retry once with new token
                if (!csrfRetryAttempted) {
                    csrfRetryAttempted = true;

                    try {
                        console.log("[fetchWithCSRF] Fetching new CSRF token...");
                        const newToken = await getValidCSRFToken();
                        console.log("[fetchWithCSRF] New CSRF token obtained, retrying request...");

                        // Update headers with new token
                        const newHeaders = new Headers(options.headers);
                        newHeaders.set("x-csrf", newToken);

                        // Retry the request with new token
                        response = await fetch(url, {
                            ...options,
                            headers: newHeaders,
                            credentials: "include"
                        });

                        console.log("[fetchWithCSRF] Retry response status:", response.status);

                        // If retry fails, parse error again
                        if (!response.ok) {
                            const retryErrorData = await response.json();
                            console.error("[fetchWithCSRF] Retry failed:", retryErrorData);
                            
                            // Handle redirect protocols for retry failure
                            if (retryErrorData?.StatusCode && response.status !== 429) {
                                RedirectProtocolExecuter(retryErrorData.StatusCode);
                            }
                            
                            const retryMessage = retryErrorData?.Message || `HTTP error! status: ${response.status}`;
                            throw new Error(retryMessage);
                        }

                        console.log("[fetchWithCSRF] CSRF token refresh and retry successful");
                    } catch (retryError) {
                        console.error("[fetchWithCSRF] Failed to refresh CSRF token:", retryError);
                        csrfRetryAttempted = false;
                        throw retryError;
                    }
                } else {
                    console.log(
                        "[fetchWithCSRF] CSRF token refresh already attempted, not retrying again"
                    );
                    csrfRetryAttempted = false;
                }
            }

            // Handle other redirect protocols (but not rate limiting)
            if (errorData?.StatusCode && response.status !== 429) {
                RedirectProtocolExecuter(errorData.StatusCode);
            }

            // If still not ok after retry, throw error with proper message
            if (!response.ok) {
                const message =
                    errorData?.Message ||
                    `HTTP error! status: ${response.status}`;
                throw new Error(message);
            }
        } catch (parseError) {
            // If we can't parse the error response, throw original error
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(
                        "Rate limit exceeded. Please try again later."
                    );
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
    }

    // Reset retry flag on successful request
    csrfRetryAttempted = false;

    // Check if response is multipart
    const contentType = response.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    if (isMultipart) {
        // Parse multipart response
        const { metadata, files } = await parseMultipartResponse(response);
        return {
            data: metadata,
            isMultipart: true,
            metadata,
            files
        };
    } else {
        // Parse as JSON
        const data = await response.json();
        return {
            data,
            isMultipart: false
        };
    }
}

/**
 * Reset CSRF token state (useful for logout or manual token refresh)
 */
export function resetCSRFToken(): void {
    csrfToken = null;
    csrfRetryAttempted = false;
    CSRF_UnderProgress = false;
    localStorage.removeItem("trace");
}

/**
 * Check if we have a valid CSRF token in memory
 */
export function hasValidCSRFToken(): boolean {
    return csrfToken !== null && csrfToken?.Status === 1;
}

/**
 * Get current CSRF token without making a request (useful for debugging)
 */
export function getCurrentCSRFToken(): any {
    return csrfToken;
}

/**
 * Helper to check if error is rate limit related
 */
export function isRateLimitError(error: any): boolean {
    return (
        error?.response?.status === 429 ||
        error?.message?.includes("Rate limit exceeded") ||
        error?.response?.data?.StatusCode?.includes("RATE_LIMIT")
    );
}

/**
 * Helper to extract rate limit info from error
 */
export function getRateLimitInfo(error: any): {
    retryAfter?: number;
    limit?: number;
    remaining?: number;
    resetTime?: number;
} | null {
    const response = error?.response;
    if (!response || response.status !== 429) return null;

    const data = response.data;
    const headers = response.headers;

    return {
        retryAfter: parseInt(
            headers?.["retry-after"] ||
            data?.Data?.rateLimitInfo?.retryAfter ||
            "0"
        ),
        limit: parseInt(
            headers?.["x-ratelimit-limit"] ||
            data?.Data?.rateLimitInfo?.limit ||
            "0"
        ),
        remaining: parseInt(
            headers?.["x-ratelimit-remaining"] ||
            data?.Data?.rateLimitInfo?.remaining ||
            "0"
        ),
        resetTime: parseInt(
            headers?.["x-ratelimit-reset"] ||
            data?.Data?.rateLimitInfo?.resetTime ||
            "0"
        )
    };
}
