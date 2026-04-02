import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Image Tools — Compress & Convert | Meet Bhingradiya Tools",
    description:
        "Free client-side image tools. Compress images to reduce file size without quality loss, and convert images to PDF — all in the browser with no file uploads.",
    keywords: [
        "image compressor online",
        "reduce image size",
        "compress image without quality loss",
        "image to PDF converter",
        "online image tool",
        "client-side image compression",
        "free image compressor",
        "JPEG PNG WebP compressor",
        "browser image compression",
        "image converter tool"
    ],
    alternates: { canonical: `${Config.Origin}/tools/image` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/image`,
        title: "Image Tools — Compress & Convert | Meet Bhingradiya Tools",
        description: "Compress images and convert to PDF client-side — no uploads needed.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Image Tools"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Image Tools — Compress & Convert | Meet Bhingradiya Tools",
        description: "Compress images or convert to PDF — free, fast and client-side.",
        images: ["/assets/og-image.png"]
    }
};

export default function ImageLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
