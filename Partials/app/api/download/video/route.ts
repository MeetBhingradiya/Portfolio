import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import ytdl from "@distube/ytdl-core";

interface VideoInfo {
    platform: string;
    title?: string;
    thumbnail?: string;
    duration?: number;
    url: string;
    isPlaylist: boolean;
    videoCount?: number;
    videoUrl?: string;
    author?: string;
    downloadEndpoint?: string;
    directDownloadAvailable?: boolean;
    formats?: Array<{
        quality: string;
        format: string;
        size?: string;
        url?: string;
        formatId?: string;
        bitrate?: number;
    }>;
}

// Platform detection patterns
const PLATFORM_PATTERNS = {
    youtube: [/youtube\.com/, /youtu\.be/, /youtube-nocookie\.com/],
    instagram: [/instagram\.com/, /instagr\.am/],
    pinterest: [/pinterest\.com/, /pin\.it/],
    tiktok: [/tiktok\.com/, /vm\.tiktok\.com/],
    twitter: [/twitter\.com/, /x\.com/, /t\.co/],
    facebook: [/facebook\.com/, /fb\.watch/],
    reddit: [/reddit\.com/, /redd\.it/],
    vimeo: [/vimeo\.com/],
    dailymotion: [/dailymotion\.com/, /dai\.ly/]
};

function detectPlatform(url: string): string {
    const urlLower = url.toLowerCase();
    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
        if (patterns.some((pattern) => pattern.test(urlLower))) {
            return platform;
        }
    }
    return "unknown";
}

function isPlaylist(url: string): boolean {
    return url.includes("list=") || url.includes("/playlist");
}

// Advanced video extraction using direct requests (server-side)
async function fetchWithProxy(url: string): Promise<any> {
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                Referer: url,
                "Cache-Control": "no-cache"
            },
            timeout: 15000,
            validateStatus: (status) => status < 500 // Accept any status code less than 500
        });
        
        // Check if response is HTML or JSON
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            return { data: response.data };
        } else if (contentType.includes('text/html')) {
            // Verify it's valid HTML and not an error page
            const html = response.data;
            if (typeof html === 'string' && html.includes('<!DOCTYPE') || html.includes('<html')) {
                return { data: html };
            }
        }
        
        return { data: response.data };
    } catch (error: any) {
        console.error("Fetch error:", error.message);
        throw new Error(`Failed to fetch URL: ${error.message}`);
    }
}

// Extract Instagram video information
async function extractInstagramVideo(url: string): Promise<VideoInfo> {
    try {
        const response = await fetchWithProxy(url);
        const html = response.data;
        
        // Validate HTML response
        if (typeof html !== 'string') {
            throw new Error('Invalid response format');
        }

        // Try to find the og:video meta tag
        const videoUrlMatch = html.match(
            /<meta property="og:video" content="([^"]+)"/
        );
        const titleMatch = html.match(
            /<meta property="og:title" content="([^"]+)"/
        );
        const thumbnailMatch = html.match(
            /<meta property="og:image" content="([^"]+)"/
        );

        // Try to extract from JSON-LD
        const jsonLdMatch = html.match(
            /<script type="application\/ld\+json">({[\s\S]*?})<\/script>/
        );
        let videoUrl = videoUrlMatch ? videoUrlMatch[1] : undefined;
        let thumbnail = thumbnailMatch ? thumbnailMatch[1] : undefined;

        if (jsonLdMatch) {
            try {
                const jsonData = JSON.parse(jsonLdMatch[1]);
                if (jsonData.video && jsonData.video.contentUrl) {
                    videoUrl = jsonData.video.contentUrl;
                }
                if (jsonData.video && jsonData.video.thumbnailUrl) {
                    thumbnail = jsonData.video.thumbnailUrl;
                }
            } catch (e) {
                console.error("Error parsing JSON-LD:", e);
            }
        }

        return {
            platform: "instagram",
            url,
            isPlaylist: false,
            title: titleMatch ? titleMatch[1] : "Instagram Video",
            thumbnail,
            videoUrl,
            formats: videoUrl
                ? [{ quality: "best", format: "mp4", url: videoUrl }]
                : [{ quality: "best", format: "mp4" }]
        };
    } catch (error: any) {
        console.error("Instagram extraction error:", error.message);
        // Return basic info even if extraction fails
        return {
            platform: "instagram",
            url,
            isPlaylist: false,
            title: "Instagram Video",
            formats: [{ quality: "best", format: "mp4" }]
        };
    }
}

// Extract TikTok video information
async function extractTikTokVideo(url: string): Promise<VideoInfo> {
    try {
        const response = await fetchWithProxy(url);
        const html = response.data;

        // Extract from meta tags
        const titleMatch = html.match(
            /<meta name="description" content="([^"]+)"/
        );
        const thumbnailMatch = html.match(
            /<meta property="og:image" content="([^"]+)"/
        );
        const authorMatch = html.match(/@([^"'\s]+)/);

        // Try to find video URL in various script tags
        let videoUrl;
        const videoUrlPatterns = [
            /"downloadAddr":"([^"]+)"/,
            /"playAddr":"([^"]+)"/,
            /video_url.*?"([^"]+)"/
        ];

        for (const pattern of videoUrlPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                videoUrl = match[1].replace(/\\u002F/g, "/");
                break;
            }
        }

        return {
            platform: "tiktok",
            url,
            isPlaylist: false,
            title: titleMatch ? titleMatch[1].substring(0, 100) : "TikTok Video",
            author: authorMatch ? authorMatch[1] : undefined,
            thumbnail: thumbnailMatch ? thumbnailMatch[1] : undefined,
            videoUrl,
            formats: videoUrl
                ? [{ quality: "best", format: "mp4", url: videoUrl }]
                : [{ quality: "best", format: "mp4" }]
        };
    } catch (error) {
        console.error("TikTok extraction error:", error);
        return {
            platform: "tiktok",
            url,
            isPlaylist: false,
            title: "TikTok Video",
            formats: [{ quality: "best", format: "mp4" }]
        };
    }
}

// Extract Twitter/X video information
async function extractTwitterVideo(url: string): Promise<VideoInfo> {
    try {
        const response = await fetchWithProxy(url);
        const html = response.data;

        // Extract from meta tags
        const titleMatch = html.match(
            /<meta property="og:title" content="([^"]+)"/
        );
        const thumbnailMatch = html.match(
            /<meta property="og:image" content="([^"]+)"/
        );
        const descMatch = html.match(
            /<meta property="og:description" content="([^"]+)"/
        );

        // Try to find video URL
        const videoUrlMatch = html.match(
            /<meta property="og:video:url" content="([^"]+)"/
        );

        return {
            platform: "twitter",
            url,
            isPlaylist: false,
            title: titleMatch ? titleMatch[1] : "Twitter/X Video",
            thumbnail: thumbnailMatch ? thumbnailMatch[1] : undefined,
            videoUrl: videoUrlMatch ? videoUrlMatch[1] : undefined,
            formats: videoUrlMatch
                ? [{ quality: "best", format: "mp4", url: videoUrlMatch[1] }]
                : [{ quality: "best", format: "mp4" }]
        };
    } catch (error) {
        console.error("Twitter extraction error:", error);
        return {
            platform: "twitter",
            url,
            isPlaylist: false,
            title: "Twitter/X Video",
            formats: [{ quality: "best", format: "mp4" }]
        };
    }
}

// Extract Reddit video information
async function extractRedditVideo(url: string): Promise<VideoInfo> {
    try {
        // Convert URL to JSON format
        const jsonUrl = url.endsWith(".json") ? url : `${url}.json`;
        const response = await fetchWithProxy(jsonUrl);

        let data;
        if (typeof response.data === "string") {
            data = JSON.parse(response.data);
        } else {
            data = response.data;
        }

        const post = data[0]?.data?.children?.[0]?.data;

        if (!post) {
            throw new Error("Could not parse Reddit post data");
        }

        let videoUrl;
        let thumbnail = post.thumbnail;

        // Check for video in media
        if (post.media && post.media.reddit_video) {
            videoUrl = post.media.reddit_video.fallback_url;
        } else if (post.secure_media && post.secure_media.reddit_video) {
            videoUrl = post.secure_media.reddit_video.fallback_url;
        }

        return {
            platform: "reddit",
            url,
            isPlaylist: false,
            title: post.title || "Reddit Video",
            author: post.author,
            thumbnail: thumbnail && thumbnail !== "self" ? thumbnail : undefined,
            videoUrl,
            formats: videoUrl
                ? [{ quality: "best", format: "mp4", url: videoUrl }]
                : [{ quality: "best", format: "mp4" }]
        };
    } catch (error) {
        console.error("Reddit extraction error:", error);
        return {
            platform: "reddit",
            url,
            isPlaylist: false,
            title: "Reddit Video",
            formats: [{ quality: "best", format: "mp4" }]
        };
    }
}

// Extract Vimeo video information
async function extractVimeoVideo(url: string): Promise<VideoInfo> {
    try {
        // Extract Vimeo video ID
        const vimeoIdMatch = url.match(/vimeo\.com\/(\d+)/);
        if (!vimeoIdMatch) {
            throw new Error("Invalid Vimeo URL");
        }

        const videoId = vimeoIdMatch[1];
        const oEmbedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;

        const response = await axios.get(oEmbedUrl);
        const data = response.data;

        return {
            platform: "vimeo",
            url,
            isPlaylist: false,
            title: data.title || "Vimeo Video",
            author: data.author_name,
            thumbnail: data.thumbnail_url,
            duration: data.duration,
            formats: [
                { quality: "720p", format: "mp4" },
                { quality: "480p", format: "mp4" },
                { quality: "360p", format: "mp4" }
            ]
        };
    } catch (error) {
        console.error("Vimeo extraction error:", error);
        return {
            platform: "vimeo",
            url,
            isPlaylist: false,
            title: "Vimeo Video",
            formats: [{ quality: "best", format: "mp4" }]
        };
    }
}

// Use APIs where available to extract video information
async function extractVideoInfo(url: string): Promise<VideoInfo> {
    const platform = detectPlatform(url);
    const isPlaylistUrl = isPlaylist(url);

    // Route to platform-specific extractors
    switch (platform) {
        case "youtube":
            return extractYouTubeVideo(url, isPlaylistUrl);
        case "instagram":
            return extractInstagramVideo(url);
        case "tiktok":
            return extractTikTokVideo(url);
        case "twitter":
            return extractTwitterVideo(url);
        case "reddit":
            return extractRedditVideo(url);
        case "vimeo":
            return extractVimeoVideo(url);
        default:
            return extractGenericVideo(url, platform);
    }
}

// Extract YouTube video information using ytdl-core
async function extractYouTubeVideo(
    url: string,
    isPlaylistUrl: boolean
): Promise<VideoInfo> {
    try {
        const videoId = extractYouTubeVideoId(url);
        if (!videoId && !isPlaylistUrl) {
            throw new Error("Invalid YouTube URL");
        }

        if (isPlaylistUrl) {
            // For playlists, return basic info
            return {
                platform: "youtube",
                url,
                isPlaylist: true,
                title: "YouTube Playlist",
                thumbnail: "https://www.youtube.com/img/desktop/yt_1200.png"
            };
        }

        // Try using ytdl-core first
        try {
            console.log("Attempting to fetch YouTube video with ytdl-core:", url);
            const info = await ytdl.getInfo(url);
            const videoDetails = info.videoDetails;
            
            console.log("Successfully fetched video info:", videoDetails.title);
            
            // Get formats with both video and audio
            const formats = info.formats
                .filter((f: any) => f.hasVideo && f.hasAudio && f.container === "mp4")
                .map((f: any) => ({
                    quality: f.qualityLabel || `${f.height}p`,
                    format: f.container,
                    size: f.contentLength ? `${(parseInt(f.contentLength) / 1024 / 1024).toFixed(2)} MB` : undefined,
                    formatId: f.itag.toString(),
                    bitrate: f.bitrate
                }))
                .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
                .slice(0, 5);

            return {
                platform: "youtube",
                url,
                isPlaylist: false,
                title: videoDetails.title,
                author: videoDetails.author.name,
                thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url,
                duration: parseInt(videoDetails.lengthSeconds),
                formats: formats.length > 0 ? formats : [
                    { quality: "1080p", format: "mp4" },
                    { quality: "720p", format: "mp4" },
                    { quality: "480p", format: "mp4" },
                    { quality: "360p", format: "mp4" }
                ],
                directDownloadAvailable: true,
                downloadEndpoint: `/api/download/video/ytdlp/stream?url=${encodeURIComponent(url)}`
            };
        } catch (ytdlError: any) {
            console.error("ytdl-core failed, using oEmbed fallback:", ytdlError.message);
            
            // Fallback to oEmbed
            const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const response = await axios.get(oEmbedUrl);
            const data = response.data;

            return {
                platform: "youtube",
                url,
                isPlaylist: false,
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url,
                formats: [
                    { quality: "1080p", format: "mp4" },
                    { quality: "720p", format: "mp4" },
                    { quality: "480p", format: "mp4" },
                    { quality: "360p", format: "mp4" }
                ],
                directDownloadAvailable: true,
                downloadEndpoint: `/api/download/video/ytdlp/stream?url=${encodeURIComponent(url)}`
            };
        }
    } catch (error: any) {
        console.error("YouTube extraction error:", error);
        throw new Error(`Failed to extract YouTube video info: ${error.message}`);
    }
}

// Extract generic video information (fallback)
async function extractGenericVideo(
    url: string,
    platform: string
): Promise<VideoInfo> {
    try {
        const response = await fetchWithProxy(url);
        const html = response.data;

        // Extract basic meta tags
        const titleMatch = html.match(
            /<meta property="og:title" content="([^"]+)"/
        );
        const thumbnailMatch = html.match(
            /<meta property="og:image" content="([^"]+)"/
        );
        const videoUrlMatch = html.match(
            /<meta property="og:video" content="([^"]+)"/
        );

        return {
            platform,
            url,
            isPlaylist: false,
            title: titleMatch
                ? titleMatch[1]
                : `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
            thumbnail: thumbnailMatch ? thumbnailMatch[1] : undefined,
            videoUrl: videoUrlMatch ? videoUrlMatch[1] : undefined,
            formats: [{ quality: "best", format: "mp4" }]
        };
    } catch (error) {
        console.error(`${platform} extraction error:`, error);
        return {
            platform,
            url,
            isPlaylist: false,
            title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video`,
            formats: [{ quality: "best", format: "mp4" }]
        };
    }
}

function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, tier = "free" } = body;

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
        }

        const platform = detectPlatform(url);

        if (platform === "unknown") {
            return NextResponse.json(
                {
                    error:
                        "Unsupported platform. Supported platforms: YouTube, Instagram, TikTok, Twitter, Facebook, Reddit, Vimeo, Dailymotion, Pinterest"
                },
                { status: 400 }
            );
        }

        // Rate limiting based on tier
        const limits = {
            free: { maxDownloads: 5, maxPlaylistSize: 10 },
            premium: { maxDownloads: 50, maxPlaylistSize: 100 }
        };

        const userLimits = limits[tier as keyof typeof limits] || limits.free;

        // Extract video info
        const videoInfo = await extractVideoInfo(url);

        return NextResponse.json({
            success: true,
            data: {
                ...videoInfo,
                limits: userLimits,
                downloadUrl: videoInfo.videoUrl,
                note: videoInfo.downloadEndpoint
                    ? "Server-side download available. Click download to save the video."
                    : videoInfo.videoUrl
                    ? "Direct video URL available. Click download to save the video."
                    : "Download will be initiated from your browser. Server-side downloading is not supported for copyright and resource reasons."
            }
        });
    } catch (error) {
        console.error("Video info extraction error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to extract video information"
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Video Downloader API",
        method: "POST",
        supportedPlatforms: Object.keys(PLATFORM_PATTERNS),
        tiers: {
            free: { maxDownloads: 5, maxPlaylistSize: 10 },
            premium: { maxDownloads: 50, maxPlaylistSize: 100 }
        }
    });
}
