/**
 * POST /api/blogs/upload — Accept a .md file upload and return its text content
 * Used by the blog editor to import existing markdown files.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@Library/auth";

export async function POST(req: NextRequest) {
    try {
        await requireAuth(req.headers);

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext !== "md" && ext !== "markdown") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Only .md/.markdown files are accepted"
                },
                { status: 415 }
            );
        }

        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: "File too large (max 2 MB)" }, { status: 413 });
        }

        const text = await file.text();

        // Parse front-matter if present
        let title = "";
        let excerpt = "";
        let content = text;
        let tags: string[] = [];

        const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (fmMatch) {
            const fm = fmMatch[1];
            content = fmMatch[2].trim();

            const titleMatch = fm.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
            if (titleMatch) title = titleMatch[1];

            const excerptMatch = fm.match(/^excerpt:\s*['"]?(.+?)['"]?\s*$/m);
            if (excerptMatch) excerpt = excerptMatch[1];

            const tagsMatch = fm.match(/^tags:\s*\[(.+?)\]\s*$/m);
            if (tagsMatch) {
                tags = tagsMatch[1].split(",").map((t) => t.trim().replace(/['"]/g, ""));
            }
        }

        return NextResponse.json({
            success: true,
            data: { content, title, excerpt, tags }
        });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only" || err?.message?.includes("auth")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
