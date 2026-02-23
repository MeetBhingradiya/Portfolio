import type { Metadata } from "next";
import "@Styles/globals.sass";
// import "@Styles/liquidGlass.css";
import { Inter } from "next/font/google";
import { Providers } from "@Contexts/Providers";
import { Config } from "@Config/Client";
import { ToastContainer } from "react-toastify";
// import { muiXTelemetrySettings } from "@mui/x-license";
// import { generateLicense, LicenseInfo } from "@mui/x-license";
import HeadNavigation from "@Components/Common/HeadNavigation";
import FootNavigation from "@Components/Common/FootNavigation";

// muiXTelemetrySettings.disableTelemetry();
// LicenseInfo.setLicenseKey(
//     generateLicense({
//         expiryDate: new Date(`${new Date().getFullYear() + 1}-12-31`),
//         orderNumber: "MUI-123",
//         planScope: "premium",
//         licenseModel: "subscription",
//         planVersion: "initial"
//     })
// );

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
        "Expert Full Stack Developer",

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
        "meetbhingradiya.co.in",
        "meetbhingradiya.in",
        "meetbhingradiya.tech",
        "meetbhingradiya.shop",

        // ? This Domain is not owned by me
        "meetbhingradiya.in"
    ],
    authors: {
        name: "Meet Bhingradiya",
        url: "https://github.com/MeetBhingradiya"
    },

};

// @ File
export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />

                {/* Device View Port */}
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />

                {/* Mobile Browser Accent Colour */}
                <meta
                    name="theme-color"
                    content="#000"
                />

                {/* Google ADS Monetization */}
                {/* {Config.Environment === "production" && Config.GoogleADS && (
                    <>
                        <meta name="google-adsense-account" content="ca-pub-1096073946887913" />
                        <script
                            async
                            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1096073946887913"
                            crossOrigin="anonymous"></script>
                    </>
                )} */}

                {/* ? React Scan */}
                {/* {Config.Environment === "development" && Config.ReactScan && (
                    <>
                        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
                    </>
                )} */}
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

                <Providers>
                    <HeadNavigation />
                    {children}
                    <FootNavigation />
                </Providers>
            </body>
        </html>
    );
}
