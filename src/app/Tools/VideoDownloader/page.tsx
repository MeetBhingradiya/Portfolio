"use client";

import React, { useState } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Input,
    Button,
    Chip,
    Divider,
    Select,
    SelectItem,
    Accordion,
    AccordionItem,
    Progress
} from "@heroui/react";
import {
    CloudDownload,
    VideoLibrary,
    CheckCircle,
    Error,
    Info,
    ContentCopy,
    Link as LinkIcon
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { Axios } from "@Utils/Axios";

interface VideoInfo {
    platform: string;
    title?: string;
    thumbnail?: string;
    duration?: number;
    url: string;
    isPlaylist: boolean;
    videoCount?: number;
    author?: string;
    videoUrl?: string;
    downloadUrl?: string;
    downloadEndpoint?: string; // New: Server-side download endpoint
    directDownloadAvailable?: boolean; // New: Flag for yt-dlp downloads
    formats?: Array<{
        quality: string;
        format: string;
        size?: string;
        url?: string;
        formatId?: string;
    }>;
    limits?: {
        maxDownloads: number;
        maxPlaylistSize: number;
    };
    note?: string;
}

const SUPPORTED_PLATFORMS = [
    { name: "YouTube", icon: "🎥", color: "danger" },
    { name: "Instagram", icon: "📷", color: "secondary" },
    { name: "TikTok", icon: "🎵", color: "primary" },
    { name: "Twitter/X", icon: "🐦", color: "default" },
    { name: "Facebook", icon: "👥", color: "primary" },
    { name: "Reddit", icon: "🤖", color: "warning" },
    { name: "Vimeo", icon: "🎬", color: "success" },
    { name: "Dailymotion", icon: "📺", color: "secondary" },
    { name: "Pinterest", icon: "📌", color: "danger" }
];

export default function VideoDownloaderPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState("best");
    const [tier, setTier] = useState("free");
    const [downloading, setDownloading] = useState(false);

    const handleAnalyze = async () => {
        if (!url.trim()) {
            toast.error("Please enter a valid URL");
            return;
        }

        setLoading(true);
        setError(null);
        setVideoInfo(null);

        try {
            const response = await Axios.post("/api/download/video", {
                url,
                tier
            });

            const data = response.data;
            
            // Handle the response structure
            const videoData = data.success ? data.data : data;
            
            console.log("Video Data Received:", videoData);
            console.log("Download Endpoint:", videoData.downloadEndpoint);
            console.log("Direct Download Available:", videoData.directDownloadAvailable);
            
            setVideoInfo(videoData);
            toast.success("Video analyzed successfully!");
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || "Failed to analyze video";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!videoInfo) return;

        setDownloading(true);

        try {
            // If we have a server-side download endpoint (yt-dlp)
            if (videoInfo.downloadEndpoint) {
                toast.info("Starting download... This may take a moment.");
                
                // Get the selected format if available
                const selectedFormatData = videoInfo.formats?.find(f => f.quality === selectedFormat);
                const formatId = selectedFormatData?.formatId;
                
                let downloadUrl = videoInfo.downloadEndpoint;
                if (formatId) {
                    downloadUrl += `&formatId=${formatId}`;
                }

                // Download using server endpoint
                const response = await fetch(downloadUrl);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new globalThis.Error(errorData.error || errorData.details || "Download failed. YouTube may be blocking the request.");
                }

                // Check if we got a JSON error response instead of video
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const errorData = await response.json();
                    throw new globalThis.Error(errorData.error || "Download failed");
                }

                // Get the blob
                const blob = await response.blob();
                
                // Check if blob is too small (likely an error)
                if (blob.size < 10000) { // Less than 10KB
                    throw new globalThis.Error("Downloaded file is too small. YouTube may be blocking the request. Please try again or use a different video.");
                }
                
                const blobUrl = window.URL.createObjectURL(blob);

                // Create download link
                const fileName =
                    videoInfo.title
                        ?.replace(/[&\/\\#,+()$~%.'":*?<>|{}\s]/g, "-")
                        .replace(/-*$/g, "")
                        .replace(/-+/g, "-") || "video";

                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `${fileName}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Clean up
                window.URL.revokeObjectURL(blobUrl);
                
                toast.success(`Download complete! ${(blob.size / 1024 / 1024).toFixed(2)} MB saved.`);
            }
            // If we have a direct video URL
            else if (videoInfo.downloadUrl || videoInfo.videoUrl) {
                const videoUrl = videoInfo.downloadUrl || videoInfo.videoUrl;
                const fileName =
                    videoInfo.title
                        ?.replace(/[&\/\\#,+()$~%.'":*?<>|{}\s]/g, "-")
                        .replace(/-*$/g, "")
                        .replace(/-+/g, "-") || "video";

                // Create download link
                const a = document.createElement("a");
                a.href = videoUrl!;
                a.download = `${fileName}.mp4`;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                toast.success("Download started! Check your downloads folder.");
            } else {
                // Open the original URL in a new tab
                window.open(videoInfo.url, "_blank");
                toast.info(
                    "Opened video URL. Use a browser extension or online tool to download."
                );
            }
        } catch (error: any) {
            console.error("Download error:", error);
            toast.error(error.message || "Failed to download video. YouTube may be blocking server-side downloads.");
        } finally {
            setDownloading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const getPlatformChipColor = (platform: string | undefined) => {
        if (!platform) return "default";
        
        const platformData = SUPPORTED_PLATFORMS.find(
            (p) => p.name.toLowerCase() === platform.toLowerCase()
        );
        return platformData?.color || "default";
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <VideoLibrary sx={{ fontSize: 48 }} className="text-primary" />
                    <h1 className="text-4xl font-bold">Universal Video Downloader</h1>
                </div>
                <p className="text-lg text-default-600">
                    Extract video information from multiple platforms
                </p>
            </div>

            {/* Supported Platforms */}
            <Card className="mb-6">
                <CardHeader>
                    <h3 className="text-xl font-semibold">Supported Platforms</h3>
                </CardHeader>
                <CardBody>
                    <div className="flex flex-wrap gap-2">
                        {SUPPORTED_PLATFORMS.map((platform) => (
                            <Chip
                                key={platform.name}
                                color={platform.color as any}
                                variant="flat"
                                startContent={<span className="text-lg">{platform.icon}</span>}
                            >
                                {platform.name}
                            </Chip>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Main Input Section */}
            <Card className="mb-6">
                <CardBody className="gap-4">
                    <div className="flex gap-4 flex-col md:flex-row">
                        <Input
                            type="url"
                            label="Video URL"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                            startContent={<LinkIcon />}
                            className="flex-1"
                            size="lg"
                        />
                        <Select
                            label="Account Tier"
                            selectedKeys={[tier]}
                            onChange={(e) => setTier(e.target.value)}
                            className="w-full md:w-48"
                            size="lg"
                        >
                            <SelectItem key="free">
                                Free (5 downloads)
                            </SelectItem>
                            <SelectItem key="premium">
                                Premium (50 downloads)
                            </SelectItem>
                        </Select>
                    </div>

                    <Button
                        color="primary"
                        size="lg"
                        onClick={handleAnalyze}
                        isLoading={loading}
                        startContent={!loading && <CloudDownload />}
                        className="w-full md:w-auto"
                    >
                        {loading ? "Analyzing..." : "Analyze Video"}
                    </Button>
                </CardBody>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="mb-6 border-2 border-danger">
                    <CardBody>
                        <div className="flex items-center gap-3 text-danger">
                            <Error />
                            <div>
                                <p className="font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Video Info Display */}
            {videoInfo && (
                <Card className="mb-6">
                    <CardHeader className="flex-col items-start gap-3">
                        <div className="flex items-center justify-between w-full">
                            <h3 className="text-2xl font-bold">{videoInfo.title}</h3>
                            <Chip
                                color={getPlatformChipColor(videoInfo.platform) as any}
                                variant="flat"
                                size="lg"
                            >
                                {videoInfo.platform.toUpperCase()}
                            </Chip>
                        </div>
                        {videoInfo.author && (
                            <Chip color="default" variant="flat" startContent="👤">
                                {videoInfo.author}
                            </Chip>
                        )}
                        {videoInfo.isPlaylist && (
                            <Chip color="warning" variant="flat" startContent="📺">
                                Playlist {videoInfo.videoCount && `(${videoInfo.videoCount} videos)`}
                            </Chip>
                        )}
                        {(videoInfo.downloadEndpoint || videoInfo.directDownloadAvailable) && (
                            <Chip color="success" variant="flat" startContent="✓">
                                Server-Side Download (YouTube)
                            </Chip>
                        )}
                        {videoInfo.downloadUrl && !videoInfo.downloadEndpoint && (
                            <Chip color="success" variant="flat" startContent="✓">
                                Direct URL Available
                            </Chip>
                        )}
                    </CardHeader>

                    <Divider />

                    <CardBody className="gap-4">
                        {/* Thumbnail */}
                        {videoInfo.thumbnail && (
                            <div className="rounded-lg overflow-hidden">
                                <img
                                    src={videoInfo.thumbnail}
                                    alt={videoInfo.title}
                                    className="w-full h-auto max-h-96 object-cover"
                                />
                            </div>
                        )}

                        {/* Video URL */}
                        <div className="flex items-center gap-2">
                            <Input
                                label="Video URL"
                                value={videoInfo.url}
                                readOnly
                                className="flex-1"
                            />
                            <Button
                                isIconOnly
                                variant="flat"
                                onClick={() => copyToClipboard(videoInfo.url)}
                            >
                                <ContentCopy />
                            </Button>
                        </div>

                        {/* Available Formats */}
                        {videoInfo.formats && videoInfo.formats.length > 0 && (
                            <div>
                                <p className="font-semibold mb-2">Available Formats:</p>
                                <div className="flex flex-wrap gap-2">
                                    {videoInfo.formats.map((format, idx) => (
                                        <Chip
                                            key={idx}
                                            variant="bordered"
                                            onClick={() => setSelectedFormat(format.quality)}
                                            className="cursor-pointer"
                                            color={
                                                selectedFormat === format.quality
                                                    ? "primary"
                                                    : "default"
                                            }
                                        >
                                            {format.quality} ({format.format})
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Limits Info */}
                        {videoInfo.limits && (
                            <div className="bg-default-100 p-4 rounded-lg">
                                <p className="font-semibold mb-2">Your Download Limits:</p>
                                <div className="space-y-2">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Daily Downloads</span>
                                            <span>0 / {videoInfo.limits.maxDownloads}</span>
                                        </div>
                                        <Progress
                                            value={0}
                                            maxValue={videoInfo.limits.maxDownloads}
                                            color="primary"
                                            size="sm"
                                        />
                                    </div>
                                    {videoInfo.isPlaylist && (
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Max Playlist Size</span>
                                                <span>{videoInfo.limits.maxPlaylistSize} videos</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Important Note */}
                        {videoInfo.note && (
                            <div className="bg-warning-50 border-l-4 border-warning p-4 rounded">
                                <div className="flex items-start gap-3">
                                    <Info className="text-warning mt-1" />
                                    <div>
                                        <p className="font-semibold text-warning-700">Important Note</p>
                                        <p className="text-sm text-warning-700">{videoInfo.note}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 flex-wrap">
                            <Button
                                color="primary"
                                size="lg"
                                onClick={handleDownload}
                                isLoading={downloading}
                                startContent={!downloading && <CloudDownload />}
                            >
                                {downloading
                                    ? "Downloading..."
                                    : videoInfo.downloadEndpoint || videoInfo.downloadUrl || videoInfo.videoUrl
                                    ? "Download Video"
                                    : "Open Video URL"}
                            </Button>
                            {(videoInfo.downloadUrl || videoInfo.downloadEndpoint) && (
                                <Button
                                    color="secondary"
                                    variant="bordered"
                                    size="lg"
                                    onClick={() => window.open(videoInfo.url, "_blank")}
                                    startContent={<LinkIcon />}
                                >
                                    View on Platform
                                </Button>
                            )}
                            <Button
                                color="default"
                                variant="bordered"
                                size="lg"
                                onClick={() => {
                                    setVideoInfo(null);
                                    setUrl("");
                                    setError(null);
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* FAQ Section */}
            <Card>
                <CardHeader>
                    <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
                </CardHeader>
                <CardBody>
                    <Accordion>
                        <AccordionItem
                            key="1"
                            aria-label="Can I download videos directly?"
                            title="Can I download videos directly?"
                        >
                            <p className="text-sm text-default-600">
                                Yes! This tool provides direct server-side downloads for YouTube videos using ytdl-core.
                                For other platforms (Instagram, TikTok, Twitter/X, Reddit, Vimeo), we extract direct video URLs
                                when available. Just click "Download Video" and the file will be saved to your device.
                            </p>
                        </AccordionItem>

                        <AccordionItem
                            key="2"
                            aria-label="What are the download limits?"
                            title="What are the download limits?"
                        >
                            <p className="text-sm text-default-600">
                                Free tier users can analyze up to 5 videos per day, while Premium users get
                                50. Playlist limits are 10 videos (Free) and 100 videos (Premium).
                            </p>
                        </AccordionItem>

                        <AccordionItem
                            key="3"
                            aria-label="Which platforms support direct download?"
                            title="Which platforms support direct download?"
                        >
                            <p className="text-sm text-default-600">
                                <strong>Server-side downloads:</strong> YouTube (using ytdl-core)<br/>
                                <strong>Direct URL extraction:</strong> Instagram, TikTok, Twitter/X, Reddit, Vimeo<br/>
                                The video is processed on our server and transferred directly to your device.
                            </p>
                        </AccordionItem>

                        <AccordionItem
                            key="4"
                            aria-label="Is this legal?"
                            title="Is downloading videos legal?"
                        >
                            <p className="text-sm text-default-600">
                                Downloading videos may violate the terms of service of various platforms
                                and copyright laws. This tool is for educational purposes only. Always
                                respect copyright and only download content you have permission to use.
                            </p>
                        </AccordionItem>
                    </Accordion>
                </CardBody>
            </Card>
        </div>
    );
}
