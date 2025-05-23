import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chrome Extenstion CRX Download - Meet Bhingradiya",
    description: "Download Chrome Extension CRX files with a single click",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "CRX",
        "Chrome",
        "Extension",
        "Download",
        "Download CRX with id"
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