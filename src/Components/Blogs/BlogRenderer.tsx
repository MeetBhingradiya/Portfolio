/**
 * BlogRenderer — renders blog markdown with:
 *   • Mermaid diagrams
 *   • Monaco-powered read-only code blocks with copy
 *   • Responsive typography styled with the design theme
 */
"use client";

import React, { Suspense, lazy } from "react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import MarkdownPreview from "@uiw/react-markdown-preview";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";

const MermaidBlock = lazy(() => import("./MermaidBlock"));

// Code block with copy button
function CodeBlock({ code, language }: { code: string; language: string }) {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    return (
        <div
            className="relative group rounded-xl overflow-hidden my-4"
            style={{
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
            }}>
            {/* Header bar */}
            <div
                className="flex items-center justify-between px-4 py-2"
                style={{
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`
                }}>
                <span className="text-xs font-mono font-medium opacity-50">{language || "code"}</span>
                <button
                    onClick={copy}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                        color: copied ? "#22c55e" : palette.textSecondary
                    }}>
                    {copied ? <CheckIcon style={{ fontSize: 12 }} /> : <ContentCopyIcon style={{ fontSize: 12 }} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre
                className="p-4 overflow-x-auto text-sm font-mono leading-relaxed m-0"
                style={{
                    background: isDark ? "rgba(0,0,0,0.6)" : "rgba(248,248,252,1)",
                    color: isDark ? "#e2e8f0" : "#1e293b"
                }}>
                <code>{code}</code>
            </pre>
        </div>
    );
}

interface BlogRendererProps {
    content: string;
    className?: string;
}

export default function BlogRenderer({ content, className = "" }: BlogRendererProps) {
    const { palette, actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";

    return (
        <div
            className={`blog-renderer ${className}`}
            data-color-mode={isDark ? "dark" : "light"}>
            <MarkdownPreview
                source={content}
                wrapperElement={{ "data-color-mode": isDark ? "dark" : "light" } as any}
                style={{
                    background: "transparent",
                    color: palette.textPrimary,
                    fontSize: "16px",
                    lineHeight: "1.8"
                }}
                components={{
                    code: ({ children, className: cls, ...props }: any) => {
                        const match = /language-(\w+)/.exec(cls || "");
                        const language = match?.[1] || "";
                        // children is React node tree, not a plain string — extract text safely
                        const extractText = (node: any): string => {
                            if (typeof node === "string") return node;
                            if (Array.isArray(node)) return node.map(extractText).join("");
                            if (node?.props?.children) return extractText(node.props.children);
                            return "";
                        };
                        const code = extractText(children).replace(/\n$/, "");

                        if (language === "mermaid") {
                            return (
                                <Suspense fallback={<div className="py-8 text-center opacity-40 text-sm">Loading diagram…</div>}>
                                    <MermaidBlock code={code} />
                                </Suspense>
                            );
                        }

                        // Inline code
                        if (!cls) {
                            return (
                                <code
                                    {...props}
                                    className="px-1.5 py-0.5 rounded text-[0.85em] font-mono"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
                                        color: palette.accent
                                    }}>
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <CodeBlock
                                code={code}
                                language={language}
                            />
                        );
                    }
                }}
            />

            <style
                jsx
                global>{`
                .blog-renderer .wmde-markdown {
                    background: transparent !important;
                    font-family: inherit !important;
                }
                .blog-renderer .wmde-markdown h1,
                .blog-renderer .wmde-markdown h2,
                .blog-renderer .wmde-markdown h3,
                .blog-renderer .wmde-markdown h4 {
                    color: ${palette.textPrimary} !important;
                    font-weight: 700 !important;
                    border: none !important;
                    padding-bottom: 0 !important;
                }
                .blog-renderer .wmde-markdown h1 {
                    font-size: 2rem;
                    margin-top: 1.2rem;
                    margin-bottom: 0.4rem;
                }
                .blog-renderer .wmde-markdown h2 {
                    font-size: 1.5rem;
                    margin-top: 1rem;
                    margin-bottom: 0.3rem;
                }
                .blog-renderer .wmde-markdown h3 {
                    font-size: 1.25rem;
                    margin-top: 0.8rem;
                    margin-bottom: 0.25rem;
                }
                .blog-renderer .wmde-markdown p {
                    color: ${palette.textSecondary} !important;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .blog-renderer .wmde-markdown ul,
                .blog-renderer .wmde-markdown ol {
                    margin-top: 0.4rem;
                    margin-bottom: 0.4rem;
                    padding-left: 1.5rem;
                }
                .blog-renderer .wmde-markdown li {
                    margin-top: 0.15rem;
                    margin-bottom: 0.15rem;
                }
                .blog-renderer .wmde-markdown a {
                    color: ${palette.accent} !important;
                }
                .blog-renderer .wmde-markdown blockquote {
                    border-left: 3px solid ${palette.accent} !important;
                    background: ${palette.accent}10 !important;
                    color: ${palette.textSecondary} !important;
                    padding: 12px 16px !important;
                    border-radius: 0 8px 8px 0 !important;
                    margin: 16px 0 !important;
                }
                .blog-renderer .wmde-markdown table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                }
                .blog-renderer .wmde-markdown th,
                .blog-renderer .wmde-markdown td {
                    border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} !important;
                    padding: 8px 12px !important;
                    color: ${palette.textPrimary} !important;
                }
                .blog-renderer .wmde-markdown th {
                    background: ${palette.accent}18 !important;
                    font-weight: 600 !important;
                }
                .blog-renderer .wmde-markdown img {
                    border-radius: 12px !important;
                    max-width: 100% !important;
                }
                .blog-renderer .wmde-markdown hr {
                    border-color: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} !important;
                }
                .blog-renderer .wmde-markdown pre {
                    margin: 0 !important;
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
}
