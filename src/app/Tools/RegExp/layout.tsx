import { Metadata } from "next";

export const metadata: Metadata = {
    title: "RegExp Builder & Tester - Meet Bhingradiya",
    description: "Create, test, and manage regular expressions with instant string manipulation tools.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "RegExp",
        "Regular Expressions",
        "String Manipulation",
        "Text Tools",
        "RegExp Builder",
        "RegExp Tester"
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
