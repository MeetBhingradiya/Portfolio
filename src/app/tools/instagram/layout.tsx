import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Instagram Export Analyser | Meet Bhingradiya Tools",
    description:
        "Free client-side Instagram export analyser. Find out who doesn't follow you back, view your close friends list, check pending follow requests, see request history, recently unfollowed accounts and blocked profiles — all processed privately in your browser.",
    keywords: [
        "instagram unfollowers checker",
        "who doesn't follow me back instagram",
        "instagram export analyser",
        "instagram data export tool",
        "instagram close friends list",
        "instagram follow request history",
        "instagram blocked accounts",
        "instagram recently unfollowed",
        "instagram followers following analyser",
        "instagram JSON export parser",
        "client-side instagram tool",
        "free instagram analyser",
        "instagram data privacy tool",
        "check instagram unfollowers",
        "instagram connections export"
    ],
    alternates: { canonical: `${Config.Origin}/tools/instagram` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/instagram`,
        title: "Instagram Export Analyser | Meet Bhingradiya Tools",
        description:
            "Analyse your Instagram data export — unfollowers, close friends, pending requests and more. 100 % client-side, nothing is uploaded.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Instagram Export Analyser"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Instagram Export Analyser | Meet Bhingradiya Tools",
        description: "Find unfollowers, close friends, pending requests and more from your Instagram data export — free and private.",
        images: ["/assets/og-image.png"]
    }
};

export default function InstagramLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
