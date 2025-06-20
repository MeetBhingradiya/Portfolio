import { Metadata } from "next";

export const metadata: Metadata = {
    title: "JSObject : JSON Convert - Meet Bhingradiya",
    description: "Convert JSON to JS Object and JS Object to JSON.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "JSON",
        "JSObject",
        "JSON Convert",
        "JSObject Convert"
    ]
};

// @ File
export default function Layout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
