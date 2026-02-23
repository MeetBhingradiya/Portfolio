import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Universal Video Downloader - Meet Bhingradiya",
    description: "Extract video information from YouTube, Instagram, TikTok, and more. Analyze video metadata with customizable download limits.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Video Downloader",
        "YouTube Downloader",
        "Instagram Downloader",
        "TikTok Downloader",
        "Video Extractor",
        "Video Info"
    ]
};

// @ File
export default function VideoDownloaderLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
