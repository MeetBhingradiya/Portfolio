import React from "react";
import SitemapContent from "@Components/Organisms/Sitemap/Content";
import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Sitemap | Meet Bhingradiya",
    description:
        `Complete sitemap of ${new URL(Config.Origin).hostname}. Browse all pages including portfolio, projects, developer tools, blog, timeline, experience and legal agreements.`,
    keywords: [
        "sitemap",
        `${new URL(Config.Origin).hostname} sitemap`,
        "website navigation",
        "all pages",
        "portfolio pages",
        "site index"
    ],
    alternates: { canonical: `${Config.Origin}/sitemap` },
    robots: { index: true, follow: true },
    openGraph: {
        title: "Sitemap | Meet Bhingradiya",
        description:
            "Browse all pages — portfolio, projects, developer tools, blog, timeline and more.",
        type: "website",
        url: `${Config.Origin}/sitemap`,
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Meet Bhingradiya Sitemap" }]
    },
    twitter: {
        card: "summary",
        title: "Sitemap | Meet Bhingradiya",
        description: "Complete site index for meetbhingradiya.in."
    }
};

export default function SitemapPage() {
    return <SitemapContent />;
}
