import { Metadata } from "next";

export const metadata: Metadata = {
    title: "JWT Debugger - Meet Bhingradiya",
    description: "Decode, verify and debug JSON Web Tokens (JWT) securely in your browser.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "JWT",
        "JSON Web Token",
        "JWT Debugger",
        "JWT Decoder",
        "Token Verification"
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
