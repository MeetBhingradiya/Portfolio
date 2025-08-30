import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Colour Palette Generator | Meet Bhingradiya",
    description: "Create and manage custom color palettes with advanced color tools. Generate harmonious color schemes, extract colors from images, and export palettes.",
    keywords: ["color palette", "color generator", "design tools", "color schemes", "palette creator"],
    robots: "index, follow",
    openGraph: {
        title: "Colour Palette Generator",
        description: "Create and manage custom color palettes with advanced color tools",
        type: "website",
    },
};

export default function ColourPaletteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            {children}
        </Suspense>
    );
}
