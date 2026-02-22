/**
 * /experience — Server Component, ISR 12 hours
 * Shows full work experience, skills, education and certifications.
 */

import type { Metadata } from "next";
import {
    cachedExperience,
    cachedSkills,
    cachedEducation,
    cachedCertificates
} from "@Utils/portfolioCache";
import ExperienceView from "@Components/Organisms/Experience/ExperienceView";

export const revalidate = 43200;

export const metadata: Metadata = {
    title: "Experience | Meet Bhingradiya",
    description:
        "Full work experience, skills, education and certifications of Meet Bhingradiya.",
    keywords: [
        "experience",
        "work history",
        "skills",
        "certificates",
        "software engineer",
        "portfolio"
    ]
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
