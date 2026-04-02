import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "PDF Tools — Merge & Split | Meet Bhingradiya Tools",
    description:
        "Free online PDF tools. Merge multiple PDFs into one, split and extract pages from PDFs — all client-side using pdf-lib. No file uploads or server needed.",
    keywords: [
        "PDF merger online",
        "merge PDF files",
        "PDF splitter online",
        "split PDF pages",
        "extract PDF pages",
        "combine PDFs",
        "PDF tools free",
        "client-side PDF tool",
        "pdf-lib tool",
        "online PDF editor free"
    ],
    alternates: { canonical: `${Config.Origin}/tools/pdf` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/pdf`,
        title: "PDF Tools — Merge & Split | Meet Bhingradiya Tools",
        description: "Merge and split PDFs client-side — no uploads, no servers, completely free.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "PDF Tools"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "PDF Tools — Merge & Split | Meet Bhingradiya Tools",
        description: "Merge and split PDFs online — free client-side tool, no uploads needed.",
        images: ["/assets/og-image.png"]
    }
};

export default function PDFLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
