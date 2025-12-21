import React from "react";
import SitemapContent from "@Components/Organisms/Sitemap/Content";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sitemap | Meet Bhingradiya",
    description: "Complete sitemap of Meet Bhingradiya's portfolio website. Browse all pages, projects, tools, and resources.",
    keywords: ["sitemap", "navigation", "website structure", "portfolio pages"],
    openGraph: {
        title: "Sitemap | Meet Bhingradiya",
        description: "Complete sitemap of Meet Bhingradiya's portfolio website",
        type: "website"
    }
};

export default function SitemapPage() {
    return <SitemapContent />;
}
