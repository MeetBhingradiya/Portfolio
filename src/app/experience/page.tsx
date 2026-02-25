/**
 * /experience — Server Component, ISR 12 hours
 * Shows full work experience, skills, education and certifications.
 */

import type { Metadata } from "next";
import { Config } from "@Config/Client";
import {
    cachedExperience,
    cachedSkills,
    cachedEducation,
    cachedCertificates
} from "@Utils/portfolioCache";
import ExperienceView from "@Components/Organisms/Experience/ExperienceView";

export const revalidate = 43200;

export const metadata: Metadata = {
    title: "Experience & Skills | Meet Bhingradiya",
    description:
        "Full work experience, technical skills, education and professional certifications of Meet Bhingradiya — Full Stack Developer from Surat, Gujarat, India.",
    keywords: [
        "Meet Bhingradiya experience",
        "Full Stack Developer experience",
        "work history",
        "technical skills",
        "React skills",
        "Next.js skills",
        "TypeScript skills",
        "Node.js skills",
        "professional certifications",
        "software engineer portfolio",
        "developer skills list",
        "GitHub contributions"
    ],
    alternates: { canonical: `${Config.Origin}/experience` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/experience`,
        title: "Experience & Skills | Meet Bhingradiya",
        description:
            "Work experience, technical skills, education and certifications of Meet Bhingradiya.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Meet Bhingradiya Experience" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "Experience & Skills | Meet Bhingradiya",
        description: "Work experience, skills, education and certifications.",
        images: ["/assets/og-image.png"]
    }
};

export default async function ExperiencePage() {
    const [experience, skills, education, certificates] = await Promise.all([
        cachedExperience().catch(() => []),
        cachedSkills().catch(() => []),
        cachedEducation().catch(() => []),
        cachedCertificates().catch(() => [])
    ]);

    return (
        <ExperienceView
            experience={experience}
            skills={skills}
            education={education}
            certificates={certificates}
        />
    );
}
