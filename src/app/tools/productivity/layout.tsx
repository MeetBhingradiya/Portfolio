import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Productivity Hub | Meet Bhingradiya Tools",
    description:
        "Gamified task manager, habit tracker, goal planner and reminder system with AI assistance. Earn XP, build streaks and level up your productivity.",
    keywords: [
        "gamified todo",
        "habit tracker",
        "goal planner",
        "productivity app",
        "reminder system",
        "XP system",
        "streak tracker",
        "AI task creation",
        "OCR task entry",
        "productivity tools"
    ],
    alternates: { canonical: `${Config.Origin}/tools/productivity` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/productivity`,
        title: "Productivity Hub | Meet Bhingradiya Tools",
        description: "Gamified tasks, habits, goals and reminders — with AI assistance.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Productivity Hub" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "Productivity Hub | Meet Bhingradiya Tools",
        description: "Gamified productivity — earn XP by completing tasks and building habits.",
        images: ["/assets/og-image.png"]
    }
};

export default function ProductivityLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
