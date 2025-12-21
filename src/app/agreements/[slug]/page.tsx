import React from "react";
import AgreementContent from "@/Components/Agreements/AgreementContent";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Generate metadata dynamically based on slug
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;

    const titles: Record<string, string> = {
        "covered-products-privacy": "Covered Products Privacy Policy",
        "covered-products-terms": "Covered Products Terms of Service",
        "security": "Product Security Policy"
    };

    const descriptions: Record<string, string> = {
        "covered-products-privacy": "Privacy policy for products and services covered under our database management system",
        "covered-products-terms": "Terms and conditions for using our covered products and services",
        "security": "Security policies and best practices for our product ecosystem"
    };

    return {
        title: titles[slug] || "Agreement | Meet Bhingradiya",
        description: descriptions[slug] || "Legal agreements and policies for our products and services",
        keywords: ["agreement", "legal", "policy", "terms", "privacy", "security"],
        openGraph: {
            title: titles[slug] || "Agreement",
            description: descriptions[slug] || "Legal agreements and policies",
            type: "website"
        }
    };
}

// Generate static params for known agreement slugs
export async function generateStaticParams() {
    return [
        { slug: "covered-products-privacy" },
        { slug: "covered-products-terms" },
        { slug: "security" }
    ];
}

export default async function AgreementPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const validSlugs = ["covered-products-privacy", "covered-products-terms", "security"];

    if (!validSlugs.includes(slug)) {
        notFound();
    }

    return <AgreementContent slug={slug} />;
}
