/**
 * /timeline — Server Component, ISR 12 hours
 * Merges Education + Experience + Certificates + TestScores into one
 * chronological timeline passed to the client TimelineView component.
 */

import type { Metadata } from "next";
import {
    cachedEducation,
    cachedExperience,
    cachedCertificates,
    cachedTestScores
} from "@Utils/portfolioCache";
import TimelineView from "@Components/Organisms/Timeline/TimelineView";

export const revalidate = 43200;

export const metadata: Metadata = {
    title: "Timeline | Meet Bhingradiya",
    description:
        "A chronological timeline of education, work experience, certifications and exam scores.",
    keywords: ["timeline", "career", "education", "experience", "portfolio"]
};

export default async function TimelinePage() {
    const [education, experience, certificates, testScores] = await Promise.all([
        cachedEducation().catch(() => []),
        cachedExperience().catch(() => []),
        cachedCertificates().catch(() => []),
        cachedTestScores().catch(() => [])
    ]);

    return (
        <TimelineView
            education={education}
            experience={experience}
            certificates={certificates}
            testScores={testScores}
        />
    );
}
