import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "QR Code Generator | Meet Bhingradiya Tools",
    description:
        "Free online QR Code generator. Create QR codes for URLs, WiFi, UPI payments, vCard contacts, email, phone and plain text. Supports gradients, logos and custom styles.",
    keywords: [
        "QR code generator",
        "free QR generator online",
        "WiFi QR code",
        "UPI QR code",
        "vCard QR code",
        "custom QR code design",
        "QR with logo",
        "QR code maker",
        "online QR tool",
        "developer QR generator"
    ],
    alternates: { canonical: `${Config.Origin}/tools/qr` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/qr`,
        title: "QR Code Generator | Meet Bhingradiya Tools",
        description: "Generate custom QR codes for URLs, WiFi, UPI, vCard, email and more — free and client-side.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "QR Code Generator"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "QR Code Generator | Meet Bhingradiya Tools",
        description: "Generate custom QR codes for URLs, WiFi, UPI, vCard and more — free.",
        images: ["/assets/og-image.png"]
    }
};

export default function QRLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
