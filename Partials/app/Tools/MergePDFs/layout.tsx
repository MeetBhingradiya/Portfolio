import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Merge PDFs | Combine Multiple PDF Files Online",
    description:
        "Merge multiple PDF files into a single document. Supports batch processing with drag-and-drop reordering. Free online PDF merger tool.",
    keywords:
        "merge pdf, combine pdf, pdf merger, join pdf files, pdf tools, online pdf merger, batch pdf processing",
    openGraph: {
        title: "Merge PDFs | Combine Multiple PDF Files Online",
        description:
            "Merge multiple PDF files into a single document. Supports batch processing with drag-and-drop reordering.",
        type: "website"
    },
    twitter: {
        card: "summary_large_image",
        title: "Merge PDFs | Combine Multiple PDF Files Online",
        description:
            "Merge multiple PDF files into a single document. Supports batch processing with drag-and-drop reordering."
    }
};

export default function MergePDFsLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return children;
}
