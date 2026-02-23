import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "URL Builder | Meet Bhingradiya",
    description: "Build and parse URLs with query parameters. Create clean URLs, add query parameters, and decode URL components easily.",
    keywords: ["URL builder", "query parameters", "URL encoder", "URL decoder", "web development tools"],
    robots: "index, follow",
    openGraph: {
        title: "URL Builder - Create and Parse URLs",
        description: "Build and parse URLs with query parameters. Perfect for web developers.",
        type: "website",
    },
};

export default function URLBuilderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            {children}
        </Suspense>
    );
}
