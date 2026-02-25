import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "JWT Debugger & Decoder | Meet Bhingradiya Tools",
    description:
        "Free online JWT debugger. Decode, inspect and build JSON Web Tokens (JWT) entirely client-side. Inspect header, payload, signature and expiry without sending data to servers.",
    keywords: [
        "JWT debugger",
        "JWT decoder",
        "JSON Web Token decoder",
        "JWT inspector",
        "decode JWT online",
        "JWT viewer",
        "JWT token checker",
        "JWT payload inspector",
        "online JWT tool",
        "client-side JWT debugger"
    ],
    alternates: { canonical: `${Config.Origin}/tools/jwt` },
    openGraph: {
        type: "website",
        url: `${Config.Origin}/tools/jwt`,
        title: "JWT Debugger & Decoder | Meet Bhingradiya Tools",
        description: "Decode and inspect JSON Web Tokens client-side — no data sent to servers.",
        images: [{ url: "/assets/og-image.png", width: 1200, height: 630, alt: "JWT Debugger" }]
    },
    twitter: {
        card: "summary_large_image",
        title: "JWT Debugger & Decoder | Meet Bhingradiya Tools",
        description: "Decode JWT tokens client-side. Inspect header, payload and signature.",
        images: ["/assets/og-image.png"]
    }
};

export default function JWTLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
