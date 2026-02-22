/**
 * Admin Layout — Server Component
 * Guards /admin/** routes so only the ADMIN_EMAIL env var owner can access them.
 * Renders a responsive sidebar + main area styled with the portfolio design system.
 */

import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/Library/auth";
import AdminSidebar from "./AdminSidebar";

export const metadata = {
    title: "Admin Portal | Meet Bhingradiya",
    robots: { index: false, follow: false }
};

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await getSession(await headers());
    const adminEmail = process.env.ADMIN_EMAIL;

    // Not logged in → send to sign-in so they can authenticate first
    if (!session?.user) {
        redirect("/auth/signin?callbackUrl=/admin");
    }

    // Logged in but wrong account, OR ADMIN_EMAIL env var missing → go home (no loop)
    if (!adminEmail || session.user.email !== adminEmail) {
        redirect("/?error=unauthorized");
    }

    return (
        <div className="flex min-h-screen" style={{ background: "var(--bg, #0f0f0f)" }}>
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
