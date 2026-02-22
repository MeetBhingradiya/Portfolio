/**
 * /projects — Server Component, ISR 12 hours
 * Fetches all projects from MongoDB (cached) and passes to the
 * interactive ProjectsGallery client component.
 */

import type { Metadata } from "next";
import { cachedProjects } from "@Utils/portfolioCache";
import ProjectsGallery from "@Components/Organisms/Projects/ProjectsGallery";

export const revalidate = 43200;

export const metadata: Metadata = {
    title: "Projects | Meet Bhingradiya",
    description:
        "Personal and open-source projects — websites, web apps, Chrome extensions, npm packages, Play Store apps, and more.",
    keywords: ["projects", "portfolio", "open source", "chrome extension", "npm", "webapp"]
};

export default async function ProjectsPage() {
    const projects = await cachedProjects().catch(() => []);
    return <ProjectsGallery projects={projects} />;
}
