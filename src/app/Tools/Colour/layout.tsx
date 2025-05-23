import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Colour Converter & Picker - Meet Bhingradiya",
    description: "Convert colours between different formats with a visual colour picker and real-time previews.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Colour",
        "Color",
        "Converter",
        "Picker",
        "RGB",
        "HEX",
        "HSL",
        "Alpha"
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
