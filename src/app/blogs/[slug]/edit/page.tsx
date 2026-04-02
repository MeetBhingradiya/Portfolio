"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, notFound } from "next/navigation";
import { useSession } from "@Library/auth-client";
import BlogEditor, { BlogDraft } from "@/Components/Blogs/BlogEditor";
import { useDesignTheme } from "@Hooks/useDesignTheme";

export default function EditBlogPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const router = useRouter();
    const { data: session } = useSession();
    const { palette } = useDesignTheme();

    const [initial, setInitial] = useState<Partial<BlogDraft> | null>(null);
    const [blogId, setBlogId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        // The URL param may be a slug or a MongoDB ObjectId (24 hex chars) — admin edit links use _id as fallback
        const isObjectId = /^[a-f\d]{24}$/i.test(slug);
        const url = isObjectId ? `/api/blogs?id=${slug}` : `/api/blogs?slug=${slug}`;
        fetch(url)
            .then((r) => r.json())
            .then((data) => {
                const blog = data.blog || data.data;
                if (data.success && blog) {
                    setBlogId(blog._id);
                    setInitial({
                        _id: blog._id,
                        title: blog.title,
                        slug: blog.slug,
                        excerpt: blog.excerpt || "",
                        content: blog.content || "",
                        category: blog.category,
                        tags: blog.tags || [],
                        featuredImage: blog.featuredImage || "",
                        status: blog.status,
                        metaTitle: blog.metaTitle || "",
                        metaDescription: blog.metaDescription || ""
                    });
                } else {
                    setNotFoundFlag(true);
                }
            })
            .finally(() => setLoading(false));
    }, [slug]);

    const handleSave = useCallback(
        async (data: BlogDraft) => {
            const res = await fetch(`/api/blogs?id=${blogId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error || "Failed to update");
            const finalSlug = result.blog?.slug || result.data?.slug || (!/^[a-f\d]{24}$/i.test(slug) ? slug : "");
            router.push(finalSlug ? `/blogs/${finalSlug}` : "/dashboard");
        },
        [blogId, router, slug]
    );

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div
                    className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    if (notFoundFlag || !initial) return notFound();

    return (
        <div
            className="h-screen overflow-hidden"
            style={{ background: palette.background }}>
            <BlogEditor
                initial={initial}
                isAdmin={session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL}
                onSave={handleSave}
            />
        </div>
    );
}
