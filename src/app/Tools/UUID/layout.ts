import { Metadata } from "next";

export const metadata: Metadata = {
    title: "UUID Generator - Meet Bhingradiya",
    description: "Generate UUIDs with a single click",
    icons: "/favicon.ico",
    keywords: ["Meet Bhingradiya", "Meet", "Bhingradiya", "Portfolio", "Tools"]
};

// @ File
export default function ToolsLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
