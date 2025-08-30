import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Case Changer | Meet Bhingradiya",
    description: "Convert text between different cases: camelCase, PascalCase, snake_case, kebab-case, UPPER_CASE, and more. Quick and easy text transformation tool.",
    keywords: ["case converter", "text transformation", "camelCase", "snake_case", "kebab-case", "text tools"],
    robots: "index, follow",
    openGraph: {
        title: "Case Changer - Text Case Converter",
        description: "Convert text between different cases: camelCase, snake_case, kebab-case, and more",
        type: "website",
    },
};

export default function CaseChangerLayout({
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
