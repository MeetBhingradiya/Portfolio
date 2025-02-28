/**
 *  @FileID          app\layout.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 22/02/25 7:25 PM IST (Kolkata +5:30 UTC)
 */


import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "@Styles/globals.sass";
import { Inter } from "next/font/google";
import { Providers } from "@Components/Providers";
import Footer from "@Components/Footer";
import { Config } from "@Config";
import { ThemeProvider } from "@Hooks/useTheme";
import LandingFooter from "@Components/Footer/LandingFooter";

const inter = Inter({ subsets: ["latin"] });
export const metadata: Metadata = {
    title: "Meet Bhingradiya",
    description: "Advacnced Workspace EcoSystem & My Portfolio",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Meet Bhingradiya Portfolio",
        "meetbhingradiya",

        // ? Job Profile
        "Full Stack Developer",
        "Full Stack",

        // ? Location
        "Surat, Gujarat",
        "Gujarat, India",
        "Surat",
        "Gujarat",
        "India",

        // ? Domains
        "meetbhingradiya.com",
        "meetbhingradiya.dev",
        "meetbhingradiya.live",
        "meetbhingradiya.site",
        "meetbhingradiya.shop",
        "meetbhingradiya.co.in",
        "meetbhingradiya.tech",

        // ? This Domain is not owned by me 
        "meetbhingradiya.in",
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
                    (Config.Environment === "production" && Config.GoogleADS) && (
                        <>
                            <script
                                data-ad-client="ca-pub-1096073946887913"
                                async
                                src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
                            ></script>
                        </>
                    )
                }

                {/* ? Vercel Speed Insights */}
                {
                    (Config.Environment === "production" && Config.VercelSpeedInsight) && <SpeedInsights />
                }
            </head>
            <body className={inter.className}>
                <ThemeProvider>
                    <Providers>
                        {children}
                    </Providers>

                    <Footer ShowonFirstRender />
                    <LandingFooter />
                </ThemeProvider>
            </body>
        </html>
    );
}