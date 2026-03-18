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
import AntiDebuggerShield from "@Components/Common/AntiDebuggerShield";
import URLNotice from "@Components/Common/URLNotice";
import { Suspense } from "react";

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

const BASE_URL = Config.Origin;

export const metadata: Metadata = {
    // ─── Core ────────────────────────────────────────────────────────────────
    metadataBase: new URL(BASE_URL),
    title: {
        default: "Meet Bhingradiya — Full Stack Developer",
        template: "%s | Meet Bhingradiya"
    },
    description:
        "Meet Bhingradiya is a Full Stack Developer from Surat, Gujarat, India. Explore his portfolio, open-source projects, developer tools, blog and more.",
    applicationName: "Meet Bhingradiya Portfolio",
    generator: "Next.js",
    referrer: "origin-when-cross-origin",

    // ─── Keywords ────────────────────────────────────────────────────────────
    keywords: [
        // Identity
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "meetbhingradiya",
        "Portfolio",
        "Meet Bhingradiya Portfolio",
        // Role
        "Full Stack Developer",
        "Full Stack Web Developer",
        "Expert Full Stack Developer",
        "Software Engineer",
        "React Developer",
        "Next.js Developer",
        "TypeScript Developer",
        "Node.js Developer",
        "Backend Developer",
        "Frontend Developer",
        "Open Source Contributor",
        // Location
        "Surat, Gujarat",
        "Gujarat, India",
        "Surat",
        "Gujarat",
        "India",
        // Domains (only confirmed owned)
        "meetbhingradiya.vercel.app",
        "meetbhingradiya.in"
    ],

    // ─── Authors & Creator ───────────────────────────────────────────────────
    authors: [
        { name: "Meet Bhingradiya", url: "https://github.com/MeetBhingradiya" }
    ],
    creator: "Meet Bhingradiya",
    publisher: "Meet Bhingradiya",

    // ─── Icons ───────────────────────────────────────────────────────────────
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/favicon.ico"
    },

    // ─── Robots ──────────────────────────────────────────────────────────────
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1
        }
    },

    // ─── Open Graph ──────────────────────────────────────────────────────────
    openGraph: {
        type: "website",
        locale: "en_US",
        url: BASE_URL,
        siteName: "Meet Bhingradiya",
        title: "Meet Bhingradiya — Full Stack Developer",
        description:
            "Full Stack Developer from Surat, India. Explore projects, open-source work, developer tools, blog articles and more.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Meet Bhingradiya — Full Stack Developer"
            }
        ]
    },

    // ─── Twitter / X Card ────────────────────────────────────────────────────
    twitter: {
        card: "summary_large_image",
        site: "@MeetBhingradiya",
        creator: "@MeetBhingradiya",
        title: "Meet Bhingradiya — Full Stack Developer",
        description:
            "Full Stack Developer from Surat, India. Projects, tools, blogs and more.",
        images: ["/assets/og-image.png"]
    },

    // ─── Canonical / Alternates ──────────────────────────────────────────────
    alternates: {
        canonical: BASE_URL
    },

    // ─── Category ────────────────────────────────────────────────────────────
    category: "technology"
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

                {/* JSON-LD — Person Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Person",
                            name: "Meet Bhingradiya",
                            url: Config.Origin,
                            image: `${Config.Origin}/assets/og-image.png`,
                            sameAs: [
                                "https://github.com/MeetBhingradiya",
                                "https://linkedin.com/in/meetbhingradiya",
                                "https://twitter.com/MeetBhingradiya"
                            ],
                            jobTitle: "Full Stack Developer",
                            worksFor: {
                                "@type": "Organization",
                                name: "Self-Employed"
                            },
                            address: {
                                "@type": "PostalAddress",
                                addressLocality: "Surat",
                                addressRegion: "Gujarat",
                                addressCountry: "IN"
                            },
                            description:
                                "Full Stack Developer specialising in React, Next.js, TypeScript and Node.js."
                        })
                    }}
                />

                {/* JSON-LD — WebSite Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            name: "Meet Bhingradiya",
                            url: Config.Origin,
                            description:
                                "Portfolio and developer workspace of Meet Bhingradiya — Full Stack Developer from Surat, India.",
                            author: {
                                "@type": "Person",
                                name: "Meet Bhingradiya"
                            },
                            potentialAction: {
                                "@type": "SearchAction",
                                target: {
                                    "@type": "EntryPoint",
                                    urlTemplate: `${Config.Origin}/blogs?search={search_term_string}`
                                },
                                "query-input": "required name=search_term_string"
                            }
                        })
                    }}
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

                {/* Anti-Debugger Shield — client-only, production-only */}
                <AntiDebuggerShield />

                <Providers>
                    {/* URL-param driven toast notifications (e.g. ?notice=immich_access_denied) */}
                    <Suspense fallback={null}>
                        <URLNotice />
                    </Suspense>
                    <HeadNavigation />
                    {children}
                    <FootNavigation />
                </Providers>
            </body>
        </html>
    );
}
