import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Markdown Preview - Meet Bhingradiya",
    description: "Preview and edit Markdown files with live rendering, syntax highlighting, and export options",
    icons: "/favicon.ico",
    keywords: [
        "Markdown",
        "Preview",
        "Editor",
        "Live Preview",
        "Syntax Highlighting",
        "Export",
        "HTML",
        "Tools",
        "Meet Bhingradiya"
    ]
}

export default function MarkdownLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children;
}
