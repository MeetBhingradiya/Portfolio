import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Colour Studio — Picker & Converter | Meet Bhingradiya Tools",
    description:
        "Free online colour tool. Pick and convert colours between HSL, HEX, RGB and CMYK. Generate harmonic colour palettes, complementary, triadic, analogous and more.",
    keywords: [
        "colour picker online",
        "color picker tool",
        "HSL to HEX converter",
        "RGB to HEX converter",
        "CMYK colour converter",
        "colour palette generator",
        "harmonic colour palette",
        "complementary colours",
        "triadic colour scheme",
        "online colour tool",
        "web colour picker"
    ],
    alternates: { canonical: `${Config.Origin}/tools/colour` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/colour`,
        title: "Colour Studio — Picker & Converter | Meet Bhingradiya Tools",
        description: "Pick colours, convert HSL/HEX/RGB/CMYK and generate harmonic palettes online.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Colour Studio Tool"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Colour Studio — Picker & Converter | Meet Bhingradiya Tools",
        description: "Colour picker, converter and palette generator — free online.",
        images: ["/assets/og-image.png"]
    }
};

export default function ColourLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
