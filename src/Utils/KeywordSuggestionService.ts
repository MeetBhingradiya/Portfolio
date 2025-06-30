/**
 * External Keyword Suggestion Service
 * Integrates with multiple external APIs for better keyword suggestions
 */

import axios from 'axios';

interface KeywordSuggestion {
    keyword: string;
    source: 'google' | 'bing' | 'duckduckgo' | 'local';
    relevance: number;
}

class KeywordSuggestionService {
    private readonly maxSuggestions = 10;
    private readonly commonWords = [
        'and', 'the', 'this', 'that', 'with', 'from', 'your', 'have',
        'are', 'can', 'will', 'you', 'for', 'not', 'all', 'but',
        'any', 'had', 'her', 'was', 'one', 'our', 'out', 'day',
        'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new',
        'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did',
        'has', 'let', 'put', 'say', 'she', 'too', 'use'
    ];

    /**
     * Get keyword suggestions from Google Suggest API
     */
    private async getGoogleSuggestions(query: string): Promise<KeywordSuggestion[]> {
        try {
            const response = await fetch(
                `/api/cors?endpoint=${encodeURIComponent(
                    `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`
                )}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw new Error('Google API failed');

            const data = await response.json();
            const suggestions = data.data?.[1] || [];

            return suggestions.slice(0, 5).map((suggestion: string, index: number) => ({
                keyword: suggestion,
                source: 'google' as const,
                relevance: 1 - (index * 0.1) // Higher relevance for earlier suggestions
            }));
        } catch (error) {
            console.warn('Google suggestions failed:', error);
            return [];
        }
    }

    /**
     * Get keyword suggestions from Bing Autosuggest API
     */
    private async getBingSuggestions(query: string): Promise<KeywordSuggestion[]> {
        try {
            const response = await fetch(
                `/api/cors?endpoint=${encodeURIComponent(
                    `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`
                )}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw new Error('Bing API failed');

            const data = await response.json();
            const suggestions = data.data?.[1] || [];

            return suggestions.slice(0, 5).map((suggestion: string, index: number) => ({
                keyword: suggestion,
                source: 'bing' as const,
                relevance: 0.9 - (index * 0.1)
            }));
        } catch (error) {
            console.warn('Bing suggestions failed:', error);
            return [];
        }
    }

    /**
     * Get keyword suggestions from DuckDuckGo
     */
    private async getDuckDuckGoSuggestions(query: string): Promise<KeywordSuggestion[]> {
        try {
            const response = await fetch(
                `/api/cors?endpoint=${encodeURIComponent(
                    `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`
                )}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw new Error('DuckDuckGo API failed');

            const data = await response.json();
            const suggestions = data.data || [];

            return suggestions.slice(0, 3).map((item: any, index: number) => ({
                keyword: item.phrase || item,
                source: 'duckduckgo' as const,
                relevance: 0.8 - (index * 0.1)
            }));
        } catch (error) {
            console.warn('DuckDuckGo suggestions failed:', error);
            return [];
        }
    }

    /**
     * Generate local keyword suggestions (fallback)
     */
    private generateLocalSuggestions(text: string): KeywordSuggestion[] {
        // Split text into words
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .split(/\s+/)
            .filter((word) => word.length > 3 && !this.commonWords.includes(word));

        // Create suggestions by:
        // 1. Using single words
        // 2. Combining pairs of adjacent words
        const suggestions: string[] = [...words];

        // Add pairs of words
        for (let i = 0; i < words.length - 1; i++) {
            suggestions.push(`${words[i]} ${words[i + 1]}`);
        }

        // Add technology-related keywords based on common patterns
        const techKeywords = this.generateTechKeywords(text);
        suggestions.push(...techKeywords);

        // Remove duplicates and limit to 8 suggestions
        const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 8);

        return uniqueSuggestions.map((suggestion, index) => ({
            keyword: suggestion,
            source: 'local' as const,
            relevance: 0.5 - (index * 0.05)
        }));
    }

    /**
     * Generate technology-related keywords
     */
    private generateTechKeywords(text: string): string[] {
        const lowerText = text.toLowerCase();
        const techKeywords: string[] = [];

        // Web development patterns
        if (lowerText.includes('github') || lowerText.includes('git')) {
            techKeywords.push('version control', 'development', 'code');
        }
        if (lowerText.includes('npm') || lowerText.includes('node')) {
            techKeywords.push('javascript', 'nodejs', 'package manager');
        }
        if (lowerText.includes('react') || lowerText.includes('vue') || lowerText.includes('angular')) {
            techKeywords.push('frontend', 'web development', 'framework');
        }
        if (lowerText.includes('docker') || lowerText.includes('kubernetes')) {
            techKeywords.push('containerization', 'devops', 'deployment');
        }
        if (lowerText.includes('api') || lowerText.includes('rest')) {
            techKeywords.push('backend', 'web services', 'integration');
        }
        if (lowerText.includes('database') || lowerText.includes('sql')) {
            techKeywords.push('data', 'storage', 'query');
        }
        if (lowerText.includes('design') || lowerText.includes('ui') || lowerText.includes('ux')) {
            techKeywords.push('user interface', 'user experience', 'design');
        }
        if (lowerText.includes('cloud') || lowerText.includes('aws') || lowerText.includes('azure')) {
            techKeywords.push('cloud computing', 'infrastructure', 'scalability');
        }

        // Social media patterns
        if (lowerText.includes('social') || lowerText.includes('twitter') || lowerText.includes('facebook')) {
            techKeywords.push('social media', 'networking', 'communication');
        }

        // Productivity patterns
        if (lowerText.includes('calendar') || lowerText.includes('schedule')) {
            techKeywords.push('productivity', 'time management', 'organization');
        }
        if (lowerText.includes('note') || lowerText.includes('document')) {
            techKeywords.push('documentation', 'writing', 'knowledge');
        }

        return techKeywords;
    }

    /**
     * Get comprehensive keyword suggestions from multiple sources
     */
    public async getSuggestions(
        text: string, 
        existingKeywords: string[] = []
    ): Promise<KeywordSuggestion[]> {
        if (!text || text.length < 2) {
            return [];
        }

        const query = text.trim().toLowerCase();
        
        // Get suggestions from all sources in parallel
        const [googleSuggestions, bingSuggestions, duckduckgoSuggestions, localSuggestions] = 
            await Promise.allSettled([
                this.getGoogleSuggestions(query),
                this.getBingSuggestions(query),
                this.getDuckDuckGoSuggestions(query),
                Promise.resolve(this.generateLocalSuggestions(text))
            ]);

        // Combine all suggestions
        const allSuggestions: KeywordSuggestion[] = [];

        if (googleSuggestions.status === 'fulfilled') {
            allSuggestions.push(...googleSuggestions.value);
        }
        if (bingSuggestions.status === 'fulfilled') {
            allSuggestions.push(...bingSuggestions.value);
        }
        if (duckduckgoSuggestions.status === 'fulfilled') {
            allSuggestions.push(...duckduckgoSuggestions.value);
        }
        if (localSuggestions.status === 'fulfilled') {
            allSuggestions.push(...localSuggestions.value);
        }

        // Remove duplicates and existing keywords
        const uniqueSuggestions = allSuggestions
            .filter((suggestion, index, self) => 
                index === self.findIndex(s => s.keyword.toLowerCase() === suggestion.keyword.toLowerCase())
            )
            .filter(suggestion => 
                !existingKeywords.some(existing => 
                    existing.toLowerCase() === suggestion.keyword.toLowerCase()
                )
            )
            .filter(suggestion => suggestion.keyword.length > 1);

        // Sort by relevance (higher is better)
        uniqueSuggestions.sort((a, b) => b.relevance - a.relevance);

        // Return top suggestions
        return uniqueSuggestions.slice(0, this.maxSuggestions);
    }

    /**
     * Get domain-specific suggestions based on URL
     */
    public async getDomainSuggestions(url: string): Promise<KeywordSuggestion[]> {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            const domainParts = domain.split('.');
            const mainDomain = domainParts[0];

            // Common domain to keyword mappings
            const domainKeywords: Record<string, string[]> = {
                'github': ['development', 'code', 'version control', 'git', 'open source'],
                'stackoverflow': ['programming', 'development', 'coding', 'q&a', 'help'],
                'youtube': ['video', 'entertainment', 'tutorial', 'media', 'streaming'],
                'twitter': ['social media', 'networking', 'microblogging', 'news'],
                'linkedin': ['professional', 'networking', 'career', 'business'],
                'facebook': ['social media', 'networking', 'communication', 'social'],
                'instagram': ['social media', 'photos', 'visual', 'sharing'],
                'whatsapp': ['messaging', 'communication', 'chat', 'instant messaging'],
                'gmail': ['email', 'communication', 'mail', 'google'],
                'google': ['search', 'web', 'productivity', 'tools'],
                'microsoft': ['productivity', 'office', 'software', 'enterprise'],
                'apple': ['technology', 'devices', 'ecosystem', 'design'],
                'amazon': ['e-commerce', 'shopping', 'cloud', 'services'],
                'netflix': ['streaming', 'entertainment', 'video', 'movies'],
                'spotify': ['music', 'streaming', 'audio', 'entertainment'],
                'zoom': ['video conferencing', 'meetings', 'communication', 'remote work'],
                'slack': ['team communication', 'collaboration', 'workplace', 'chat'],
                'notion': ['productivity', 'notes', 'organization', 'workspace'],
                'figma': ['design', 'collaboration', 'ui/ux', 'prototyping'],
                'medium': ['blogging', 'writing', 'articles', 'publishing'],
                'reddit': ['community', 'discussion', 'social', 'forum'],
                'discord': ['gaming', 'community', 'voice chat', 'communication']
            };

            const keywords = domainKeywords[mainDomain] || [mainDomain];
            
            return keywords.map((keyword, index) => ({
                keyword,
                source: 'local' as const,
                relevance: 0.7 - (index * 0.1)
            }));

        } catch (error) {
            console.warn('Failed to generate domain suggestions:', error);
            return [];
        }
    }
}

export const keywordSuggestionService = new KeywordSuggestionService();
export default keywordSuggestionService;
