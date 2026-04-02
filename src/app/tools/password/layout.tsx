import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Password Generator | Meet Bhingradiya Tools",
    description:
        "Free strong password generator. Create random passwords, memorable passphrases and PINs with customisable length, character types and strength meter — all client-side.",
    keywords: [
        "password generator",
        "strong password generator",
        "random password generator",
        "secure password creator",
        "passphrase generator",
        "PIN generator",
        "password strength checker",
        "online password tool",
        "free password generator",
        "client-side password generator"
    ],
    alternates: { canonical: `${Config.Origin}/tools/password` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/password`,
        title: "Password Generator | Meet Bhingradiya Tools",
        description: "Generate strong passwords, passphrases and PINs — free and client-side.",
        images: [
            {
                url: "/assets/og-image.png",
                width: 1200,
                height: 630,
                alt: "Password Generator"
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Password Generator | Meet Bhingradiya Tools",
        description: "Generate strong passwords, passphrases and PINs — free and secure.",
        images: ["/assets/og-image.png"]
    }
};

export default function PasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
