import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "CDN API Access | meetbhingradiya.vercel.app",
    description: "Apply for external API access to the private GitHub CDN. Store and serve files through a secure, rate-limited API.",
    robots: { index: true, follow: true },
};

export default function DeveloperCDNLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
