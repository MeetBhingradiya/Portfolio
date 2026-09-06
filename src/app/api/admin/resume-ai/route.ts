/**
 * POST /api/admin/resume-ai
 *
 * AI-powered resume tailoring endpoint.
 * Takes a job description, feeds portfolio data through the configured
 * AI provider, and returns token-optimized JSON with relevance scores
 * and recommended ordering.
 *
 * Requires: portfolio.manage permission
 *
 * Request body:
 *   { jobDescription: string, name?: string, title?: string }
 *
 * Response:
 *   { success: true, data: CompressedResumeOutput, meta: { provider, model, processingTimeMs } }
 */

import { NextRequest, NextResponse } from "next/server";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";
import { generateTailoredResume } from "@Utils/resumeAI";
import { logAdminAction, logError } from "@Utils/DiscordLogger";

export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "portfolio.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        const actor = auth.session?.user?.email || "Unknown";

        const body = await req.json();
        const { jobDescription, name, title } = body as {
            jobDescription?: string;
            name?: string;
            title?: string;
        };

        if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
            return NextResponse.json(
                { success: false, error: "Job description is required and must be at least 20 characters." },
                { status: 400 }
            );
        }

        const result = await generateTailoredResume({
            jobDescription: jobDescription.trim(),
            name: name?.trim(),
            title: title?.trim()
        });

        logAdminAction("create", {
            model: "ResumeAI",
            actor,
            summary: `Generated AI-tailored resume (${result.provider}/${result.model}, ${result.processingTimeMs}ms, relevance: ${result.data.rs}%)`
        });

        return NextResponse.json({
            success: true,
            data: result.data,
            meta: {
                provider: result.provider,
                model: result.model,
                processingTimeMs: result.processingTimeMs
            }
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";

        logError("ResumeAI", {
            operation: "generateTailoredResume",
            error: message
        });

        // Distinguish between auth errors and AI pipeline errors
        if (err instanceof Error && err.message === "Forbidden: requires role 'admin'") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        if (err instanceof Error && err.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        console.error("POST /api/admin/resume-ai:", err);
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
