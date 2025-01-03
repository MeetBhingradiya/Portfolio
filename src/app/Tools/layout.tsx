import ToolNavigation from "@Components/ToolNavigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tools - Meet Bhingradiya",
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
export default async function ToolsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <ToolNavigation />
            {children}
        </>
    )
}