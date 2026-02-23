"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, notFound } from "next/navigation";
import { useSession } from "@Library/auth-client";
import BlogEditor, { BlogDraft } from "@/Components/Blogs/BlogEditor";
import { useDesignTheme } from "@Hooks/useDesignTheme";

export default function EditBlogPage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const { data: session } = useSession();
    const { palette } = useDesignTheme();

    const [initial, setInitial] = useState<Partial<BlogDraft> | null>(null);
    const [blogId, setBlogId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        fetch(`/api/blogs?slug=${params.slug}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success && data.blog) {
                    setBlogId(data.blog._id);
                    setInitial({
                        _id: data.blog._id,
                        title: data.blog.title,
                        slug: data.blog.slug,
                        excerpt: data.blog.excerpt || "",
                        content: data.blog.content || "",
                        category: data.blog.category,
                        tags: data.blog.tags || [],
                        featuredImage: data.blog.featuredImage || "",
                        status: data.blog.status,
                        metaTitle: data.blog.metaTitle || "",
                        metaDescription: data.blog.metaDescription || ""
                    });
                } else {
                    setNotFoundFlag(true);
                }
            })
            .finally(() => setLoading(false));
    }, [params.slug]);

    const handleSave = useCallback(async (data: BlogDraft) => {
        const res = await fetch(`/api/blogs?id=${blogId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error || "Failed to update");
        router.push(`/blogs/${result.blog?.slug || result.data?.slug || params.slug}`);
    }, [blogId, router, params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: palette.background }}>
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: palette.accent }} />
            </div>
        );
    }

    if (notFoundFlag || !initial) return notFound();

    return (
        <div className="h-screen overflow-hidden" style={{ background: palette.background }}>
            <BlogEditor
                initial={initial}
                isAdmin={session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL}
                onSave={handleSave}
            />
        </div>
    );
}
