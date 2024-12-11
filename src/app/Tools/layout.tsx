import { Metadata } from "next";

export const metadata: Metadata = {
    title: "NewTab - Meet Bhingradiya",
    description: "Basic Chrome NewTab Page",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Newtab",
        "Chrome Newtab",
    ]
}

// @ File
export default function ToolsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}