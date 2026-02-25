import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Maintenance | Meet Bhingradiya",
    description: "The site is currently undergoing scheduled maintenance. We'll be back shortly.",
    robots: { index: false, follow: false }
};

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
