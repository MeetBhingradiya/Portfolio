import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.sass";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Meet Bhingradiya",
    description: "A personal website for Meet Bhingradiya.",
    keywords: [
        "Meet Bhingradiya", 
        "Meet", 
        "Bhingradiya",
        "Portfolio",
        "Meet Bhingradiya Portfolio"
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                {/* Google Search Console Verification */}
                <meta name="google-site-verification" content="-eIAp0-BRCYjfoSuMDWpQTpgjQHadfvBbnf4le5IWBk" />
            </head>
            <body className={inter.className}>{children}</body>
        </html>
    );
}
