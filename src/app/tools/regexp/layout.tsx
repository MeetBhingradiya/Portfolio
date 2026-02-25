import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "RegExp Tester | Meet Bhingradiya Tools",
    description:
        "Free online regular expression tester. Test regex patterns in real time with flag toggles (g, i, m, s, u), capture group highlighting, preset patterns and find & replace.",
    keywords: [
        "regex tester online",
        "regular expression tester",
        "RegExp debugger",
        "regex validator",
        "regex pattern tester",
        "regex find and replace",
        "capture group regex",
        "online regex tool",
        "JavaScript regex tester",
        "regex JavaScript online",
        "free regex tester"
    ],
    alternates: { canonical: `${Config.Origin}/tools/regexp` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/regexp`,
        title: "RegExp Tester | Meet Bhingradiya Tools",
        description: "Test and debug regular expressions in real time with flag toggles and highlighting.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "RegExp Tester" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "RegExp Tester | Meet Bhingradiya Tools",
        description: "Real-time regex pattern tester with flags, highlighting and presets — free.",
        images: ["/assets/og-image.png"]
    }
};

export default function RegExpLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
