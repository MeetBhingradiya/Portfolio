import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings | Meet Bhingradiya",
    description: "Manage your account settings, preferences and security.",
    robots: { index: false, follow: false }
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
