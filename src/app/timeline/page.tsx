/**
 * /timeline — Server Component, ISR 12 hours
 * Merges Education + Experience + Certificates + TestScores into one
 * chronological timeline passed to the client TimelineView component.
 */

import type { Metadata } from "next";
import { Config } from "@Config/Client";
import {
    cachedEducation,
    cachedExperience,
    cachedCertificates,
    cachedTestScores
} from "@Utils/portfolioCache";
import TimelineView from "@Components/Organisms/Timeline/TimelineView";

export const revalidate = 43200;

export const metadata: Metadata = {
    title: "Career Timeline | Meet Bhingradiya",
    description:
        "Chronological career timeline of Meet Bhingradiya — education, work experience, certifications and exam scores from a Full Stack Developer based in Surat, India.",
    keywords: [
        "Meet Bhingradiya timeline",
        "career timeline",
        "education history",
        "work experience timeline",
        "certifications",
        "developer career path",
        "software engineer history",
        "portfolio timeline",
        "Surat developer career"
    ],
    alternates: { canonical: `${Config.Origin}/timeline` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/timeline`,
        title: "Career Timeline | Meet Bhingradiya",
        description:
            "Chronological timeline of education, work experience, certificates and exam scores.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Meet Bhingradiya Career Timeline" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "Career Timeline | Meet Bhingradiya",
        description: "Education, work experience, certifications and exam scores timeline.",
        images: ["/assets/og-image.png"]
    }
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
