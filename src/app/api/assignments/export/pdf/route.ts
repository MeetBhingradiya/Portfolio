/**
 * Assignment PDF Export API
 * GET /api/assignments/export/pdf?id=  → generate and download assignment as PDF
 */

import { NextRequest, NextResponse } from "next/server";
import AssignmentDocument from "@/Models/AssignmentDocument";
import dbConnect from "@/Utils/dbConnect";
import { getSession } from "@Library/auth";
import { AssignmentPrivacy, BlockType } from "@/Types/Assignment";

const isAdmin = (email?: string | null) => !!email && !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;

// Helper to generate HTML from assignment data
function generateAssignmentHTML(assignment: any): string {
    const metadata = `
        <div class="metadata">
            <h1>${assignment.assignmentTitle}</h1>
            <p><strong>Assignment No:</strong> ${assignment.assignmentNo}</p>
            <p><strong>Student Name:</strong> ${assignment.studentName}</p>
            <p><strong>Enrollment No:</strong> ${assignment.studentEnrollmentNo}</p>
            ${assignment.subject ? `<p><strong>Subject:</strong> ${assignment.subject}</p>` : ""}
            ${assignment.subjectCode ? `<p><strong>Subject Code:</strong> ${assignment.subjectCode}</p>` : ""}
            ${assignment.description ? `<p><strong>Description:</strong> ${assignment.description}</p>` : ""}
            <p><strong>Date:</strong> ${new Date(assignment.editedAt || assignment.createdAt).toLocaleDateString()}</p>
            ${assignment.watermarkEnabled ? `<p><em>Watermarked Document</em></p>` : ""}
            ${assignment.signatureHash ? `<p style="font-size: 0.8em; color: #999;">Hash: ${assignment.signatureHash}</p>` : ""}
        </div>
    `;

    const blocksHTML = assignment.blocks
        .map((block: any) => {
            switch (block.type) {
                case BlockType.CodeSnippet:
                    return `
                        <div class="code-block">
                            ${block.description ? `<p class="description">${block.description}</p>` : ""}
                            ${block.fileName ? `<p class="file-name">File: ${block.fileName}</p>` : ""}
                            <pre><code class="language-${block.language}">${block.code}</code></pre>
                        </div>
                    `;

                case BlockType.CodeBlock:
                    return `
                        <div class="code-block-container">
                            <h3>${block.title}</h3>
                            ${block.description ? `<p class="description">${block.description}</p>` : ""}
                            ${block.steps
                                .map(
                                    (step: any, idx: number) => `
                                <div class="code-step">
                                    <h4>Line ${step.lineNumber}: ${step.description}</h4>
                                    <pre><code class="language-${step.language}">${step.code}</code></pre>
                                    ${step.terminalOutput ? `<pre class="terminal-output">${step.terminalOutput}</pre>` : ""}
                                </div>
                            `
                                )
                                .join("")}
                        </div>
                    `;

                case BlockType.StepsBlock:
                    return `
                        <div class="steps-block">
                            <h3>${block.title}</h3>
                            ${block.description ? `<p class="description">${block.description}</p>` : ""}
                            <ol>
                                ${block.steps
                                    .map(
                                        (step: any) => `
                                    <li>
                                        <strong>${step.title}</strong>
                                        <p>${step.description}</p>
                                        ${step.code ? `<pre><code class="language-${step.language}">${step.code}</code></pre>` : ""}
                                    </li>
                                `
                                    )
                                    .join("")}
                            </ol>
                        </div>
                    `;

                case BlockType.Table:
                    const headerRow = block.columns.map((col: any) => `<th>${col.header}</th>`).join("");
                    const bodyRows = block.rows
                        .map(
                            (row: any) =>
                                `<tr>${block.columns.map((col: any) => `<td>${row[col.key] || ""}</td>`).join("")}</tr>`
                        )
                        .join("");

                    return `
                        <div class="table-block">
                            <h3>${block.title}</h3>
                            ${block.description ? `<p class="description">${block.description}</p>` : ""}
                            <table>
                                <thead><tr>${headerRow}</tr></thead>
                                <tbody>${bodyRows}</tbody>
                            </table>
                        </div>
                    `;

                case BlockType.TextBlock:
                    return `
                        <div class="text-block">
                            <h3>${block.title}</h3>
                            <div class="text-content">${block.content}</div>
                        </div>
                    `;

                case BlockType.Image:
                    return `
                        <div class="image-block">
                            ${block.title ? `<h3>${block.title}</h3>` : ""}
                            ${block.description ? `<p class="description">${block.description}</p>` : ""}
                            <img src="${block.imageUrl}" alt="${block.caption || "Assignment image"}" />
                            ${block.caption ? `<p class="caption">${block.caption}</p>` : ""}
                        </div>
                    `;

                default:
                    return "";
            }
        })
        .join("");

    const css = `
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .metadata { border-bottom: 2px solid #2563eb; padding: 20px; margin-bottom: 30px; }
            .metadata h1 { margin: 0 0 15px 0; color: #1e40af; }
            .metadata p { margin: 8px 0; }
            .code-block, .code-block-container, .steps-block, .table-block, .text-block, .image-block {
                margin: 20px 0; padding: 15px; border-left: 4px solid #2563eb;
            }
            .code-block pre, .code-block-container pre { background: #f3f4f6; padding: 10px; overflow-x: auto; }
            .terminal-output { background: #1f2937; color: #10b981; padding: 10px; }
            .file-name { font-size: 0.9em; color: #666; }
            .description { font-style: italic; color: #666; }
            table { width: 100%; border-collapse: collapse; }
            table th, table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            table th { background: #f3f4f6; }
            img { max-width: 100%; height: auto; }
            .caption { font-size: 0.9em; color: #666; margin-top: 5px; }
            h3 { color: #1e40af; margin-top: 15px; }
            h4 { color: #2563eb; margin: 10px 0 5px 0; }
            ol, ul { margin: 10px 0; }
            li { margin: 8px 0; }
        </style>
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${css}
        </head>
        <body>
            ${metadata}
            ${blocksHTML}
        </body>
        </html>
    `;
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession(req.headers).catch(() => null);
        await dbConnect();

        const id = req.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json({ success: false, error: "Missing assignment ID" }, { status: 400 });
        }

        const assignment = await AssignmentDocument.findById(id).lean();
        if (!assignment) {
            return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
        }

        // Check access permissions
        const isOwner = assignment.ownerId === session?.user?.id;
        const admin = isAdmin(session?.user?.email);

        const canDownload = admin || isOwner || assignment.privacy === AssignmentPrivacy.Public;

        if (!canDownload) {
            return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
        }

        // Generate HTML
        const html = generateAssignmentHTML(assignment);

        // Return HTML that can be converted to PDF by the client
        // In production, you'd use a library like puppeteer or pdfkit
        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": `inline; filename="${assignment.assignmentNo}_${assignment.studentName}.html"`,
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        });
    } catch (error: any) {
        console.error("GET /api/assignments/export/pdf error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
