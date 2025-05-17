import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Signup - Meet Bhingradiya",
    description: "Create a New Account",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Signup",
        "Account",
        "Register",
        "Create Account",
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