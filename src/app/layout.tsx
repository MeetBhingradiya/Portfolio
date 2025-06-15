import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "@Styles/globals.sass";
import { Inter } from "next/font/google";
import { Providers } from "@Components/Providers";
import { Config } from "@Config";
import { ThemeProvider } from "@Hooks/useTheme";
import Header from "@Components/Header";
import LandingFooter from "@Components/Footer/LandingFooter";
import { ToastContainer } from "react-toastify";

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
        "meetbhingradiya.in",
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

                {/* ? React Scan */}
                {
                    (Config.Environment === "development" && Config.ReactScan) && (
                        <>
                            <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
                        </>
                    )
                }
            </head>
            <body className={inter.className}>
                <ToastContainer
                    autoClose={3000}
                    position="bottom-right"
                    theme="dark"
                    pauseOnHover={false}
                    pauseOnFocusLoss={false}
                    closeOnClick
                    draggable
                    draggableDirection="x"
                    closeButton={false}
                    limit={3}
                    hideProgressBar={false}
                    stacked
                />
                <ThemeProvider>
                    {/* <Header /> */}

                    <Providers>
                        {children}
                    </Providers>

                    {/* <LandingFooter /> */}
                </ThemeProvider>
            </body>
        </html>
    );
}