import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Blog | Meet Bhingradiya",
    description:
        "Read articles and tutorials by Meet Bhingradiya — covering Full Stack development, React, Next.js, TypeScript, system design, DevOps and tech insights.",
    keywords: [
        "Meet Bhingradiya blog",
        "developer blog",
        "programming articles",
        "React tutorials",
        "Next.js tutorials",
        "TypeScript tutorials",
        "Full Stack development blog",
        "tech blog India",
        "software engineering articles",
        "web development tutorials",
        "JavaScript blog",
        "Node.js articles"
    ],
    alternates: { canonical: `${Config.Origin}/blogs` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/blogs`,
        title: "Blog | Meet Bhingradiya",
        description: "Articles and tutorials on Full Stack development, React, Next.js, TypeScript and more.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Meet Bhingradiya Blog"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Blog | Meet Bhingradiya",
        description: "Dev articles on React, Next.js, TypeScript, Node.js and more by Meet Bhingradiya.",
        images: ["/assets/og-image.png"]
    }
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
