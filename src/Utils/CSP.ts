/**
 *  @FileID          Utils\CSP.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

enum CSPDirectiveOptions {
    // @ The default-src directive serves as a fallback for the other CSP fetch directives.
    DefaultSrc = 'default-src',
    // @ The script-src directive specifies valid sources for JavaScript.
    ScriptSrc = 'script-src',
    // @ The style-src directive specifies valid sources for stylesheets.
    StyleSrc = 'style-src',
    // @ The img-src directive specifies valid sources of images and favicons.
    ImgSrc = 'img-src',
    // @ The font-src directive specifies valid sources for fonts loaded using @font-face.
    FontSrc = 'font-src',
    // @ The connect-src directive specifies valid sources for fetch, XMLHttpRequest, WebSocket, and EventSource.
    ConnectSrc = 'connect-src',
    // @ The object-src directive specifies valid sources for the <object>, <embed>, and <applet> elements.
    ObjectSrc = 'object-src',
    // @ The media-src directive specifies valid sources for loading media using the <audio> and <video> elements.
    MediaSrc = 'media-src',
    // @ The frame-src directive specifies valid sources for nested browsing contexts loading using elements such as <frame> and <iframe>.
    FrameSrc = 'frame-src',
    // @ The sandbox directive enables a sandbox for the requested resource similar to the <iframe> sandbox attribute.
    Sandbox = 'sandbox',
    // @ The report-uri directive specifies a URL to which the user agent sends reports about policy violation.
    ReportUri = 'report-uri',
    // @ The child-src directive specifies valid sources for web workers and nested browsing contexts loaded using elements such as <frame> and <iframe>.
    ChildSrc = 'child-src',
    // @ The form-action directive specifies valid endpoints for submission from <form> tags.
    FormAction = 'form-action',
    // @ The frame-ancestors directive specifies valid parents that may embed a page using elements such as <frame> and <iframe>.
    FrameAncestors = 'frame-ancestors',
    // @ The plugin-types directive restricts the set of plugins that can be invoked by the protected resource by limiting the types of resources that can be embedded.
    PluginTypes = 'plugin-types',
    // @ The base-uri directive restricts the URLs that can appear in a pageÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s <base> element.
    BaseUri = 'base-uri',
    // @ The manifest-src directive specifies which manifest can be applied to the resource.
    ReportTo = 'report-to',
    // @ The worker-src directive specifies the location of a worker-src.
    WorkerSrc = 'worker-src',
    // @ The manifest-src directive specifies which manifest can be applied to the resource.
    ManifestSrc = 'manifest-src',
    // @ The prefetch-src directive specifies valid sources for pre-fetch and pre-render requests.
    PrefetchSrc = 'prefetch-src',
    // @ The navigate-to directive specifies valid sources that can be navigated to.
    NavigateTo = 'navigate-to',
    // @ The require-trusted-types-for directive specifies valid sources for Trusted Types usage.
    RequireTrustedTypesFor = 'require-trusted-types-for',
    // @ The trusted-types directive specifies valid sources for Trusted Types usage.
    TrustedTypes = 'trusted-types',
    // @ The upgrade-insecure-requests directive instructs user agents to treat all of a siteÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s insecure URLs (those served over HTTP) as though they have been replaced with secure URLs (those served over HTTPS).
    UpgradeInsecureRequests = 'upgrade-insecure-requests',
    // @ The block-all-mixed-content directive prevents loading any assets using HTTP when the page is loaded using HTTPS.
    BlockAllMixedContent = 'block-all-mixed-content',
}

interface DirectiveOptions {
    // ? RegExp Test Reqiured
    Domains?: string[]
    // ? Inline
    Inline?: boolean
    // ? Eval
    Eval?: boolean
    // ? Data
    Data?: boolean
    // ? None
    None?: boolean
    // ? Self
    Self?: boolean
    // ? Hash
    Hash?: boolean
    // ? Dynamic
    Dynamic?: boolean
    // ? Custom Hash : RegExp Test Reqiured // Example: sha256-abc123 or sha384-abc123 sha512-def456
    AllowedHashes?: string[]
    // ? Nonce : RegExp Test Reqiured
    Nonce?: string
}

interface CSPGeneratorOptions {
    directive?: {
        [key in CSPDirectiveOptions]?: DirectiveOptions
    }
    removeWhitespace?: boolean
    minify?: boolean
}

// Default directives with common configurations
const DEFAULT_DIRECTIVES: { [key in CSPDirectiveOptions]?: string } = {};

function CSPGenerator(options: CSPGeneratorOptions = {}): string {
    // Destructure the options
    const { directive = {}, removeWhitespace = false, minify = false } = options;

    // Serialize the directive options
    const serializeDirective = (key: CSPDirectiveOptions, value: DirectiveOptions): string => {
        if (!value) return '';

        const parts: string[] = [];
        if (value.None) parts.push("'none'");
        if (value.Self) parts.push("'self'");
        if (value.Inline) parts.push("'unsafe-inline'");
        if (value.Eval) parts.push("'unsafe-eval'");
        if (value.Data) parts.push("data:");
        if (value.Dynamic) parts.push("'strict-dynamic'");
        if (value.Hash) parts.push("'unsafe-hashes'");
        if (value.Domains && value.Domains.length > 0) {
            // ? Check if the domains are valid
            const validDomains = value.Domains.filter((domain: string) =>
                /^(https?:)?\/\//.test(domain)
            );

            // ? Send Notification of Invalid Domains
            const invalidDomains = value.Domains.filter((domain: string) =>
                // ? Add * as Valid Domain
                domain !== '*' && !validDomains.includes(domain)
            );

            if (invalidDomains.length > 0) {
                console.warn(
                    `CSP: Invalid domains found for ${key}: ${invalidDomains.join(', ')}`
                );
            }

            // ? if * is present, remove all other domains & add * as valid domain
            if (value.Domains.includes('*')) {
                validDomains.splice(0, validDomains.length, '*');
            }

            parts.push(...validDomains);
        }

        if (value.AllowedHashes) {
            if (value.Hash) {
                const validHashes = value.AllowedHashes.filter((hash: any) =>
                    /^(sha256|sha384|sha512)-[a-zA-Z0-9+/=]+$/.test(hash)
                );
                parts.push(...validHashes);
            } else {
                console.warn(
                    `CSP: Hash directive is not enabled for ${key}. AllowedHashes will be ignored.`
                );
            }
        }
        if (value.Nonce && /^'nonce-[a-zA-Z0-9+/=]+$'/.test(value.Nonce)) {
            parts.push(value.Nonce);
        }

        return `${key} ${parts.join(' ')}`;
    };

    const directives = Object.entries(directive).map(([key, value]) =>
        serializeDirective(key as CSPDirectiveOptions, value as DirectiveOptions)
    );

    const defaultDirectives = Object.entries(DEFAULT_DIRECTIVES)
        .filter(([key]) => !directive[key as CSPDirectiveOptions])
        .map(([key, value]) => `${key} ${value}`);

    const csp = [...directives, ...defaultDirectives].filter(Boolean).join('; ');

    if (removeWhitespace || minify) {
        return csp.replace(/\s+/g, ' ').trim();
    }

    return csp.trim();
}

export {
    CSPGenerator,
    CSPDirectiveOptions,
};
export type {
    CSPGeneratorOptions,
    DirectiveOptions
};