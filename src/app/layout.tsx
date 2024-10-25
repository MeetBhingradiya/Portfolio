import type { Metadata } from "next";
import "@Styles/globals.sass";
import { Inter } from "next/font/google";
import { NextUIProvider } from "@nextui-org/system";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
    title: "Meet Bhingradiya",
    description: "A Portfolio Website of Meet Bhingradiya",
    icons: "favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Meet Bhingradiya Portfolio",
        "meetbhingradiya",
        "Full Stack Developer",
        "Full Stack",
        "Surat, Gujarat",
        "Gujarat, India",
        "Surat",
        "Gujarat",
        "India",
        "meetbhingradiya.com",
        "meetbhingradiya.dev",
        "meetbhingradiya.in",
        "meetbhingradiya.co.in",
    ],
    authors: {
        name: "Meet Bhingradiya",
        url: "https://github.com/MeetBhingradiya",
    }
};

// @ File
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />

                {/* Device View Port */}
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Mobile Browser Accent Colour */}
                <meta name="theme-color" content="#000" />

                {/* Google Search Console Verification */}
                <meta name="google-site-verification" content="-eIAp0-BRCYjfoSuMDWpQTpgjQHadfvBbnf4le5IWBk" />
            </head>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
