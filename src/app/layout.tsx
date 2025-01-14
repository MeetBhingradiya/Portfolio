/**
 *  @FileID          app\layout.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

import type { Metadata } from "next";
import "@Styles/globals.sass";
import { Inter } from "next/font/google";
import { Providers } from "@Components/Providers";
import Footer from "@Components/Footer";
import { Config } from "@Config/index";
import { ThemeProvider } from "@Hooks/useTheme";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
    title: "Meet Bhingradiya",
    description: "A Portfolio Website of Meet Bhingradiya",
    icons: "/favicon.ico",
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
        // "meetbhingradiya.in",
        "meetbhingradiya.live",
        "meetbhingradiya.site",
        "meetbhingradiya.shop",
        "meetbhingradiya.co.in",
        "meetbhingradiya.tech",
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

                {/* Google ADS Monetization */}
                {
                    Config.Environment === "production" && (
                        <>
                            <script
                                data-ad-client="ca-pub-1096073946887913"
                                async
                                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
                            ></script>
                        </>
                    )
                }
            </head>
            <body className={inter.className}>
                <ThemeProvider>
                    <Providers>
                        {children}
                    </Providers>

                    <Footer ShowonFirstRender />
                </ThemeProvider>
            </body>
        </html>
    );
}