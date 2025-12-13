/**
 * Video Downloader Utility Functions
 * Edge Runtime Compatible
 */

export const VIDEO_DOWNLOAD_LIMITS = {
    free: {
        maxDownloads: 5,
        maxPlaylistSize: 10,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        label: "Free"
    },
    premium: {
        maxDownloads: 50,
        maxPlaylistSize: 100,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        label: "Premium"
    }
} as const;

export type UserTier = keyof typeof VIDEO_DOWNLOAD_LIMITS;

export function getDownloadLimits(tier: UserTier = "free") {
    return VIDEO_DOWNLOAD_LIMITS[tier];
}

export function formatResetTime(resetTime: number): string {
    const now = Date.now();
    const diff = resetTime - now;

    if (diff <= 0) return "Now";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export const SUPPORTED_PLATFORMS = {
    youtube: {
        name: "YouTube",
        icon: "🎥",
        patterns: [/youtube\.com/, /youtu\.be/, /youtube-nocookie\.com/],
        supportsPlaylists: true
    },
    instagram: {
        name: "Instagram",
        icon: "📷",
        patterns: [/instagram\.com/, /instagr\.am/],
        supportsPlaylists: false
    },
    pinterest: {
        name: "Pinterest",
        icon: "📌",
        patterns: [/pinterest\.com/, /pin\.it/],
        supportsPlaylists: false
    },
    tiktok: {
        name: "TikTok",
        icon: "🎵",
        patterns: [/tiktok\.com/, /vm\.tiktok\.com/],
        supportsPlaylists: false
    },
    twitter: {
        name: "Twitter/X",
        icon: "🐦",
        patterns: [/twitter\.com/, /x\.com/, /t\.co/],
        supportsPlaylists: false
    },
    facebook: {
        name: "Facebook",
        icon: "👥",
        patterns: [/facebook\.com/, /fb\.watch/],
        supportsPlaylists: false
    },
    reddit: {
        name: "Reddit",
        icon: "🤖",
        patterns: [/reddit\.com/, /redd\.it/],
        supportsPlaylists: false
    },
    vimeo: {
        name: "Vimeo",
        icon: "🎬",
        patterns: [/vimeo\.com/],
        supportsPlaylists: false
    },
    dailymotion: {
        name: "Dailymotion",
        icon: "📺",
        patterns: [/dailymotion\.com/, /dai\.ly/],
        supportsPlaylists: false
    }
} as const;

export type PlatformName = keyof typeof SUPPORTED_PLATFORMS;

export function detectPlatform(url: string): PlatformName | "unknown" {
    const urlLower = url.toLowerCase();
    for (const [platform, config] of Object.entries(SUPPORTED_PLATFORMS)) {
        if (config.patterns.some((pattern) => pattern.test(urlLower))) {
            return platform as PlatformName;
        }
    }
    return "unknown";
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function getPlatformInfo(platform: PlatformName | "unknown") {
    if (platform === "unknown") {
        return {
            name: "Unknown",
            icon: "❓",
            supportsPlaylists: false
        };
    }
    return SUPPORTED_PLATFORMS[platform];
}
