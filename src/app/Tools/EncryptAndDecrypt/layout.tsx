import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Encrypt & Decrypt - Meet Bhingradiya",
    description:
        "Encrypt and decrypt text using various cryptographic algorithms like AES, DES, TripleDES, Rabbit, and RC4",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Encrypt",
        "Decrypt",
        "Encryption",
        "Decryption",
        "AES",
        "DES",
        "TripleDES",
        "Rabbit",
        "RC4",
        "Cryptography",
        "Security"
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
