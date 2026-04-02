import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Contact | Meet Bhingradiya",
    description:
        "Get in touch with Meet Bhingradiya — Full Stack Developer available for freelance projects, collaborations, job opportunities and open-source contributions.",
    keywords: [
        "contact Meet Bhingradiya",
        "hire Full Stack Developer",
        "freelance developer India",
        "hire React developer",
        "hire Next.js developer",
        "web developer for hire Surat",
        "software engineer contact",
        "developer collaboration",
        "open source contribution"
    ],
    alternates: { canonical: `${Config.Origin}/contact` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/contact`,
        title: "Contact | Meet Bhingradiya",
        description: "Get in touch for freelance projects, collaborations or job opportunities.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Contact Meet Bhingradiya"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Contact | Meet Bhingradiya",
        description: "Reach out for freelance work, collaborations or opportunities.",
        images: ["/assets/og-image.png"]
    }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
