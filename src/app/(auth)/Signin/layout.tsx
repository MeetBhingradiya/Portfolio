import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Login - Meet Bhingradiya",
    description: "Login to Account",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Login",
        "Account",
    ]
}

// @ File
export default function signinLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}