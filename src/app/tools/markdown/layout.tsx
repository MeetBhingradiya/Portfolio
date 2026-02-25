import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Markdown Preview Editor | Meet Bhingradiya Tools",
    description:
        "Free online Markdown editor and live preview. Write Markdown and see real-time HTML output. Export as HTML or .md file. Supports headings, code blocks, tables and more.",
    keywords: [
        "Markdown editor online",
        "Markdown preview",
        "Markdown to HTML",
        "live Markdown editor",
        "online Markdown tool",
        "GitHub Markdown preview",
        "Markdown renderer",
        "Markdown formatter",
        "free Markdown editor",
        "developer Markdown tool"
    ],
    alternates: { canonical: `${Config.Origin}/tools/markdown` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/markdown`,
        title: "Markdown Preview Editor | Meet Bhingradiya Tools",
        description: "Write Markdown and preview HTML in real time. Export as HTML or .md.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Markdown Editor" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "Markdown Preview Editor | Meet Bhingradiya Tools",
        description: "Live Markdown editor with real-time HTML preview — free online tool.",
        images: ["/assets/og-image.png"]
    }
};

export default function MarkdownLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
