import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Password Generator - Meet Bhingradiya",
    description: "Generate secure passwords and passphrases with customizable options.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "Password",
        "Password Generator",
        "Passphrase Generator",
        "Secure Password"
    ]
}

// @ File
export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}