import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

interface DownloadRequest {
    url: string;
    quality?: string;
    format?: string;
}

// Get video info using ytdl-core
async function getVideoInfo(url: string): Promise<any> {
    try {
        const info = await ytdl.getInfo(url);
        return info;
    } catch (error: any) {
        throw new Error(`Failed to get video info: ${error.message}`);
    }
}

// Get video info endpoint
export async function POST(request: NextRequest) {
    try {
        const body: DownloadRequest = await request.json();
        const { url, quality = "highest", format = "mp4" } = body;

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Get video info using ytdl-core
        const info = await getVideoInfo(url);

        // Extract relevant information
        const videoDetails = info.videoDetails;
        const formats = info.formats
            .filter((f: any) => f.hasVideo && f.hasAudio && f.container === "mp4")
            .map((f: any) => ({
                quality: f.qualityLabel || `${f.height}p`,
                format: f.container,
                size: f.contentLength ? `${(parseInt(f.contentLength) / 1024 / 1024).toFixed(2)} MB` : undefined,
                formatId: f.itag,
                bitrate: f.bitrate
            }))
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
            .slice(0, 5);

        const videoInfo = {
            success: true,
            data: {
                platform: "youtube",
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url,
                duration: parseInt(videoDetails.lengthSeconds),
                url: url,
                isPlaylist: false,
                author: videoDetails.author.name,
                formats: formats,
                directDownloadAvailable: true,
                downloadEndpoint: `/api/download/video/ytdlp/stream?url=${encodeURIComponent(url)}&quality=${quality}`
            }
        };

        return NextResponse.json(videoInfo);
    } catch (error: any) {
        console.error("ytdl-core error:", error);
        return NextResponse.json(
            {
                error: error.message || "Failed to process video",
                details: "YouTube video download failed. Make sure the URL is valid and the video is publicly accessible."
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: "ytdl-core Video Downloader API",
        method: "POST",
        note: "This endpoint uses ytdl-core for YouTube video downloads",
        supportedPlatforms: ["YouTube"]
    });
}
