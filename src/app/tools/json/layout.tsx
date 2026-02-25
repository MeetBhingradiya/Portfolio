import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "JSON ↔ JS Object Converter | Meet Bhingradiya Tools",
    description:
        "Free online JSON formatter and JavaScript Object converter. Bidirectional JSON ↔ JS Object conversion with Monaco editor, format, minify and syntax validation.",
    keywords: [
        "JSON formatter",
        "JSON to JavaScript object",
        "JS object to JSON",
        "JSON beautifier",
        "JSON minifier",
        "JSON validator",
        "JSON converter online",
        "Monaco editor JSON",
        "JSON pretty print",
        "online JSON tool",
        "developer JSON formatter"
    ],
    alternates: { canonical: `${Config.Origin}/tools/json` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/json`,
        title: "JSON ↔ JS Object Converter | Meet Bhingradiya Tools",
        description: "Format, minify and convert JSON ↔ JavaScript Objects with Monaco editor.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "JSON Formatter Tool" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "JSON ↔ JS Object Converter | Meet Bhingradiya Tools",
        description: "Format, minify and convert between JSON and JavaScript Objects online.",
        images: ["/assets/og-image.png"]
    }
};

export default function JSONLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
