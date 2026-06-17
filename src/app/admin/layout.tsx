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
import { getSession } from "@Library/auth";
import { canAccessAdminPanel } from "@Library/permissions";
import AdminSidebar from "./AdminSidebar";

export const metadata = {
    title: "Admin Portal | Meet Bhingradiya",
    robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await getSession(await headers());

    // Not logged in → send to sign-in so they can authenticate first
    if (!session?.user) {
        redirect("/auth/signin?callbackUrl=/admin");
    }

    const canAccessAdmin = await canAccessAdminPanel(session.user.id, session.user.email);

    // Logged in but lacking admin dashboard access → show the shared access denied page.
    if (!canAccessAdmin) {
        const searchParams = new URLSearchParams({
            error: "AccessDenied",
            reason: "Admin.View permission is required to access the admin dashboard."
        });
        redirect(`/auth/error?${searchParams.toString()}`);
    }

    return (
        <div
            className="flex min-h-screen items-start pb-4"
            style={{ background: "var(--bg, #0f0f0f)" }}>
            <AdminSidebar />
            <main className="flex-1 min-w-0 pb-4">{children}</main>
        </div>
    );
}
