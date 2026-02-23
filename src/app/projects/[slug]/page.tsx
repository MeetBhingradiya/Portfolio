/**
 * /projects/[slug] — Server Component, ISR 12 hours
 * Fetches a single project by slug and renders the type-specific
 * full-page detail layout.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cachedProjectBySlug, cachedProjects } from "@Utils/portfolioCache";
import ProjectDetail from "@Components/Organisms/Projects/ProjectDetail";

export const revalidate = 43200;

interface Props {
    params: Promise<{ slug: string }>;
}

/* Pre-generate routes for all known projects at build time */
export async function generateStaticParams() {
    const projects = await cachedProjects().catch(() => []);
    return projects.map((p: any) => ({ slug: p.Slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const project = await cachedProjectBySlug(slug);
    if (!project) return { title: "Project not found | Meet Bhingradiya" };
    return {
        title: `${project.Title} | Meet Bhingradiya`,
        description: project.Description,
        keywords: [
            project.Title,
            project.Type,
            ...(project.TechStack ?? []),
            ...(project.Tags ?? []),
            "Meet Bhingradiya",
            "portfolio"
        ]
    };
}

export default async function ProjectPage({ params }: Props) {
    const { slug } = await params;
    const project = await cachedProjectBySlug(slug);
    if (!project) notFound();
    return <ProjectDetail project={project} />;
}
