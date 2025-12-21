import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF to Image Converter | Convert PDF Pages to Images Online",
    description:
        "Convert PDF pages to high-quality images (PNG, JPEG, WebP). Extract individual pages or convert entire PDF documents to image files.",
    keywords:
        "pdf to image, pdf to png, pdf to jpeg, pdf converter, extract pdf pages, pdf to webp, online pdf tools",
    openGraph: {
        title: "PDF to Image Converter | Convert PDF Pages to Images Online",
        description:
            "Convert PDF pages to high-quality images (PNG, JPEG, WebP). Extract individual pages or convert entire PDF documents.",
        type: "website"
    },
    twitter: {
        card: "summary_large_image",
        title: "PDF to Image Converter | Convert PDF Pages to Images Online",
        description:
            "Convert PDF pages to high-quality images (PNG, JPEG, WebP). Extract individual pages or convert entire PDF documents."
    }
};

export default function PDFToImageLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return children;
}
