import { parseMultipartResponse } from './MultipartParser';
import { getCSRFToken } from './getTrace';
import { RedirectProtocolExecuter } from './RedirectProtocolExecuter';

// Global state for CSRF token management (similar to Axios implementation)
let csrfToken: any = null;
let csrfRetryAttempted = false;
let CSRF_UnderProgress = false;

/**
 * Get CSRF token from localStorage or fetch new one
 */
async function getValidCSRFToken(): Promise<string> {
    if (!csrfToken) {
        if (CSRF_UnderProgress) {
            throw new Error('CSRF token retrieval in progress');
        }
        
        CSRF_UnderProgress = true;
        try {
            csrfToken = await getCSRFToken();
            if (csrfToken?.Status === 1) {
                localStorage.setItem('trace', JSON.stringify(csrfToken));
            } else {
                // Handle redirect protocols
                RedirectProtocolExecuter(csrfToken?.StatusCode);
                csrfToken = null;
                throw new Error('CSRF token retrieval failed');
            }
        } catch (error) {
            csrfToken = null;
            throw error;
        } finally {
            CSRF_UnderProgress = false;
        }
    }
    
    return csrfToken.data || '';
}

/**
 * Custom fetch function that handles CSRF tokens with automatic refresh
 * and can parse multipart responses
 */
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<{
    data: any;
    isMultipart: boolean;
    metadata?: any;
    files?: Array<{ name: string; filename: string; blob: Blob; index: number }>;
}> {
    // Try to get CSRF token
    let token = '';
    try {
        token = await getValidCSRFToken();
    } catch (error) {
        // If we can't get a token, try to get it from localStorage as fallback
        const trace = localStorage.getItem('trace');
        if (trace) {
            try {
                const parsedTrace = JSON.parse(trace);
                token = parsedTrace.data || '';
            } catch (e) {
                console.error('Failed to parse CSRF token from localStorage:', e);
            }
        }
    }

    // Prepare headers
    const headers = new Headers(options.headers);
    if (token) {
        headers.set('x-csrf', token);
    }

    // Make the request
    let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Similar to withCredentials: true in Axios
    });    // Handle token expiration and retry (similar to Axios response interceptor)
    if (!response.ok) {
        try {
            const errorData = await response.json();
            
            // Check for invalid authorization (expired token)
            if (errorData?.StatusCode === "INVALID_AUTHORIZATION") {
                console.log('CSRF token expired, attempting to refresh...');
                localStorage.removeItem('trace');
                csrfToken = null;

                // Retry once with new token
                if (!csrfRetryAttempted) {
                    csrfRetryAttempted = true;
                    
                    try {
                        console.log('Fetching new CSRF token...');
                        const newToken = await getValidCSRFToken();
                        console.log('New CSRF token obtained, retrying request...');
                        
                        // Update headers with new token
                        const newHeaders = new Headers(options.headers);
                        newHeaders.set('x-csrf', newToken);
                        
                        // Retry the request
                        response = await fetch(url, {
                            ...options,
                            headers: newHeaders,
                            credentials: 'include',
                        });
                        
                        // Reset retry flag on successful retry
                        if (response.ok) {
                            console.log('Request successful after token refresh');
                            csrfRetryAttempted = false;
                        }
                    } catch (retryError) {
                        console.error('Failed to refresh CSRF token:', retryError);
                        csrfRetryAttempted = false;
                        throw retryError;
                    }
                } else {
                    console.log('CSRF token refresh already attempted, not retrying again');
                    // Reset retry flag for future requests
                    csrfRetryAttempted = false;
                }
            }
            
            // Handle other redirect protocols
            if (errorData?.StatusCode) {
                RedirectProtocolExecuter(errorData.StatusCode);
            }
            
            // If still not ok after retry, throw error
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${errorData?.message || 'Unknown error'}`);
            }
        } catch (parseError) {
            // If we can't parse the error response, throw original error
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
    }

    // Reset retry flag on successful request
    csrfRetryAttempted = false;

    // Check if response is multipart
    const contentType = response.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

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
    localStorage.removeItem('trace');
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
