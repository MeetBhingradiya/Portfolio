/**
 * BlogEditor — Full-featured blog writing experience
 *  • Tab 1: Visual editor (@uiw/react-md-editor) with Mermaid preview
 *  • Tab 2: Raw Monaco editor (for power users)
 *  • Sidebar: metadata, tags, category, visibility selector
 *  • Toolbar: Save Draft, Submit for Review, Upload .md
 */
"use client";

import React, { useState, useCallback, useRef, Suspense, lazy, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { BlogStatus, BlogCategory } from "@/Types/Blog";
import { Config } from "@Config/Client";
import BuildIcon from "@mui/icons-material/Build";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CodeIcon from "@mui/icons-material/Code";
import EditNoteIcon from "@mui/icons-material/EditNote";
import ImageIcon from "@mui/icons-material/Image";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import slugify from "@sindresorhus/slugify";

// Dynamically import heavy editors (no SSR)
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false
});
const MermaidBlock = lazy(() => import("./MermaidBlock"));
const BlogRenderer = lazy(() => import("./BlogRenderer"));

const CATEGORIES = Object.values(BlogCategory).map((v) => ({
    value: v,
    label: v.charAt(0).toUpperCase() + v.slice(1)
}));

const STATUS_OPTS = [
    { value: BlogStatus.Draft, label: "Draft", color: "#94a3b8" },
    {
        value: BlogStatus.PendingReview,
        label: "Submit for Review",
        color: "#f59e0b"
    },
    { value: BlogStatus.Published, label: "Publish (Admin)", color: "#22c55e" },
    { value: BlogStatus.Unlisted, label: "Unlisted (Admin)", color: "#818cf8" },
    { value: BlogStatus.Private, label: "Private (Admin)", color: "#6b7280" }
];

export interface BlogDraft {
    _id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: BlogCategory;
    tags: string[];
    featuredImage: string;
    status: BlogStatus;
    metaTitle?: string;
    metaDescription?: string;
}

interface BlogEditorProps {
    initial?: Partial<BlogDraft>;
    isAdmin?: boolean;
    onSave?: (data: BlogDraft, action: "draft" | "submit" | "publish") => Promise<void>;
}

export default function BlogEditor({ initial, isAdmin = false, onSave }: BlogEditorProps) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editorMode, setEditorMode] = useState<"visual" | "raw" | "preview">("visual");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<{
        type: "ok" | "err";
        text: string;
    } | null>(null);
    const [tagInput, setTagInput] = useState("");
    const [sidebarSection, setSidebarSection] = useState<"meta" | "seo" | "cover">("meta");

    const [draft, setDraft] = useState<BlogDraft>({
        title: "",
        slug: "",
        excerpt: "",
        content: "# Hello World\n\nStart writing your blog post here...\n",
        category: BlogCategory.Development,
        tags: [],
        featuredImage: "",
        status: BlogStatus.Draft,
        ...initial
    });

    // Auto-generate slug from title if slug is empty
    useEffect(() => {
        if (!initial?._id && draft.title && !draft.slug) {
            setDraft((p) => ({
                ...p,
                slug: slugify(p.title, { lowercase: true, separator: "-" })
            }));
        }
    }, [draft.title]);

    const set = useCallback(<K extends keyof BlogDraft>(key: K, val: BlogDraft[K]) => {
        setDraft((p) => ({ ...p, [key]: val }));
    }, []);

    const addTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !draft.tags.includes(t)) {
            setDraft((p) => ({ ...p, tags: [...p.tags, t] }));
        }
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        setDraft((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }));
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await fetch("/api/blogs/upload", {
                method: "POST",
                body: fd
            });
            const data = await res.json();
            if (data.success) {
                const { content, title, excerpt, tags } = data.data;
                setDraft((p) => ({
                    ...p,
                    content: content || p.content,
                    title: title || p.title,
                    excerpt: excerpt || p.excerpt,
                    tags: tags?.length ? tags : p.tags
                }));
                setSaveMsg({ type: "ok", text: "Markdown file imported!" });
            } else {
                setSaveMsg({ type: "err", text: data.error });
            }
        } catch {
            setSaveMsg({ type: "err", text: "Upload failed" });
        }
        e.target.value = "";
        setTimeout(() => setSaveMsg(null), 3000);
    };

    const handleSave = async (action: "draft" | "submit" | "publish") => {
        if (!draft.title.trim()) {
            setSaveMsg({ type: "err", text: "Title is required" });
            return;
        }
        setSaving(true);
        try {
            const data: BlogDraft = {
                ...draft,
                status: action === "publish" ? BlogStatus.Published : action === "submit" ? BlogStatus.PendingReview : BlogStatus.Draft
            };
            await onSave?.(data, action);
            setSaveMsg({
                type: "ok",
                text: action === "draft" ? "Draft saved" : action === "submit" ? "Submitted for review!" : "Published!"
            });
        } catch (err: any) {
            setSaveMsg({ type: "err", text: err.message || "Save failed" });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 3000);
        }
    };

    const inputStyle = {
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        color: palette.textPrimary,
        borderRadius: isApple ? 10 : 12,
        padding: "8px 12px",
        fontSize: 14,
        outline: "none",
        width: "100%"
    };

    const cardStyle = {
        background: isApple ? (isDark ? "rgba(28,28,32,0.7)" : "rgba(255,255,255,0.7)") : isDark ? "rgba(20,20,24,0.95)" : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        backdropFilter: isApple ? "blur(20px)" : "none",
        borderRadius: 16
    };

    return (
        <div
            className="flex flex-col h-full min-h-screen"
            style={{ background: palette.background }}>
            {/* ── Top Toolbar ─────────────────────────── */}
            <div
                className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
                style={{
                    background: isApple ? (isDark ? "rgba(18,18,20,0.85)" : "rgba(245,245,250,0.85)") : palette.background,
                    backdropFilter: isApple ? "blur(24px)" : "none",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`
                }}>
                <div className="flex-1 min-w-0">
                    <input
                        value={draft.title}
                        onChange={(e) => set("title", e.target.value)}
                        placeholder="Blog post title…"
                        className="w-full text-xl font-bold bg-transparent border-none outline-none"
                        style={{ color: palette.textPrimary }}
                    />
                </div>

                {/* Mode tabs */}
                <div
                    className="flex items-center gap-1 rounded-xl p-1"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
                    }}>
                    {(
                        [
                            ["visual", "Visual", <EditNoteIcon style={{ fontSize: 14 }} />],
                            ["raw", "Raw", <CodeIcon style={{ fontSize: 14 }} />],
                            ["preview", "Preview", <VisibilityIcon style={{ fontSize: 14 }} />]
                        ] as [string, string, React.ReactNode][]
                    ).map(([mode, label, icon]) => (
                        <motion.button
                            key={mode}
                            onClick={() => setEditorMode(mode as any)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{
                                background: editorMode === mode ? palette.accent : "transparent",
                                color: editorMode === mode ? "#fff" : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.95 }}>
                            {icon}
                            {label}
                        </motion.button>
                    ))}
                </div>

                {/* Upload */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown"
                    className="hidden"
                    onChange={handleUpload}
                />
                <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                        color: palette.textSecondary
                    }}
                    whileTap={{ scale: 0.95 }}>
                    <UploadFileIcon style={{ fontSize: 15 }} /> Import .md
                </motion.button>

                {/* Save actions */}
                <motion.button
                    onClick={() => handleSave("draft")}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                        color: palette.textSecondary
                    }}
                    whileTap={{ scale: 0.95 }}>
                    <SaveIcon style={{ fontSize: 15 }} /> Save Draft
                </motion.button>

                {isAdmin ? (
                    <motion.button
                        onClick={() => handleSave("publish")}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: "#22c55e", color: "#fff" }}
                        whileTap={{ scale: 0.95 }}>
                        <AutoAwesomeIcon style={{ fontSize: 15 }} /> Publish
                    </motion.button>
                ) : (
                    <motion.button
                        onClick={() => handleSave("submit")}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: palette.accent, color: "#fff" }}
                        whileTap={{ scale: 0.95 }}>
                        <SendIcon style={{ fontSize: 15 }} /> Submit for Review
                    </motion.button>
                )}
            </div>

            {/* ── Save feedback ────────────────────────── */}
            <AnimatePresence>
                {saveMsg && (
                    <motion.div
                        className="px-6 py-2 text-sm font-medium"
                        style={{
                            background: saveMsg.type === "ok" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                            color: saveMsg.type === "ok" ? "#22c55e" : "#ef4444",
                            borderBottom: `1px solid ${saveMsg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`
                        }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}>
                        {saveMsg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Layout ──────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor / Preview */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {editorMode === "visual" && (
                        <div
                            className="flex-1 p-4"
                            data-color-mode={isDark ? "dark" : "light"}>
                            <MDEditor
                                value={draft.content}
                                onChange={(v) => set("content", v || "")}
                                height="calc(100vh - 120px)"
                                preview="live"
                                hideToolbar
                                style={{ background: "transparent" }}
                                previewOptions={{
                                    components: {
                                        code: ({ children, className: cls }: any) => {
                                            const lang = /language-(\w+)/.exec(cls || "")?.[1] || "";
                                            // MDEditor passes children as React nodes, not plain strings—extract text safely
                                            const extractText = (node: any): string => {
                                                if (typeof node === "string") return node;
                                                if (Array.isArray(node)) return node.map(extractText).join("");
                                                if (node?.props?.children) return extractText(node.props.children);
                                                return "";
                                            };
                                            const code = extractText(children).replace(/\n$/, "");
                                            if (lang === "mermaid") {
                                                return (
                                                    <Suspense
                                                        fallback={<div className="py-4 opacity-40 text-sm text-center">Rendering…</div>}>
                                                        <MermaidBlock
                                                            code={code}
                                                            silent
                                                        />
                                                    </Suspense>
                                                );
                                            }
                                            return <code className={cls}>{children}</code>;
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}

                    {editorMode === "raw" && (
                        <div
                            className="flex-1"
                            style={{ minHeight: "calc(100vh - 120px)" }}>
                            <MonacoEditor
                                height="calc(100vh - 120px)"
                                language="markdown"
                                value={draft.content}
                                onChange={(v) => set("content", v || "")}
                                theme={isDark ? "portfolio-dark" : "portfolio-light"}
                                beforeMount={(monaco) => {
                                    monaco.editor.defineTheme("portfolio-dark", {
                                        base: "vs-dark",
                                        inherit: true,
                                        rules: [
                                            {
                                                token: "keyword",
                                                foreground: "c084fc"
                                            },
                                            {
                                                token: "string",
                                                foreground: "86efac"
                                            },
                                            {
                                                token: "comment",
                                                foreground: "6b7280",
                                                fontStyle: "italic"
                                            },
                                            {
                                                token: "heading",
                                                foreground: "93c5fd",
                                                fontStyle: "bold"
                                            }
                                        ],
                                        colors: {
                                            "editor.background": "#0d0d12",
                                            "editor.foreground": "#e2e8f0",
                                            "editor.lineHighlightBackground": "#ffffff08",
                                            "editor.selectionBackground": "#6366f140",
                                            "editorLineNumber.foreground": "#4b5563",
                                            "editorLineNumber.activeForeground": "#9ca3af",
                                            "editorCursor.foreground": "#818cf8",
                                            "editorGutter.background": "#0d0d12",
                                            "scrollbarSlider.background": "#ffffff14",
                                            "scrollbarSlider.hoverBackground": "#ffffff22"
                                        }
                                    });
                                    monaco.editor.defineTheme("portfolio-light", {
                                        base: "vs",
                                        inherit: true,
                                        rules: [
                                            {
                                                token: "keyword",
                                                foreground: "7c3aed"
                                            },
                                            {
                                                token: "string",
                                                foreground: "16a34a"
                                            },
                                            {
                                                token: "comment",
                                                foreground: "9ca3af",
                                                fontStyle: "italic"
                                            },
                                            {
                                                token: "heading",
                                                foreground: "2563eb",
                                                fontStyle: "bold"
                                            }
                                        ],
                                        colors: {
                                            "editor.background": "#f8f8fc",
                                            "editor.foreground": "#1e293b",
                                            "editor.lineHighlightBackground": "#00000008",
                                            "editor.selectionBackground": "#6366f130",
                                            "editorLineNumber.foreground": "#d1d5db",
                                            "editorLineNumber.activeForeground": "#6b7280",
                                            "editorCursor.foreground": "#6366f1",
                                            "editorGutter.background": "#f8f8fc",
                                            "scrollbarSlider.background": "#00000014",
                                            "scrollbarSlider.hoverBackground": "#00000022"
                                        }
                                    });
                                }}
                                options={{
                                    wordWrap: "on",
                                    minimap: { enabled: false },
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                                    fontLigatures: true,
                                    fontSize: 14,
                                    lineHeight: 22,
                                    padding: { top: 20, bottom: 20 },
                                    renderLineHighlight: "gutter",
                                    smoothScrolling: true,
                                    cursorSmoothCaretAnimation: "on",
                                    bracketPairColorization: { enabled: true }
                                }}
                            />
                        </div>
                    )}

                    {editorMode === "preview" && (
                        <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
                            <Suspense fallback={<div className="opacity-40 py-8 text-center">Loading preview…</div>}>
                                <BlogRenderer content={draft.content} />
                            </Suspense>
                        </div>
                    )}
                </div>

                {/* ── Metadata Sidebar ─────────────────── */}
                <div
                    className="w-72 shrink-0 flex flex-col gap-4 p-4 overflow-y-auto border-l"
                    style={{
                        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                        background: isApple
                            ? isDark
                                ? "rgba(18,18,20,0.6)"
                                : "rgba(245,245,250,0.6)"
                            : isDark
                              ? "rgba(16,16,20,0.95)"
                              : "rgba(248,248,252,0.98)"
                    }}>
                    {/* Sidebar tabs */}
                    <div
                        className="flex gap-1 rounded-xl p-1"
                        style={{
                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                        }}>
                        {(["meta", "seo", "cover"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setSidebarSection(s)}
                                className="flex-1 py-1 rounded-lg text-xs font-medium capitalize transition-colors"
                                style={{
                                    background: sidebarSection === s ? palette.accent : "transparent",
                                    color: sidebarSection === s ? "#fff" : palette.textSecondary
                                }}>
                                {s === "meta" ? "Details" : s === "seo" ? "SEO" : "Cover"}
                            </button>
                        ))}
                    </div>

                    {sidebarSection === "meta" && (
                        <div className="flex flex-col gap-4">
                            {/* Slug */}
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 block"
                                    style={{ color: palette.textSecondary }}>
                                    Slug
                                </label>
                                <input
                                    value={draft.slug}
                                    onChange={(e) => set("slug", e.target.value)}
                                    placeholder="my-blog-post"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Excerpt */}
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 block"
                                    style={{ color: palette.textSecondary }}>
                                    Excerpt
                                </label>
                                <textarea
                                    value={draft.excerpt}
                                    onChange={(e) => set("excerpt", e.target.value)}
                                    placeholder="A short description…"
                                    rows={3}
                                    className="resize-none"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 block"
                                    style={{ color: palette.textSecondary }}>
                                    Category
                                </label>
                                <select
                                    value={draft.category}
                                    onChange={(e) => set("category", e.target.value as BlogCategory)}
                                    style={{ ...inputStyle }}>
                                    {CATEGORIES.map((c) => (
                                        <option
                                            key={c.value}
                                            value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tags */}
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 flex items-center gap-1"
                                    style={{ color: palette.textSecondary }}>
                                    <LocalOfferIcon style={{ fontSize: 12 }} /> Tags
                                </label>
                                <div className="flex gap-1">
                                    <input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === ",") {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        placeholder="Add tag…"
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <button
                                        onClick={addTag}
                                        className="px-2 rounded-lg"
                                        style={{
                                            background: palette.accent,
                                            color: "#fff"
                                        }}>
                                        <AddIcon style={{ fontSize: 16 }} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {draft.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                                            style={{
                                                background: `${palette.accent}20`,
                                                color: palette.accent,
                                                border: `1px solid ${palette.accent}40`
                                            }}>
                                            {tag}
                                            <button onClick={() => removeTag(tag)}>
                                                <CloseIcon style={{ fontSize: 10 }} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            {isAdmin && (
                                <div>
                                    <label
                                        className="text-xs font-medium mb-1 block"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Visibility
                                    </label>
                                    <select
                                        value={draft.status}
                                        onChange={(e) => set("status", e.target.value as BlogStatus)}
                                        style={inputStyle}>
                                        {STATUS_OPTS.map((s) => (
                                            <option
                                                key={s.value}
                                                value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Word count */}
                            <div
                                className="text-xs"
                                style={{ color: palette.textSecondary }}>
                                {draft.content.split(/\s+/).filter(Boolean).length} words · ~
                                {Math.max(1, Math.ceil(draft.content.split(/\s+/).length / 200))} min read
                            </div>
                        </div>
                    )}

                    {sidebarSection === "seo" && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 block"
                                    style={{ color: palette.textSecondary }}>
                                    Meta Title
                                </label>
                                <input
                                    value={draft.metaTitle || ""}
                                    onChange={(e) => set("metaTitle", e.target.value)}
                                    placeholder={draft.title || "SEO title…"}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 block"
                                    style={{ color: palette.textSecondary }}>
                                    Meta Description
                                </label>
                                <textarea
                                    value={draft.metaDescription || ""}
                                    onChange={(e) => set("metaDescription", e.target.value)}
                                    placeholder={draft.excerpt || "SEO description…"}
                                    rows={3}
                                    className="resize-none"
                                    style={inputStyle}
                                />
                                <div
                                    className="text-xs mt-1"
                                    style={{
                                        color: (draft.metaDescription?.length || 0) > 160 ? "#ef4444" : palette.textSecondary
                                    }}>
                                    {draft.metaDescription?.length || 0} / 160
                                </div>
                            </div>
                            <div
                                className="p-3 rounded-xl text-xs"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                                }}>
                                <div
                                    className="font-semibold mb-1"
                                    style={{ color: "#1a0dab" }}>
                                    {draft.metaTitle || draft.title || "Post Title"}
                                </div>
                                <div className="text-green-600 text-xs mb-1">
                                    {new URL(Config.Origin).hostname}/blogs/
                                    {draft.slug || "slug"}
                                </div>
                                <div style={{ color: palette.textSecondary }}>
                                    {draft.metaDescription || draft.excerpt || "Description…"}
                                </div>
                            </div>
                        </div>
                    )}

                    {sidebarSection === "cover" && (
                        <div className="flex flex-col gap-4">
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 flex items-center gap-1"
                                    style={{ color: palette.textSecondary }}>
                                    <ImageIcon style={{ fontSize: 12 }} /> Featured Image URL
                                </label>
                                <input
                                    value={draft.featuredImage || ""}
                                    onChange={(e) => set("featuredImage", e.target.value)}
                                    placeholder="https://…"
                                    style={inputStyle}
                                />
                            </div>
                            {draft.featuredImage && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={draft.featuredImage}
                                    alt="Cover preview"
                                    className="w-full rounded-xl object-cover aspect-video"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── MDEditor preview gap overrides ───────── */}
            <style
                jsx
                global>{`
                .w-md-editor-preview .wmde-markdown h1,
                .w-md-editor-preview .wmde-markdown h2,
                .w-md-editor-preview .wmde-markdown h3,
                .w-md-editor-preview .wmde-markdown h4 {
                    margin-top: 0.8rem !important;
                    margin-bottom: 0.25rem !important;
                    padding-bottom: 0 !important;
                    border: none !important;
                }
                .w-md-editor-preview .wmde-markdown p {
                    margin-top: 0.35rem !important;
                    margin-bottom: 0.35rem !important;
                }
                .w-md-editor-preview .wmde-markdown ul,
                .w-md-editor-preview .wmde-markdown ol {
                    margin-top: 0.3rem !important;
                    margin-bottom: 0.3rem !important;
                }
                .w-md-editor-preview .wmde-markdown li {
                    margin-top: 0.1rem !important;
                    margin-bottom: 0.1rem !important;
                }
                .w-md-editor-preview .wmde-markdown pre {
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
                .w-md-editor-preview .wmde-markdown blockquote {
                    margin-top: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                }
            `}</style>
        </div>
    );
}
