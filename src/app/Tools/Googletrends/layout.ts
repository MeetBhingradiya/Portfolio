import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Google Trends Querys for Bing - Meet Bhingradiya",
    description: "Copy Querys from Google Trends for Bing",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Google Trends",
        "Google Trends Querys",
        "Google Trends Bing",
        "Copy Google Trends Querys",
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