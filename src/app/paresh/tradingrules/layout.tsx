import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trading Rules | Paresh",
    description: "19 essential trading rules framework for consistent, disciplined, and profitable trading. Complete guide covering risk management, psychology, execution, and learning strategies.",
    keywords: [
        "trading rules",
        "trading discipline",
        "risk management",
        "trading psychology",
        "options trading",
        "trading journal",
        "trading framework",
        "profitable trading",
    ],
    alternates: {
        canonical: `https://meetbhingradiya.shop/paresh/tradingrules`,
    },
    robots: { index: true, follow: true },
    openGraph: {
        title: "Trading Rules | Complete 19-Rule Framework",
        description: "Essential trading rules for consistent, profitable, and disciplined trading. Master risk management, psychology, and execution.",
        type: "website",
        url: `https://meetbhingradiya.shop/paresh/tradingrules`,
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Trading Rules Framework" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Trading Rules Framework",
        description: "19 essential rules for profitable and disciplined trading",
    },
};

export default function PareshLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
