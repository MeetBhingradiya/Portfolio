import { Metadata } from "next";

export const metadata: Metadata = {
    title: "404 - Meet Bhingradiya",
    description: "Path not Found",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
    ]
}

// @ File
export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}