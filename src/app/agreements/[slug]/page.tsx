import AgreementContent from "@/Components/Agreements/AgreementContent";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Config } from "@Config/Client";

const BASE_URL = Config.Origin;

// Generate metadata dynamically based on slug
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    const titles: Record<string, string> = {
        "privacy": "Privacy Policy | Meet Bhingradiya",
        "terms": "Terms of Service | Meet Bhingradiya",
        "covered-products-privacy": "Covered Products Privacy Policy | Meet Bhingradiya",
        "covered-products-terms": "Covered Products Terms of Service | Meet Bhingradiya",
        "security": "Product Security Policy | Meet Bhingradiya"
    };

    const descriptions: Record<string, string> = {
        "privacy": "Read the privacy policy of meetbhingradiya.in — how personal data is collected, stored and protected.",
        "terms": "Terms and conditions governing your use of meetbhingradiya.in and associated services.",
        "covered-products-privacy": "Privacy policy for products and services under Meet Bhingradiya's portfolio ecosystem.",
        "covered-products-terms": "Terms of service governing use of covered products in Meet Bhingradiya's ecosystem.",
        "security": "Security policies, responsible disclosure and best practices for Meet Bhingradiya's product ecosystem."
    };

    const keywords: Record<string, string[]> = {
        "privacy": ["privacy policy", "data protection", "GDPR", "personal data", "meetbhingradiya privacy"],
        "terms": ["terms of service", "terms and conditions", "usage policy", "meetbhingradiya terms"],
        "covered-products-privacy": ["privacy policy", "covered products", "data policy", "software privacy"],
        "covered-products-terms": ["terms of service", "covered products", "software terms", "service agreement"],
        "security": ["security policy", "vulnerability disclosure", "responsible disclosure", "product security"]
    };

    const canonicalSlug = `${BASE_URL}/agreements/${slug}`;

    return {
        title: titles[slug] || "Legal Agreement | Meet Bhingradiya",
        description: descriptions[slug] || "Legal agreements and policies for Meet Bhingradiya's products and services.",
        keywords: keywords[slug] || ["agreement", "legal", "policy", "terms", "privacy", "security"],
        alternates: { canonical: canonicalSlug },
        robots: { index: true, follow: true },
        openGraph: {
            title: titles[slug] || "Legal Agreement | Meet Bhingradiya",
            description: descriptions[slug] || "Legal agreements and policies.",
            type: "website",
            url: canonicalSlug,
            images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Meet Bhingradiya" }]
        },
        twitter: {
            card: "summary",
            title: titles[slug] || "Legal Agreement | Meet Bhingradiya",
            description: descriptions[slug] || "Legal agreements and policies."
        }
    };
}

// Generate static params for known agreement slugs
export async function generateStaticParams() {
    return [
        { slug: "privacy" },
        { slug: "terms" },
        { slug: "covered-products-privacy" },
        { slug: "covered-products-terms" },
        { slug: "security" }
    ];
}

export default async function AgreementPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const validSlugs = ["privacy", "terms", "covered-products-privacy", "covered-products-terms", "security"];

    if (!validSlugs.includes(slug)) {
        notFound();
    }

    return <AgreementContent slug={slug} />;
}
