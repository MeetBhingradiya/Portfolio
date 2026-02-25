import { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Developer Tools | Meet Bhingradiya",
    description:
        "Free online developer tools by Meet Bhingradiya. QR code generator, UUID generator, JWT debugger, colour picker, password generator, text encryption, JSON formatter, PDF tools, Markdown editor, regex tester and more — all client-side.",
    keywords: [
        "developer tools online",
        "free online tools",
        "QR code generator",
        "UUID generator",
        "JWT debugger",
        "colour picker",
        "password generator",
        "encrypt decrypt text",
        "JSON formatter",
        "PDF merge split",
        "Markdown editor",
        "RegExp tester",
        "image compression tool",
        "todo list app",
        "client-side developer tools",
        "web developer toolkit",
        "free developer utilities"
    ],
    alternates: { canonical: `${Config.Origin}/tools` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools`,
        title: "Developer Tools | Meet Bhingradiya",
        description:
            "Free client-side developer tools — QR, UUID, JWT, JSON, PDF, Markdown, RegExp, colours, passwords and more.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Meet Bhingradiya Developer Tools"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Developer Tools | Meet Bhingradiya",
        description:
            "Free online tools — QR, UUID, JWT, JSON, PDF, Markdown, RegExp, colours, passwords and more.",
        images: ["/assets/og-image.png"]
    }
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
