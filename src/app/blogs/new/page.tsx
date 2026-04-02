"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@Library/auth-client";
import BlogEditor, { BlogDraft } from "@/Components/Blogs/BlogEditor";
import { useDesignTheme } from "@Hooks/useDesignTheme";

export default function NewBlogPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { palette } = useDesignTheme();

    const isAdmin = typeof window !== "undefined" ? false : session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    const handleSave = useCallback(
        async (data: BlogDraft) => {
            const res = await fetch("/api/blogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error || "Failed to save");
            router.push(`/blogs/${result.blog?.slug || result.data?.slug || ""}`);
        },
        [router]
    );

    return (
        <div
            className="h-screen overflow-hidden"
            style={{ background: palette.background }}>
            <BlogEditor
                isAdmin={session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL}
                onSave={handleSave}
            />
        </div>
    );
}
