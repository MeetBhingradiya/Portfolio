import type { Metadata } from "next";
import "@Styles/globals.sass";
import { Inter } from "next/font/google";
import { Providers } from "@Components/Providers";
import Footer from "@Components/Footer";

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
        "meetbhingradiya.in",
        "meetbhingradiya.live",
        "meetbhingradiya.shop",
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

                {/* Google ADS Monetization */}
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1096073946887913"
                    crossOrigin="anonymous"
                ></script>
            </head>
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>

                <Footer ShowonFirstRender />
            </body>
        </html>
    );
}