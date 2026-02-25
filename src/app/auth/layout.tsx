import type { Metadata } from "next";
import { Config } from "@Config/Client";

export const metadata: Metadata = {
    title: "Sign In | Meet Bhingradiya",
    description: `Sign in to your account at ${new URL(Config.Origin).hostname}.`,
    robots: { index: false, follow: false }
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
