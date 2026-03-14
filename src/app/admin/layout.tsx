/**
 * Admin Layout — Server Component
 * Guards /admin/** routes based on:
 *  1. Authentication (must be logged in)
 *  2. ADMIN_EMAIL env var (primary access)
 *  3. Or role-based permissions for delegated access
 *
 * Renders a responsive sidebar + main area styled with the portfolio design system.
 */

import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/Library/auth";
import { isAdminEmail } from "@/Library/permissions";
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

    // Not logged in → send to sign-in so they can authenticate first
    if (!session?.user) {
        redirect("/auth/signin?callbackUrl=/admin");
    }

    // Logged in but wrong account, OR ADMIN_EMAIL env var missing → go home (no loop)
    // Note: Future versions can grant admin access via role system instead of just ADMIN_EMAIL
    if (!isAdminEmail(session.user.email)) {
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
