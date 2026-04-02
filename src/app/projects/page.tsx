/**
 * /projects — Server Component, ISR 12 hours
 * Fetches all projects from MongoDB (cached) and passes to the
 * interactive ProjectsGallery client component.
 */

import type { Metadata } from "next";
import { Config } from "@Config/Client";
import { cachedProjects } from "@Utils/portfolioCache";
import ProjectsGallery from "@Components/Organisms/Projects/ProjectsGallery";

export const revalidate = 43200;

export const metadata: Metadata = {
    title: "Projects | Meet Bhingradiya",
    description:
        "Browse Meet Bhingradiya's personal and open-source projects — websites, web apps, Chrome extensions, npm packages, Play Store apps and more.",
    keywords: [
        "Meet Bhingradiya projects",
        "portfolio projects",
        "open source projects",
        "Chrome extension developer",
        "npm packages",
        "web apps",
        "Play Store apps",
        "React projects",
        "Next.js projects",
        "TypeScript projects",
        "GitHub projects",
        "software portfolio"
    ],
    alternates: { canonical: `${Config.Origin}/projects` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/projects`,
        title: "Projects | Meet Bhingradiya",
        description: "Personal and open-source projects — websites, web apps, Chrome extensions, npm packages and more.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Meet Bhingradiya Projects"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Projects | Meet Bhingradiya",
        description: "Personal and open-source projects portfolio.",
        images: ["/assets/og-image.png"]
    }
};

export default async function ProjectsPage() {
    const projects = await cachedProjects().catch(() => []);
    return <ProjectsGallery projects={projects} />;
}
