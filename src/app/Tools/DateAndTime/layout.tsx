import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Date & Time Utility - Meet Bhingradiya",
    description:
        "Powerful date and time tools for conversion, calculation, and formatting",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Date",
        "Time",
        "Converter",
        "Calculator",
        "UTC",
        "Timestamp",
        "Age Calculator",
        "Time Zones"
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
