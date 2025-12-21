import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Image Compressor | Compress Images Online with Batch Processing",
    description:
        "Compress multiple images online with advanced batch processing. Supports up to 10 files with various formats including JPEG, PNG, WebP, TIFF. Reduce file size while maintaining quality.",
    keywords:
        "image compression, compress images, batch image processing, reduce file size, image optimizer, online image tools, jpeg compression, png compression",
    openGraph: {
        title: "Image Compressor | Compress Images Online with Batch Processing",
        description:
            "Compress multiple images online with advanced batch processing. Supports up to 10 files with various formats.",
        type: "website"
    },
    twitter: {
        card: "summary_large_image",
        title: "Image Compressor | Compress Images Online with Batch Processing",
        description:
            "Compress multiple images online with advanced batch processing. Supports up to 10 files with various formats."
    }
};

export default function ImageCompressLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return children;
}
