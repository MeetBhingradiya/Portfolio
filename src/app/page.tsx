/**
 * Home Page — Server Component
 * ISR: revalidates every 12 hours (43200 seconds)
 * MongoDB data is fetched server-side and cached via unstable_cache
 */

import React from "react";
import { unstable_cache } from "next/cache";

import HeroSection from "@Components/Organisms/Home/Hero";
import ContactSection from "@Components/Organisms/Home/Contact";
import PortfolioShowcase from "@Components/Organisms/Home/PortfolioShowcase";
import dbConnect from "@Utils/dbConnect";
import { Project_Model, Skill_Model, Experience_Model } from "@Models/Portfolio";

// Vercel ISR — page is statically generated and revalidated every 12 hours.
export const revalidate = 43200;

// ---------------------------------------------------------------------------
// Cached DB fetchers — results are memoised at the React-cache layer and
// also participate in the ISR static generation cycle.
// ---------------------------------------------------------------------------

const getFeaturedProjects = unstable_cache(
    async () => {
        await dbConnect();
        const Model = Project_Model();
        const docs = await Model.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(6)
            .select("ProjectID Title Description Type TechStack LiveURL GitHubURL Image Featured")
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["featured-projects"],
    { revalidate: 43200, tags: ["projects"] }
);

const getAllSkills = unstable_cache(
    async () => {
        await dbConnect();
        const Model = Skill_Model();
        const docs = await Model.find({ isDeleted: false })
            .sort({ Level: -1 })
            .select("SkillID Name Category Level")
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["all-skills"],
    { revalidate: 43200, tags: ["skills"] }
);

const getExperiences = unstable_cache(
    async () => {
        await dbConnect();
        const Model = Experience_Model();
        const docs = await Model.find({ isDeleted: false })
            .sort({ StartDate: -1 })
            .limit(4)
            .select("ExperienceID Company Role StartDate EndDate Current Description")
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["experiences"],
    { revalidate: 43200, tags: ["experience"] }
);

// ---------------------------------------------------------------------------

export default async function HomePage() {
    // Parallel DB fetches — all three run simultaneously, cached independently
    const [projects, skills, experiences] = await Promise.all([
        getFeaturedProjects().catch(() => []),
        getAllSkills().catch(() => []),
        getExperiences().catch(() => [])
    ]);

    return (
        <div className="min-h-screen">
            <HeroSection />
            <PortfolioShowcase
                projects={projects}
                skills={skills}
                experiences={experiences}
            />
            <ContactSection />
        </div>
    );
}
