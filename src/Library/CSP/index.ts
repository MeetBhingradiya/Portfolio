/**
 * Content Security Policy (CSP) Utilities
 * ---------------------------------------
 * Provides types, configuration interfaces, and generator functions for building Content Security Policy headers
 * in a type-safe, flexible, and secure manner. Supports conditional options per directive, domain validation,
 * hash/nonce support, sandbox/report-to support, and sensible secure defaults.
 *
 * @file CSP.ts
 * @author Meet Bhingradiya
 * @copyright Copyright (c) Meet Bhingradiya
 * @license MIT
 */

/**
 * CSP validation and generation errors.
 * Used for reporting invalid or conflicting CSP options.
 */
class CSPError extends Error {
    /**
     * @param message Error message
     * @param directive The CSP directive where the error occurred
     * @param value The value that caused the error
     */
    constructor(
        message: string,
        public directive?: string,
        public value?: any
    ) {
        super(message);
        this.name = "CSPError";
    }
}

/**
 * Enum of all supported CSP directives.
 * Each value corresponds to a valid CSP directive name.
 *
 * Hover over any property in your IDE to see a description of its purpose.
 */
enum CSPDirectiveOptions {
    /** The default-src directive serves as a fallback for the other CSP fetch directives. */
    DefaultSrc = "default-src",
    /** The script-src directive specifies valid sources for JavaScript. */
    ScriptSrc = "script-src",
    /** The style-src directive specifies valid sources for stylesheets. */
    StyleSrc = "style-src",
    /** The img-src directive specifies valid sources of images and favicons. */
    ImgSrc = "img-src",
    /** The font-src directive specifies valid sources for fonts loaded using @font-face. */
    FontSrc = "font-src",
    /** The connect-src directive specifies valid sources for fetch, XMLHttpRequest, WebSocket, and EventSource. */
    ConnectSrc = "connect-src",
    /** The object-src directive specifies valid sources for the <object>, <embed>, and <applet> elements. */
    ObjectSrc = "object-src",
    /** The media-src directive specifies valid sources for loading media using the <audio> and <video> elements. */
    MediaSrc = "media-src",
    /** The frame-src directive specifies valid sources for nested browsing contexts loading using elements such as <frame> and <iframe>. */
    FrameSrc = "frame-src",
    /** The sandbox directive enables a sandbox for the requested resource similar to the <iframe> sandbox attribute. */
    Sandbox = "sandbox",
    /** The report-uri directive specifies a URL to which the user agent sends reports about policy violation. */
    ReportUri = "report-uri",
    /** The child-src directive specifies valid sources for web workers and nested browsing contexts loaded using elements such as <frame> and <iframe>. */
    ChildSrc = "child-src",
    /** The form-action directive specifies valid endpoints for submission from <form> tags. */
    FormAction = "form-action",
    /** The frame-ancestors directive specifies valid parents that may embed a page using elements such as <frame> and <iframe>. */
    FrameAncestors = "frame-ancestors",
    /** The plugin-types directive restricts the set of plugins that can be invoked by the protected resource by limiting the types of resources that can be embedded. */
    PluginTypes = "plugin-types",
    /** The base-uri directive restricts the URLs that can appear in a page's <base> element. */
    BaseUri = "base-uri",
    /** The report-to directive specifies which reporting group to use. */
    ReportTo = "report-to",
    /** The worker-src directive specifies the location of a worker-src. */
    WorkerSrc = "worker-src",
    /** The manifest-src directive specifies which manifest can be applied to the resource. */
    ManifestSrc = "manifest-src",
    /** The prefetch-src directive specifies valid sources for pre-fetch and pre-render requests. */
    PrefetchSrc = "prefetch-src",
    /** The navigate-to directive specifies valid sources that can be navigated to. */
    NavigateTo = "navigate-to",
    /** The require-trusted-types-for directive specifies valid sources for Trusted Types usage. */
    RequireTrustedTypesFor = "require-trusted-types-for",
    /** The trusted-types directive specifies valid sources for Trusted Types usage. */
    TrustedTypes = "trusted-types",
    /** The upgrade-insecure-requests directive instructs user agents to treat all of a site's insecure URLs (those served over HTTP) as though they have been replaced with secure URLs (those served over HTTPS). */
    UpgradeInsecureRequests = "upgrade-insecure-requests",
    /** The block-all-mixed-content directive prevents loading any assets using HTTP when the page is loaded using HTTPS. */
    BlockAllMixedContent = "block-all-mixed-content"
}

/**
 * Configuration for the CSP report-to directive (CSP Level 3).
 * Used to specify a reporting group for violation reports.
 *
 * Example:
 *   {
 *     group: 'csp-endpoint',
 *     max_age: 10886400,
 *     endpoints: [{ url: 'https://example.com/csp-report' }]
 *   }
 */
interface ReportToConfig {
    group: string;
    max_age: number;
    endpoints: { url: string }[];
}

/**
 * Configuration for the CSP sandbox directive.
 * Used to enable sandboxing and specify allowed features.
 *
 * Example:
 *   { Enabled: true, Allow: ['allow-scripts', 'allow-forms'] }
 */
interface SandboxOptions {
    Enabled: boolean;
    Allow?: string[];
}

/**
 * Options for configuring a single CSP directive.
 *
 * All fields are optional and only relevant for certain directives.
 * Hover over each property in your IDE for a description.
 */
interface DirectiveOptions {
    /** List of allowed domains or sources. */
    Domains?: string[];
    /** Allow 'unsafe-inline' for this directive. */
    Inline?: boolean;
    /** Allow 'unsafe-eval' for this directive. */
    Eval?: boolean;
    /** Allow 'data:' URIs for this directive. */
    Data?: boolean;
    /** Allow 'blob:' URIs for this directive. */
    Blob?: boolean;
    /** Use 'none' for this directive. */
    None?: boolean;
    /** Allow 'self' for this directive. */
    Self?: boolean;
    /** Allow 'unsafe-hashes' for this directive. */
    Hash?: boolean;
    /** Allow 'strict-dynamic' for this directive. */
    Dynamic?: boolean;
    /** List of allowed hashes (e.g., sha256-...). */
    AllowedHashes?: string[];
    /** Nonce value (can be with or without quotes). */
    Nonce?: string;
    /** Report-To configuration for modern reporting. */
    ReportConfig?: ReportToConfig;
    /** Sandbox configuration. */
    SandboxConfig?: SandboxOptions;
}

/**
 * Type mapping each CSP directive to its allowed options.
 * Ensures only relevant options are available for each directive.
 *
 * Hover over a directive in your IDE to see which options are available.
 */
type DirectiveOptionsMap = {
    [CSPDirectiveOptions.DefaultSrc]: Pick<
        DirectiveOptions,
        | "Domains"
        | "None"
        | "Self"
        | "Inline"
        | "Eval"
        | "Data"
        | "Dynamic"
        | "Hash"
        | "AllowedHashes"
        | "Nonce"
    >;
    [CSPDirectiveOptions.ScriptSrc]: Pick<
        DirectiveOptions,
        | "Domains"
        | "None"
        | "Self"
        | "Inline"
        | "Eval"
        | "Data"
        | "Dynamic"
        | "Hash"
        | "AllowedHashes"
        | "Nonce"
    >;
    [CSPDirectiveOptions.StyleSrc]: Pick<
        DirectiveOptions,
        | "Domains"
        | "None"
        | "Self"
        | "Inline"
        | "Data"
        | "Hash"
        | "AllowedHashes"
        | "Nonce"
    >;
    [CSPDirectiveOptions.ImgSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self" | "Data" | "Blob"
    >;
    [CSPDirectiveOptions.FontSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self" | "Data"
    >;
    [CSPDirectiveOptions.ConnectSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.ObjectSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.MediaSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self" | "Data" | "Blob"
    >;
    [CSPDirectiveOptions.FrameSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.Sandbox]: Pick<DirectiveOptions, "SandboxConfig">;
    [CSPDirectiveOptions.ReportUri]: Pick<DirectiveOptions, "Domains">;
    [CSPDirectiveOptions.ChildSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.FormAction]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.FrameAncestors]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.PluginTypes]: Pick<DirectiveOptions, "Domains">;
    [CSPDirectiveOptions.BaseUri]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.ReportTo]: Pick<DirectiveOptions, "ReportConfig">;
    [CSPDirectiveOptions.WorkerSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self" | "Blob"
    >;
    [CSPDirectiveOptions.ManifestSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.PrefetchSrc]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.NavigateTo]: Pick<
        DirectiveOptions,
        "Domains" | "None" | "Self"
    >;
    [CSPDirectiveOptions.RequireTrustedTypesFor]: Pick<
        DirectiveOptions,
        "Domains"
    >;
    [CSPDirectiveOptions.TrustedTypes]: Pick<DirectiveOptions, "Domains">;
    [CSPDirectiveOptions.UpgradeInsecureRequests]: Record<string, never>;
    [CSPDirectiveOptions.BlockAllMixedContent]: Record<string, never>;
};

/**
 * Validation result for CSP generation.
 * Contains errors and warnings for the generated policy.
 */
interface CSPValidationResult {
    isValid: boolean;
    errors: CSPError[];
    warnings: string[];
}

/**
 * Options for the CSPGenerator function.
 *
 * - directive: An object mapping each directive to its options (type-safe).
 * - minify: If true, minifies the output by removing extra whitespace.
 * - strictValidation: If true, throws on any error.
 * - reportErrors: If true, returns validation info along with the policy.
 * - reportOnly: If true, generates a report-only header name.
 */
type CSPGeneratorOptions = {
    directive?: {
        [K in keyof DirectiveOptionsMap]?: DirectiveOptionsMap[K];
    };
    minify?: boolean;
    strictValidation?: boolean;
    reportErrors?: boolean;
    reportOnly?: boolean;
};

/**
 * CSP generation result with validation information and header name.
 */
interface CSPGeneratorResult {
    policy: string;
    validation: CSPValidationResult;
    headerName: string;
}

/**
 * Predefined secure CSP presets for common use cases.
 *
 * STRICT: Most restrictive, blocks everything except self.
 * MODERATE: Allows inline scripts/styles, but no eval.
 * PERMISSIVE: Allows everything including eval and wildcard images.
 *
 * You can use these as a base and override as needed.
 */
const CSP_PRESETS: Record<string, Record<string, any>> = {
    STRICT: {
        [CSPDirectiveOptions.DefaultSrc]: { None: true },
        [CSPDirectiveOptions.ScriptSrc]: { Self: true },
        [CSPDirectiveOptions.StyleSrc]: { Self: true },
        [CSPDirectiveOptions.ImgSrc]: { Self: true, Data: true },
        [CSPDirectiveOptions.FontSrc]: { Self: true },
        [CSPDirectiveOptions.ConnectSrc]: { Self: true },
        [CSPDirectiveOptions.ObjectSrc]: { None: true },
        [CSPDirectiveOptions.BaseUri]: { Self: true },
        [CSPDirectiveOptions.FrameAncestors]: { None: true },
        [CSPDirectiveOptions.UpgradeInsecureRequests]: {}
    },
    MODERATE: {
        [CSPDirectiveOptions.DefaultSrc]: { Self: true },
        [CSPDirectiveOptions.ScriptSrc]: { Self: true, Inline: true },
        [CSPDirectiveOptions.StyleSrc]: { Self: true, Inline: true },
        [CSPDirectiveOptions.ImgSrc]: { Self: true, Data: true },
        [CSPDirectiveOptions.ObjectSrc]: { None: true },
        [CSPDirectiveOptions.UpgradeInsecureRequests]: {}
    },
    PERMISSIVE: {
        [CSPDirectiveOptions.DefaultSrc]: { Self: true },
        [CSPDirectiveOptions.ScriptSrc]: {
            Self: true,
            Inline: true,
            Eval: true
        },
        [CSPDirectiveOptions.StyleSrc]: { Self: true, Inline: true },
        [CSPDirectiveOptions.ImgSrc]: { Self: true, Data: true, Domains: ["*"] }
    }
};

/**
 * Default secure values for common CSP directives.
 * These provide a strong baseline security policy.
 */
const DEFAULT_DIRECTIVES: Partial<Record<CSPDirectiveOptions, string>> = {
    [CSPDirectiveOptions.DefaultSrc]: "'self'",
    [CSPDirectiveOptions.ScriptSrc]: "'self'",
    [CSPDirectiveOptions.StyleSrc]: "'self'",
    [CSPDirectiveOptions.ImgSrc]: "'self' data:",
    [CSPDirectiveOptions.FontSrc]: "'self'",
    [CSPDirectiveOptions.ConnectSrc]: "'self'",
    [CSPDirectiveOptions.ObjectSrc]: "'none'",
    [CSPDirectiveOptions.BaseUri]: "'self'",
    [CSPDirectiveOptions.FrameAncestors]: "'none'"
};

/**
 * Deep merge utility for merging directive options with proper domain merging.
 * - Merges Domains arrays instead of overwriting.
 * - Handles all other fields as shallow merge.
 */
function deepMergeDirectives<T extends Record<string, any>>(
    target: T,
    source: T
): T {
    const result = { ...target };
    for (const key in source) {
        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])
        ) {
            result[key] = {
                ...((result[key] as any) || {}),
                ...source[key]
            };
            // Only merge Domains if both are arrays
            if (
                Array.isArray(result[key].Domains) &&
                Array.isArray(source[key].Domains)
            ) {
                result[key].Domains = [
                    ...new Set([
                        ...(target[key]?.Domains || []),
                        ...source[key].Domains
                    ])
                ];
            }
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

/**
 * Validates a domain string for CSP usage.
 * Allows protocol-relative, http(s), wildcard subdomains, and bare domains.
 * @param domain The domain string to validate.
 * @returns Validation result with error message if invalid.
 */
function validateDomain(domain: string): { isValid: boolean; error?: string } {
    if (typeof domain !== "string" || domain.length === 0) {
        return { isValid: false, error: "Domain must be a non-empty string" };
    }

    // Allow wildcard
    if (domain === "*") {
        return { isValid: true };
    }

    // Protocol-relative URLs
    if (/^\/\//.test(domain)) {
        return /^\/\/[\w.-]+(:\d+)?(\/.*)?\*?$/.test(domain)
            ? { isValid: true }
            : { isValid: false, error: "Invalid protocol-relative URL format" };
    }

    // Full URLs with protocol
    if (/^https?:\/\//.test(domain)) {
        try {
            new URL(domain);
            return { isValid: true };
        } catch {
            return { isValid: false, error: "Invalid URL format" };
        }
    }

    // Wildcard subdomains
    if (/^\*\./.test(domain)) {
        return /^\*\.[\w.-]+$/.test(domain)
            ? { isValid: true }
            : { isValid: false, error: "Invalid wildcard subdomain format" };
    }

    // Bare domains
    if (/^[\w.-]+(:\d+)?$/.test(domain)) {
        return { isValid: true };
    }

    return { isValid: false, error: "Invalid domain format" };
}

/**
 * Validates a nonce value (supports both quoted and unquoted formats).
 * @param nonce The nonce string to validate.
 * @returns Validation result with error message if invalid.
 */
function validateNonce(nonce: string): { isValid: boolean; error?: string } {
    // Support both quoted and unquoted nonce values
    const quotedPattern = /^'nonce-[a-zA-Z0-9+/=]+'$/;
    const unquotedPattern = /^nonce-[a-zA-Z0-9+/=]+$/;

    if (!quotedPattern.test(nonce) && !unquotedPattern.test(nonce)) {
        return {
            isValid: false,
            error: "Nonce must be in format 'nonce-<base64-value>' or nonce-<base64-value>"
        };
    }
    return { isValid: true };
}

/**
 * Validates a hash value (supports both quoted and unquoted formats).
 * @param hash The hash string to validate.
 * @returns Validation result with error message if invalid.
 */
function validateHash(hash: string): { isValid: boolean; error?: string } {
    const quotedPattern = /^'(sha256|sha384|sha512)-[a-zA-Z0-9+/=]+'$/;
    const unquotedPattern = /^(sha256|sha384|sha512)-[a-zA-Z0-9+/=]+$/;

    if (!quotedPattern.test(hash) && !unquotedPattern.test(hash)) {
        return {
            isValid: false,
            error: "Hash must be in format 'sha256-<base64-value>' or sha256-<base64-value>"
        };
    }
    return { isValid: true };
}

/**
 * Detects potentially unsafe CSP configurations and returns warnings.
 * @param directive The directive name.
 * @param options The directive options.
 * @returns Array of warning strings.
 */
function detectUnsafePatterns(
    directive: string,
    options: DirectiveOptions
): string[] {
    const warnings: string[] = [];

    if (
        options.Inline &&
        (directive === "script-src" || directive === "style-src")
    ) {
        warnings.push(`'unsafe-inline' in ${directive} reduces security`);
    }

    if (options.Eval && directive === "script-src") {
        warnings.push(`'unsafe-eval' in ${directive} is highly dangerous`);
    }

    if (options.Domains?.includes("*")) {
        warnings.push(`Wildcard (*) in ${directive} allows all sources`);
    }

    if (options.Data && directive === "script-src") {
        warnings.push(`data: URLs in ${directive} can be dangerous`);
    }

    return warnings;
}

/**
 * Normalizes nonce/hash values to ensure proper quoting for CSP.
 * Always outputs single-quoted values for CSP.
 * @param value The nonce or hash value.
 * @param type 'nonce' or 'hash'.
 * @returns The normalized value.
 */
function normalizeValue(value: string, type: "nonce" | "hash"): string {
    // Always output as single-quoted for CSP
    if (value.startsWith("'nonce-") || value.startsWith("'sha")) {
        return value;
    }
    if (type === "nonce" && value.startsWith("nonce-")) {
        return `'${value}'`;
    }
    if (
        type === "hash" &&
        (value.startsWith("sha256-") ||
            value.startsWith("sha384-") ||
            value.startsWith("sha512-"))
    ) {
        return `'${value}'`;
    }
    return value;
}

/**
 * Generates a Content Security Policy (CSP) string from the provided options.
 *
 * - Serializes each directive and its options.
 * - Validates domains, hashes, and nonces.
 * - Supports sandbox and report-to (CSP Level 3).
 * - Supports custom directives and sorts output for consistency.
 * - Applies sensible defaults for missing directives.
 *
 * @param options CSPGeneratorOptions for building the policy.
 * @returns A CSP string suitable for use in HTTP headers or meta tags, or a result object if reportErrors is true.
 */
function CSPGenerator(
    options: CSPGeneratorOptions = {}
): string | CSPGeneratorResult {
    const {
        directive = {},
        minify = false,
        strictValidation = false,
        reportErrors = false,
        reportOnly = false
    } = options;

    const errors: CSPError[] = [];
    const warnings: string[] = [];

    const serializeDirective = (
        key: CSPDirectiveOptions | string,
        value: DirectiveOptions
    ): string => {
        if (!value) return "";

        const parts: string[] = [];

        // Handle conflicting options
        if (
            value.None &&
            (value.Self || value.Inline || value.Domains?.length)
        ) {
            const error = new CSPError(
                `'none' conflicts with other options in ${key}`,
                key,
                value
            );
            if (strictValidation) throw error;
            errors.push(error);
        }

        // Handle special directives
        if (key === CSPDirectiveOptions.Sandbox) {
            // Output: sandbox [allow-forms allow-scripts ...]
            if (value.SandboxConfig?.Enabled) {
                const allowValues = value.SandboxConfig.Allow || [];
                return `${key}${allowValues.length ? " " + allowValues.join(" ") : ""}`;
            }
            return "";
        }

        if (key === CSPDirectiveOptions.ReportTo) {
            // Output: report-to groupName (CSP Level 3)
            if (value.ReportConfig) {
                // The actual JSON config should be sent via the Report-To HTTP header, not CSP
                // CSP only references the group name
                return `${key} ${value.ReportConfig.group}`;
            }
            return "";
        }

        // Handle directives that don't take values
        if (
            key === CSPDirectiveOptions.UpgradeInsecureRequests ||
            key === CSPDirectiveOptions.BlockAllMixedContent
        ) {
            return key;
        }

        if (value.None) parts.push("'none'");
        if (value.Self) parts.push("'self'");
        if (value.Inline) parts.push("'unsafe-inline'");
        if (value.Eval) parts.push("'unsafe-eval'");
        if (value.Data) parts.push("data:");
        if (value.Blob) parts.push("blob:");
        if (value.Dynamic) parts.push("'strict-dynamic'");
        if (value.Hash) parts.push("'unsafe-hashes'");

        // Enhanced domain validation
        if (value.Domains?.length) {
            for (const domain of value.Domains) {
                const validation = validateDomain(domain);
                if (!validation.isValid) {
                    const error = new CSPError(
                        `Invalid domain '${domain}' in ${key}: ${validation.error}`,
                        key,
                        domain
                    );
                    if (strictValidation) throw error;
                    errors.push(error);
                } else {
                    parts.push(domain);
                }
            }
        }

        // Hash validation with normalization
        if (value.AllowedHashes?.length) {
            for (const hash of value.AllowedHashes) {
                const validation = validateHash(hash);
                if (!validation.isValid) {
                    const error = new CSPError(
                        `Invalid hash '${hash}' in ${key}: ${validation.error}`,
                        key,
                        hash
                    );
                    if (strictValidation) throw error;
                    errors.push(error);
                } else {
                    parts.push(normalizeValue(hash, "hash"));
                }
            }
        }

        // Nonce validation with normalization
        if (value.Nonce) {
            const validation = validateNonce(value.Nonce);
            if (!validation.isValid) {
                const error = new CSPError(
                    `Invalid nonce in ${key}: ${validation.error}`,
                    key,
                    value.Nonce
                );
                if (strictValidation) throw error;
                errors.push(error);
            } else {
                parts.push(normalizeValue(value.Nonce, "nonce"));
            }
        }

        // Detect unsafe patterns
        warnings.push(...detectUnsafePatterns(key, value));

        return parts.length ? `${key} ${parts.join(" ")}` : "";
    };

    // Merge with defaults and process directives
    const allDirectives = Object.keys({ ...DEFAULT_DIRECTIVES, ...directive });
    const sortedDirectives = allDirectives.sort();

    const directives = sortedDirectives
        .map((key) => {
            const value = directive[key as CSPDirectiveOptions];
            if (value) {
                return serializeDirective(key as CSPDirectiveOptions, value);
            }
            if (DEFAULT_DIRECTIVES[key as CSPDirectiveOptions]) {
                return `${key} ${DEFAULT_DIRECTIVES[key as CSPDirectiveOptions]}`;
            }
            return "";
        })
        .filter(Boolean);

    let csp = directives.join("; ");
    if (minify) {
        csp = csp.replace(/\s+/g, " ").replace(/;\s+/g, ";").trim();
    } else {
        csp = csp.trim();
    }

    const validation: CSPValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings
    };

    const headerName = reportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy";

    if (reportErrors) {
        return { policy: csp, validation, headerName };
    }

    return csp;
}

/**
 * Creates a CSP from a preset configuration with deep merging.
 *
 * @param preset The preset name (STRICT, MODERATE, PERMISSIVE).
 * @param overrides Optional overrides for the preset.
 * @returns The generated CSP string.
 */
function createCSPFromPreset(
    preset: keyof typeof CSP_PRESETS,
    overrides: CSPGeneratorOptions = {}
): string {
    const mergedDirectives = overrides.directive
        ? deepMergeDirectives(CSP_PRESETS[preset], overrides.directive)
        : CSP_PRESETS[preset];

    return CSPGenerator({
        ...overrides,
        directive: mergedDirectives
    }) as string;
}

/**
 * Creates a CSP meta tag for HTML insertion.
 *
 * @param policy The CSP string.
 * @param reportOnly If true, uses the report-only header name.
 * @returns The meta tag string.
 */
function generateMetaCSP(policy: string, reportOnly: boolean = false): string {
    const headerName = reportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy";
    return `<meta http-equiv="${headerName}" content="${policy.replace(/"/g, "&quot;")}">`;
}

/**
 * Creates a CSP header object for server frameworks.
 *
 * @param policy The CSP string.
 * @param reportOnly If true, uses the report-only header name.
 * @returns An object with the correct header name and value.
 */
function generateHeaderCSP(
    policy: string,
    reportOnly: boolean = false
): Record<string, string> {
    const headerName = reportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy";
    return { [headerName]: policy };
}

/**
 * Utility to generate a secure nonce for CSP.
 *
 * @param length The length of the nonce (default 16).
 * @returns A single-quoted nonce string for CSP.
 */
function generateNonce(length: number = 16): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    const base64 = btoa(String.fromCharCode(...array));
    return `'nonce-${base64}'`;
}

/**
 * Utility to generate a hash for inline content for CSP.
 *
 * @param content The content to hash.
 * @param algorithm The hash algorithm (default SHA-256).
 * @returns A single-quoted hash string for CSP.
 */
async function generateContentHash(
    content: string,
    algorithm: "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256"
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    const alg = algorithm.toLowerCase().replace("-", "");
    return `'${alg}-${base64}'`;
}

export {
    CSPGenerator,
    CSPDirectiveOptions,
    createCSPFromPreset,
    generateMetaCSP,
    generateHeaderCSP,
    generateNonce,
    generateContentHash,
    CSPError,
    CSP_PRESETS
};

export type {
    CSPGeneratorOptions,
    DirectiveOptions,
    CSPGeneratorResult,
    CSPValidationResult,
    ReportToConfig,
    SandboxOptions
};