import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "UUID Generator | Meet Bhingradiya Tools",
    description:
        "Free online UUID generator. Generate v1, v4 and v5 UUIDs (and NIL UUID) in bulk. Includes format options, UUID validation, version detection and generation history.",
    keywords: [
        "UUID generator",
        "UUID v4 generator",
        "UUID v1 generator",
        "UUID v5 generator",
        "NIL UUID",
        "random UUID online",
        "bulk UUID generator",
        "UUID validator",
        "GUID generator",
        "online UUID tool",
        "free UUID generator"
    ],
    alternates: { canonical: `${Config.Origin}/tools/uuid` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/uuid`,
        title: "UUID Generator | Meet Bhingradiya Tools",
        description: "Generate v1, v4, v5 and NIL UUIDs in bulk with format options — free online.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "UUID Generator" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "UUID Generator | Meet Bhingradiya Tools",
        description: "Generate and validate v1, v4, v5 and NIL UUIDs online — free.",
        images: ["/assets/og-image.png"]
    }
};

export default function UUIDLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
