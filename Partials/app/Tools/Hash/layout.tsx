import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hash Generator - Meet Bhingradiya",
    description:
        "Generate hash values for text using various cryptographic algorithms like MD5, SHA-1, SHA-256, SHA-512, SHA-3, and RIPEMD-160",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Hash",
        "Generator",
        "MD5",
        "SHA-1",
        "SHA-256",
        "SHA-512",
        "SHA-3",
        "RIPEMD-160",
        "Cryptography",
        "Security",
        "Checksum",
        "Digest"
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
