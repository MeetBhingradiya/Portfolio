import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard | Meet Bhingradiya",
    description: "Personal dashboard for Meet Bhingradiya.",
    robots: { index: false, follow: false }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
