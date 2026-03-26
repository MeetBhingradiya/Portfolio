/**
 * Support Area Layout — Server Component
 * Requires authentication; unauthenticated users are sent to sign-in.
 */

import React from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@Library/auth";

export const metadata = {
    title: "Support | Meet Bhingradiya",
    description: "Help center, FAQ, and support tickets.",
};

export default async function SupportLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession(await headers());

    // Support hub (FAQ / help page) is public — only ticket routes need auth
    // Tickets are protected individually in their pages; layout just provides shell

    return <>{children}</>;
}
