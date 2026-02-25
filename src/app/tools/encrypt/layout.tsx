import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Encrypt & Decrypt Text | Meet Bhingradiya Tools",
    description:
        "Free online text encryption and decryption tool. Supports AES, DES, TripleDES, Rabbit and RC4 algorithms via crypto-js — all client-side with no data sent to servers.",
    keywords: [
        "text encryption tool",
        "AES encryption online",
        "DES encryption",
        "TripleDES encryption",
        "online encrypt decrypt",
        "client-side encryption",
        "RC4 encryption",
        "Rabbit algorithm",
        "secure text encryption",
        "crypto-js tool",
        "encryption decryption tool"
    ],
    alternates: { canonical: `${Config.Origin}/tools/encrypt` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/encrypt`,
        title: "Encrypt & Decrypt Text | Meet Bhingradiya Tools",
        description: "Encrypt and decrypt text using AES, DES, TripleDES, Rabbit and RC4 — client-side.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "Encrypt Decrypt Tool" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "Encrypt & Decrypt Text | Meet Bhingradiya Tools",
        description: "AES, DES, TripleDES, Rabbit and RC4 encryption — free and client-side.",
        images: ["/assets/og-image.png"]
    }
};

export default function EncryptLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
