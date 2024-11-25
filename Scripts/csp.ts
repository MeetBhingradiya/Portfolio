type CSPDirectives = 'default-src' | 'script-src' | 'style-src' | 'img-src' | 'font-src' | 'connect-src' | 'frame-ancestors' | 'frame-src' | 'base-uri' | 'form-action';

interface DirectiveOptions {
    sources?: string[];     // Additional sources to whitelist (e.g., domains)
    allowInline?: boolean;   // Enables 'unsafe-inline'
    allowEval?: boolean;     // Enables 'unsafe-eval'
    allowData?: boolean;     // Enables 'data:' for img-src and font-src
}

interface CSPProps {
    directives?: {
        [key in CSPDirectives]?: DirectiveOptions;
    };
}

function generateCSP({ directives = {} }: CSPProps): string {
    const defaultCSP: Record<CSPDirectives, string[]> = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", "data:"],
        'font-src': ["'self'", "data:"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'frame-src': ["'self'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
    };

    const cspEntries = Object.entries(defaultCSP).map(([directive, defaultSources]) => {
        const options = directives[directive as CSPDirectives];

        const sources = [
            ...defaultSources,
            ...(options?.sources || []),  
            options?.allowInline ? "'unsafe-inline'" : '', 
            options?.allowEval ? "'unsafe-eval'" : '',    
            options?.allowData ? 'data:' : '',            
        ].filter(Boolean);

        // Join sources with spaces and create directive entry
        return `${directive} ${sources.join(' ')}`;
    });

    return cspEntries.join('; ');
}

// @Main Use
const cspPolicy = generateCSP({
    directives: {
        'script-src': { sources: ['https://example.com'], allowInline: false }, // Customize 'script-src'
        'img-src': { allowData: true }, // Enable 'data:' for images
        'connect-src': { sources: ['https://api.example.com'] } // Add API domain to 'connect-src'
    }
});

// ! Generated CSP Policy
console.log(cspPolicy);