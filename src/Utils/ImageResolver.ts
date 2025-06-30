"use client";

/**
 * Universal Bookmark Image Resolver
 * Supports dynamic variables in URLs for icons that change based on context
 */

export interface ImageResolverVariable {
    name: string;
    description: string;
    example: string;
    resolver: () => string;
}

export interface ImageResolverOptions {
    fallbackIcon?: string;
    cacheTimeout?: number;
    enableCache?: boolean;
}

class UniversalImageResolver {
    private cache: Map<string, { url: string; timestamp: number }> = new Map();
    private variables: Map<string, ImageResolverVariable> = new Map();
    private defaultOptions: ImageResolverOptions = {
        fallbackIcon: "https://img.icons8.com/fluency/48/bookmark-ribbon.png",
        cacheTimeout: 3600000, // 1 hour
        enableCache: true
    };

    constructor() {
        this.registerDefaultVariables();
    }

    /**
     * Register default variables
     */
    private registerDefaultVariables(): void {
        // Date variables
        this.registerVariable({
            name: "DATE_YYYY",
            description: "Current year (4 digits)",
            example: "2025",
            resolver: () => new Date().getFullYear().toString()
        });

        this.registerVariable({
            name: "DATE_MM",
            description: "Current month (01-12)",
            example: "06",
            resolver: () => (new Date().getMonth() + 1).toString().padStart(2, '0')
        });

        this.registerVariable({
            name: "DATE_DD",
            description: "Current day (01-31)",
            example: "30",
            resolver: () => new Date().getDate().toString().padStart(2, '0')
        });

        this.registerVariable({
            name: "DATE_ISO",
            description: "Current date in ISO format",
            example: "2025-06-30",
            resolver: () => new Date().toISOString().split('T')[0]
        });

        this.registerVariable({
            name: "DATE_UNIX",
            description: "Current Unix timestamp",
            example: "1719792000",
            resolver: () => Math.floor(Date.now() / 1000).toString()
        });

        // Time variables
        this.registerVariable({
            name: "TIME_HH",
            description: "Current hour (00-23)",
            example: "14",
            resolver: () => new Date().getHours().toString().padStart(2, '0')
        });

        this.registerVariable({
            name: "TIME_MM",
            description: "Current minute (00-59)",
            example: "30",
            resolver: () => new Date().getMinutes().toString().padStart(2, '0')
        });

        // Day variables
        this.registerVariable({
            name: "DAY_NAME",
            description: "Current day name",
            example: "Monday",
            resolver: () => new Date().toLocaleDateString('en-US', { weekday: 'long' })
        });

        this.registerVariable({
            name: "DAY_SHORT",
            description: "Current day short name",
            example: "Mon",
            resolver: () => new Date().toLocaleDateString('en-US', { weekday: 'short' })
        });

        this.registerVariable({
            name: "DAY_NUMBER",
            description: "Current day number (0=Sunday, 6=Saturday)",
            example: "1",
            resolver: () => new Date().getDay().toString()
        });

        // Month variables
        this.registerVariable({
            name: "MONTH_NAME",
            description: "Current month name",
            example: "June",
            resolver: () => new Date().toLocaleDateString('en-US', { month: 'long' })
        });

        this.registerVariable({
            name: "MONTH_SHORT",
            description: "Current month short name",
            example: "Jun",
            resolver: () => new Date().toLocaleDateString('en-US', { month: 'short' })
        });

        // Season variables
        this.registerVariable({
            name: "SEASON",
            description: "Current season",
            example: "Summer",
            resolver: () => {
                const month = new Date().getMonth();
                if (month >= 2 && month <= 4) return "Spring";
                if (month >= 5 && month <= 7) return "Summer";
                if (month >= 8 && month <= 10) return "Autumn";
                return "Winter";
            }
        });

        // Random variables
        this.registerVariable({
            name: "RANDOM_NUMBER",
            description: "Random number (1-100)",
            example: "42",
            resolver: () => Math.floor(Math.random() * 100 + 1).toString()
        });

        this.registerVariable({
            name: "RANDOM_COLOR",
            description: "Random hex color",
            example: "ff5733",
            resolver: () => Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        });

        // User agent variables
        this.registerVariable({
            name: "PLATFORM",
            description: "User platform",
            example: "Windows",
            resolver: () => {
                if (typeof navigator === "undefined") return "Unknown";
                const ua = navigator.userAgent;
                if (ua.includes("Win")) return "Windows";
                if (ua.includes("Mac")) return "macOS";
                if (ua.includes("Linux")) return "Linux";
                if (ua.includes("Android")) return "Android";
                if (ua.includes("iOS")) return "iOS";
                return "Unknown";
            }
        });

        this.registerVariable({
            name: "BROWSER",
            description: "User browser",
            example: "Chrome",
            resolver: () => {
                if (typeof navigator === "undefined") return "Unknown";
                const ua = navigator.userAgent;
                if (ua.includes("Chrome")) return "Chrome";
                if (ua.includes("Firefox")) return "Firefox";
                if (ua.includes("Safari")) return "Safari";
                if (ua.includes("Edge")) return "Edge";
                return "Unknown";
            }
        });

        // Weather variables (placeholder - would need API integration)
        this.registerVariable({
            name: "WEATHER_ICON",
            description: "Weather condition icon code",
            example: "sunny",
            resolver: () => {
                // This would integrate with a weather API
                // For now, return based on season and random factor
                const season = this.variables.get("SEASON")?.resolver() || "Summer";
                const conditions = season === "Winter" ? ["snow", "cloudy", "rain"] :
                                 season === "Summer" ? ["sunny", "partly-cloudy", "hot"] :
                                 ["rain", "cloudy", "sunny", "windy"];
                return conditions[Math.floor(Math.random() * conditions.length)];
            }
        });

        // Theme variables
        this.registerVariable({
            name: "THEME",
            description: "Current theme (light/dark)",
            example: "dark",
            resolver: () => {
                if (typeof window === "undefined") return "light";
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
        });
    }

    /**
     * Register a custom variable
     */
    registerVariable(variable: ImageResolverVariable): void {
        this.variables.set(variable.name, variable);
    }

    /**
     * Get all available variables
     */
    getAvailableVariables(): ImageResolverVariable[] {
        return Array.from(this.variables.values());
    }

    /**
     * Resolve variables in a URL template
     */
    resolveVariables(urlTemplate: string): string {
        let resolvedUrl = urlTemplate;

        // Replace variables in format ${VARIABLE_NAME}
        resolvedUrl = resolvedUrl.replace(/\$\{([^}]+)\}/g, (match, variableName) => {
            const variable = this.variables.get(variableName);
            if (variable) {
                try {
                    return variable.resolver();
                } catch (error) {
                    console.warn(`Failed to resolve variable ${variableName}:`, error);
                    return match; // Return original if resolution fails
                }
            }
            return match; // Return original if variable not found
        });

        // Also support legacy format @VARIABLE_NAME@ for backward compatibility
        resolvedUrl = resolvedUrl.replace(/@([^@]+)@/g, (match, variableName) => {
            const variable = this.variables.get(variableName);
            if (variable) {
                try {
                    return variable.resolver();
                } catch (error) {
                    console.warn(`Failed to resolve variable ${variableName}:`, error);
                    return match;
                }
            }
            return match;
        });

        return resolvedUrl;
    }

    /**
     * Resolve icon URL with caching support
     */
    async resolveIcon(
        urlTemplate: string, 
        options: ImageResolverOptions = {}
    ): Promise<string> {
        const opts = { ...this.defaultOptions, ...options };
        
        // Generate cache key
        const cacheKey = urlTemplate;
        
        // Check cache if enabled
        if (opts.enableCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey)!;
            const isExpired = Date.now() - cached.timestamp > (opts.cacheTimeout || 3600000);
            
            if (!isExpired) {
                return cached.url;
            } else {
                this.cache.delete(cacheKey);
            }
        }

        try {
            // Resolve variables
            const resolvedUrl = this.resolveVariables(urlTemplate);
            
            // Validate URL by attempting to fetch it
            const isValid = await this.validateImageUrl(resolvedUrl);
            
            const finalUrl = isValid ? resolvedUrl : (opts.fallbackIcon || this.defaultOptions.fallbackIcon!);
            
            // Cache the result
            if (opts.enableCache) {
                this.cache.set(cacheKey, {
                    url: finalUrl,
                    timestamp: Date.now()
                });
            }
            
            return finalUrl;
        } catch (error) {
            console.warn("Failed to resolve icon URL:", error);
            return opts.fallbackIcon || this.defaultOptions.fallbackIcon!;
        }
    }

    /**
     * Validate if an image URL is accessible
     */
    private async validateImageUrl(url: string): Promise<boolean> {
        try {
            // For client-side validation, we can use a simple Image object
            if (typeof window !== "undefined") {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = url;
                    
                    // Timeout after 5 seconds
                    setTimeout(() => resolve(false), 5000);
                });
            }
            
            // For server-side, we'd need to use fetch (with CORS considerations)
            return true; // Assume valid for now
        } catch (error) {
            return false;
        }
    }

    /**
     * Get preview of resolved URL without caching
     */
    previewResolvedUrl(urlTemplate: string): string {
        return this.resolveVariables(urlTemplate);
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create singleton instance
export const imageResolver = new UniversalImageResolver();

// Export common presets for popular services
export const ImageResolverPresets = {
    // Google Calendar - shows different icons based on date
    googleCalendar: "https://calendar.google.com/googlecalendar/images/favicons_2020q4/calendar_${DATE_DD}.ico",
    
    // Weather icons
    weatherIcon: "https://openweathermap.org/img/wn/${WEATHER_ICON}@2x.png",
    
    // Theme-aware icons
    themeAware: "https://img.icons8.com/fluency/48/${THEME}_mode.png",
    
    // Platform-specific icons
    platformIcon: "https://img.icons8.com/fluency/48/${PLATFORM}.png",
    
    // Seasonal icons
    seasonalIcon: "https://img.icons8.com/fluency/48/${SEASON}.png",
    
    // Daily changing avatar
    dailyAvatar: "https://robohash.org/${DATE_ISO}?size=64x64&set=set1",
    
    // Random pattern generator
    randomPattern: "https://picsum.photos/seed/${DATE_ISO}/64/64",
    
    // Day-specific icons
    dayOfWeekIcon: "https://img.icons8.com/fluency/48/${DAY_SHORT}.png",
    
    // Month-specific icons
    monthIcon: "https://img.icons8.com/fluency/48/${MONTH_SHORT}.png",
    
    // Time-based icons (different for AM/PM)
    timeBasedIcon: "https://img.icons8.com/fluency/48/${TIME_HH < 12 ? 'morning' : 'evening'}.png"
};

export default imageResolver;
