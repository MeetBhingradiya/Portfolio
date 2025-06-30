/**
 * Enhanced Name Detection Service
 * Provides accurate title/name detection from URLs with multiple fallback strategies
 */

import { Axios } from './Axios';

interface NameDetectionResult {
    name: string;
    source: 'title' | 'og:title' | 'twitter:title' | 'h1' | 'domain' | 'manual';
    confidence: number;
    description?: string;
}

class NameDetectionService {
    private readonly commonDomainMappings: Record<string, string> = {
        'web.whatsapp.com': 'WhatsApp Web',
        'mail.google.com': 'Gmail',
        'drive.google.com': 'Google Drive',
        'docs.google.com': 'Google Docs',
        'sheets.google.com': 'Google Sheets',
        'slides.google.com': 'Google Slides',
        'calendar.google.com': 'Google Calendar',
        'photos.google.com': 'Google Photos',
        'maps.google.com': 'Google Maps',
        'translate.google.com': 'Google Translate',
        'www.youtube.com': 'YouTube',
        'music.youtube.com': 'YouTube Music',
        'studio.youtube.com': 'YouTube Studio',
        'twitter.com': 'Twitter',
        'x.com': 'X (Twitter)',
        'www.linkedin.com': 'LinkedIn',
        'www.facebook.com': 'Facebook',
        'www.instagram.com': 'Instagram',
        'www.tiktok.com': 'TikTok',
        'discord.com': 'Discord',
        'app.slack.com': 'Slack',
        'teams.microsoft.com': 'Microsoft Teams',
        'outlook.live.com': 'Outlook',
        'outlook.office.com': 'Outlook',
        'onedrive.live.com': 'OneDrive',
        'www.office.com': 'Microsoft Office',
        'portal.azure.com': 'Azure Portal',
        'console.aws.amazon.com': 'AWS Console',
        'console.cloud.google.com': 'Google Cloud Console',
        'app.netlify.com': 'Netlify',
        'dashboard.vercel.com': 'Vercel Dashboard',
        'app.heroku.com': 'Heroku Dashboard',
        'github.com': 'GitHub',
        'gitlab.com': 'GitLab',
        'bitbucket.org': 'Bitbucket',
        'stackoverflow.com': 'Stack Overflow',
        'www.reddit.com': 'Reddit',
        'medium.com': 'Medium',
        'dev.to': 'DEV Community',
        'www.notion.so': 'Notion',
        'www.figma.com': 'Figma',
        'www.canva.com': 'Canva',
        'app.diagrams.net': 'draw.io',
        'www.netflix.com': 'Netflix',
        'www.spotify.com': 'Spotify',
        'music.apple.com': 'Apple Music',
        'www.amazon.com': 'Amazon',
        'www.ebay.com': 'eBay',
        'www.etsy.com': 'Etsy',
        'www.wikipedia.org': 'Wikipedia',
        'chatgpt.com': 'ChatGPT',
        'claude.ai': 'Claude AI',
        'bard.google.com': 'Google Bard',
        'www.bing.com': 'Bing',
        'duckduckgo.com': 'DuckDuckGo',
        'www.google.com': 'Google',
        'search.yahoo.com': 'Yahoo Search'
    };

    /**
     * Detect name from URL with multiple strategies
     */
    public async detectName(url: string): Promise<NameDetectionResult> {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const fullDomain = domain;

            // Strategy 1: Check common domain mappings first
            if (this.commonDomainMappings[fullDomain]) {
                return {
                    name: this.commonDomainMappings[fullDomain],
                    source: 'manual',
                    confidence: 0.95,
                    description: 'Matched from known domain mapping'
                };
            }

            // Strategy 2: Try to fetch and parse HTML content
            const htmlResult = await this.detectFromHtml(url);
            if (htmlResult.confidence > 0.7) {
                return htmlResult;
            }

            // Strategy 3: Use domain-based detection
            const domainResult = this.detectFromDomain(domain);
            
            // Return the best result
            return htmlResult.confidence > domainResult.confidence ? htmlResult : domainResult;

        } catch (error) {
            console.error('Name detection failed:', error);
            
            // Fallback to simple domain extraction
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                return {
                    name: this.prettifyDomain(domain),
                    source: 'domain',
                    confidence: 0.3,
                    description: 'Fallback domain prettification'
                };
            } catch {
                return {
                    name: 'Unknown Site',
                    source: 'domain',
                    confidence: 0.1,
                    description: 'Failed to parse URL'
                };
            }
        }
    }

    /**
     * Detect name from HTML content
     */
    private async detectFromHtml(url: string): Promise<NameDetectionResult> {
        try {
            let htmlContent = '';
            let method = 'direct';

            // Try direct fetch first
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                htmlContent = await response.text();
            } catch {
                // Use CORS proxy if direct fetch fails
                method = 'cors-proxy';
                const corsResponse = await Axios.post('/api/cors', {
                    body: {
                        endpoint: url,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                });

                if (corsResponse.data.status === 200) {
                    htmlContent = corsResponse.data.data;
                } else {
                    throw new Error('Failed to fetch through CORS proxy');
                }
            }

            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Strategy 1: OpenGraph title
            const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
            if (ogTitle && ogTitle.trim()) {
                return {
                    name: this.cleanTitle(ogTitle),
                    source: 'og:title',
                    confidence: 0.9,
                    description: `Extracted from OpenGraph meta tag${method === 'cors-proxy' ? ' (via CORS proxy)' : ''}`
                };
            }

            // Strategy 2: Twitter title
            const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
            if (twitterTitle && twitterTitle.trim()) {
                return {
                    name: this.cleanTitle(twitterTitle),
                    source: 'twitter:title',
                    confidence: 0.85,
                    description: `Extracted from Twitter meta tag${method === 'cors-proxy' ? ' (via CORS proxy)' : ''}`
                };
            }

            // Strategy 3: Standard title tag
            const title = doc.querySelector('title')?.textContent;
            if (title && title.trim()) {
                return {
                    name: this.cleanTitle(title),
                    source: 'title',
                    confidence: 0.8,
                    description: `Extracted from title tag${method === 'cors-proxy' ? ' (via CORS proxy)' : ''}`
                };
            }

            // Strategy 4: Main heading (h1)
            const h1 = doc.querySelector('h1')?.textContent;
            if (h1 && h1.trim()) {
                return {
                    name: this.cleanTitle(h1),
                    source: 'h1',
                    confidence: 0.7,
                    description: `Extracted from main heading${method === 'cors-proxy' ? ' (via CORS proxy)' : ''}`
                };
            }

            // Strategy 5: Application name meta tag
            const appName = doc.querySelector('meta[name="application-name"]')?.getAttribute('content');
            if (appName && appName.trim()) {
                return {
                    name: this.cleanTitle(appName),
                    source: 'title',
                    confidence: 0.75,
                    description: `Extracted from application-name meta tag${method === 'cors-proxy' ? ' (via CORS proxy)' : ''}`
                };
            }

            throw new Error('No title found in HTML');

        } catch (error) {
            console.warn('HTML name detection failed:', error);
            return {
                name: '',
                source: 'title',
                confidence: 0,
                description: 'Failed to extract from HTML'
            };
        }
    }

    /**
     * Detect name from domain
     */
    private detectFromDomain(domain: string): NameDetectionResult {
        // Remove common prefixes
        const cleanDomain = domain.replace(/^(www\.|m\.|mobile\.|app\.|web\.)/, '');
        
        // Get the main part (remove TLD for common cases)
        const parts = cleanDomain.split('.');
        let mainPart = parts[0];

        // Handle special cases for well-known domains
        if (parts.length >= 2) {
            const tld = parts[parts.length - 1];
            const sld = parts[parts.length - 2];
            
            // For country-specific domains or well-known patterns
            if (['co', 'com', 'org', 'net', 'gov', 'edu'].includes(sld) && parts.length > 2) {
                mainPart = parts[parts.length - 3];
            } else if (['github', 'gitlab', 'bitbucket'].includes(sld)) {
                // For code hosting services, use the subdomain as the main identifier
                mainPart = parts[0];
            }
        }

        // Special handling for specific domain patterns
        if (domain.includes('web.whatsapp')) {
            return {
                name: 'WhatsApp Web',
                source: 'domain',
                confidence: 0.9,
                description: 'Special domain pattern recognition'
            };
        }

        if (domain.includes('mail.google')) {
            return {
                name: 'Gmail',
                source: 'domain',
                confidence: 0.9,
                description: 'Special domain pattern recognition'
            };
        }

        // Prettify the domain name
        const prettifiedName = this.prettifyDomain(mainPart);
        
        return {
            name: prettifiedName,
            source: 'domain',
            confidence: 0.6,
            description: 'Extracted and prettified from domain name'
        };
    }

    /**
     * Clean and normalize title text
     */
    private cleanTitle(title: string): string {
        return title
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/^\||\|$/g, '') // Remove leading/trailing pipes
            .replace(/^[-–—]\s*/, '') // Remove leading dashes
            .replace(/\s*[-–—]\s*$/, '') // Remove trailing dashes
            .replace(/\s*\|\s*$/, '') // Remove trailing pipes
            .replace(/\s*::\s*$/, '') // Remove trailing double colons
            .replace(/\s*\[\d+\]$/, '') // Remove trailing numbers in brackets
            .trim();
    }

    /**
     * Prettify domain name
     */
    private prettifyDomain(domain: string): string {
        // Handle special cases
        const specialCases: Record<string, string> = {
            'github': 'GitHub',
            'gitlab': 'GitLab',
            'linkedin': 'LinkedIn',
            'youtube': 'YouTube',
            'instagram': 'Instagram',
            'facebook': 'Facebook',
            'twitter': 'Twitter',
            'whatsapp': 'WhatsApp',
            'stackoverflow': 'Stack Overflow',
            'microsoft': 'Microsoft',
            'netflix': 'Netflix',
            'spotify': 'Spotify',
            'amazon': 'Amazon',
            'google': 'Google',
            'apple': 'Apple',
            'adobe': 'Adobe',
            'nvidia': 'NVIDIA',
            'amd': 'AMD',
            'intel': 'Intel',
            'mysql': 'MySQL',
            'postgresql': 'PostgreSQL',
            'mongodb': 'MongoDB',
            'firebase': 'Firebase',
            'aws': 'AWS',
            'gcp': 'Google Cloud Platform',
            'azure': 'Microsoft Azure'
        };

        const lowerDomain = domain.toLowerCase();
        if (specialCases[lowerDomain]) {
            return specialCases[lowerDomain];
        }

        // Split by common separators and capitalize each part
        return domain
            .split(/[-_.]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ')
            .trim();
    }

    /**
     * Get enhanced description from URL and content
     */
    public async getDescription(url: string): Promise<string> {
        try {
            let htmlContent = '';

            // Try direct fetch first
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                htmlContent = await response.text();
            } catch {
                // Use CORS proxy
                const corsResponse = await Axios.post('/api/cors', {
                    body: {
                        endpoint: url,
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    }
                });

                if (corsResponse.data.status === 200) {
                    htmlContent = corsResponse.data.data;
                } else {
                    throw new Error('Failed to fetch');
                }
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Try different description sources
            const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
            const twitterDescription = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
            const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content');

            const description = ogDescription || twitterDescription || metaDescription || '';
            
            return description.trim().substring(0, 200); // Limit length

        } catch (error) {
            console.warn('Description detection failed:', error);
            return '';
        }
    }
}

export const nameDetectionService = new NameDetectionService();
export default nameDetectionService;
