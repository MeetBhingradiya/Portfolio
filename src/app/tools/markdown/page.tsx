/**
 * Markdown Preview — /tools/markdown
 * Split / editor / preview tabs with a custom client-side
 * markdown → HTML parser. Export as HTML or .md.
 */

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Article,
    ContentCopy,
    Check,
    Download,
    Visibility,
    Edit,
    VerticalSplit
} from "@mui/icons-material";

const SAMPLE = `# Hello Markdown

## Features

- **Bold**, *italic*, ~~strikethrough~~, \`inline code\`
- [Links](https://example.com)
- Images, lists, blockquotes

### Code Block

\`\`\`typescript
function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> "The only way to do great work is to love what you do." — Steve Jobs

### Table

| Feature | Status |
|---------|--------|
| Parsing | ✅ |
| Export  | ✅ |

### Checklist

- [x] Build markdown parser
- [x] Add preview
- [ ] Ship it

---

Made with ❤️ by Meet Bhingradiya
`;

type ViewMode = "split" | "editor" | "preview";

/**
 * Lightweight Markdown → HTML converter.
 * No external deps; good enough for common syntax.
 */
function markdownToHtml(md: string): string {
    let html = md;

    // Code blocks (fenced)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
        return `<pre style="background:rgba(0,0,0,0.06);padding:12px 16px;border-radius:12px;overflow-x:auto;font-size:13px"><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 6px;border-radius:4px;font-size:0.875em">$1</code>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" style="max-width:100%;border-radius:8px" />');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#007AFF;text-decoration:underline">$1</a>');

    // Tables
    html = html.replace(/(?:^\|.+\|\n)+/gm, (tableBlock) => {
        const rows = tableBlock.trim().split("\n");
        if (rows.length < 2) return tableBlock;
        const headerCells = rows[0].split("|").filter(Boolean).map((c) => c.trim());
        const isSep = /^[\s|:-]+$/.test(rows[1]);
        const bodyStart = isSep ? 2 : 1;

        let t = '<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr>';
        headerCells.forEach((c) => { t += `<th style="border:1px solid rgba(0,0,0,0.12);padding:8px;text-align:left">${c}</th>`; });
        t += "</tr></thead><tbody>";
        for (let i = bodyStart; i < rows.length; i++) {
            const cells = rows[i].split("|").filter(Boolean).map((c) => c.trim());
            t += "<tr>";
            cells.forEach((c) => { t += `<td style="border:1px solid rgba(0,0,0,0.12);padding:8px">${c}</td>`; });
            t += "</tr>";
        }
        t += "</tbody></table>";
        return t;
    });

    // Checklists
    html = html.replace(/^- \[x\] (.+)$/gm, '<div style="margin:4px 0"><input type="checkbox" checked disabled /> $1</div>');
    html = html.replace(/^- \[ \] (.+)$/gm, '<div style="margin:4px 0"><input type="checkbox" disabled /> $1</div>');

    // Headers
    html = html.replace(/^###### (.+)$/gm, '<h6 style="margin:8px 0;font-size:0.85em">$1</h6>');
    html = html.replace(/^##### (.+)$/gm, '<h5 style="margin:8px 0;font-size:0.9em">$1</h5>');
    html = html.replace(/^#### (.+)$/gm, '<h4 style="margin:10px 0;font-size:1em">$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3 style="margin:12px 0;font-size:1.15em;font-weight:700">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="margin:14px 0;font-size:1.35em;font-weight:800">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="margin:16px 0;font-size:1.75em;font-weight:900">$1</h1>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid rgba(0,0,0,0.12);margin:16px 0" />');

    // Bold, italic, strikethrough
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid rgba(0,0,0,0.15);padding:4px 12px;margin:8px 0;color:rgba(0,0,0,0.65)">$1</blockquote>');

    // Unordered lists
    html = html.replace(/^- (.+)$/gm, '<li style="margin:2px 0;list-style-type:disc;margin-left:20px">$1</li>');

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:2px 0;list-style-type:decimal;margin-left:20px">$1</li>');

    // Paragraphs — wrap loose lines
    html = html.replace(/^(?!<[a-z]|<\/|<li|<div|<hr|<pre|<table|<block)(.+)$/gm, '<p style="margin:6px 0">$1</p>');

    return html;
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function MarkdownPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [source, setSource] = useState(SAMPLE);
    const [view, setView] = useState<ViewMode>("split");
    const [copied, setCopied] = useState(false);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = React.useRef(false);

    React.useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.markdown) return;
        defaultsApplied.current = true;
        if (toolDefaults.markdown.viewMode) setView(toolDefaults.markdown.viewMode as ViewMode);
    }, [toolDefaults]);

    const preview = useMemo(() => markdownToHtml(source), [source]);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    const download = (content: string, name: string) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
    };

    const wordCount = source.trim().split(/\s+/).filter(Boolean).length;
    const charCount = source.length;

    return (
        <ToolPageWrapper
            title="Markdown Preview"
            description="Write and preview Markdown in real-time"
            icon={<Article sx={{ fontSize: 24 }} />}
            accentColor="#64D2FF"
            actions={
                <div className="flex gap-1.5">
                    <motion.button onClick={() => copy(source)} className="p-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)" }} whileTap={{ scale: 0.9 }}>
                        {copied ? <Check sx={{ fontSize: 16, color: "#34C759" }} /> : <ContentCopy sx={{ fontSize: 16, color: palette.textTertiary }} />}
                    </motion.button>
                    <motion.button onClick={() => download(source, "document.md")} className="p-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)" }} whileTap={{ scale: 0.9 }} title="Download .md">
                        <Download sx={{ fontSize: 16, color: palette.textTertiary }} />
                    </motion.button>
                    <motion.button onClick={() => download(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Markdown Export</title></head><body>${preview}</body></html>`, "document.html")} className="p-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)" }} whileTap={{ scale: 0.9 }} title="Download .html">
                        <Article sx={{ fontSize: 16, color: palette.textTertiary }} />
                    </motion.button>
                </div>
            }
        >
            <div className="space-y-4">
                {/* View mode + stats */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {([
                            { key: "split" as ViewMode, icon: <VerticalSplit sx={{ fontSize: 14 }} />, label: "Split" },
                            { key: "editor" as ViewMode, icon: <Edit sx={{ fontSize: 14 }} />, label: "Editor" },
                            { key: "preview" as ViewMode, icon: <Visibility sx={{ fontSize: 14 }} />, label: "Preview" }
                        ]).map((v) => (
                            <motion.button
                                key={v.key}
                                onClick={() => setView(v.key)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                                style={{
                                    background: view === v.key ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                    color: view === v.key ? "#fff" : palette.textSecondary
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {v.icon} {v.label}
                            </motion.button>
                        ))}
                    </div>
                    <p className="text-[10px] font-mono" style={{ color: palette.textTertiary }}>
                        {wordCount} words · {charCount} chars
                    </p>
                </div>

                {/* Editor + Preview */}
                <div className={`grid gap-4 ${view === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                    {(view === "split" || view === "editor") && (
                        <Card>
                            <textarea
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none resize-none"
                                style={{ ...inputStyle, minHeight: 500 }}
                                spellCheck={false}
                            />
                        </Card>
                    )}

                    {(view === "split" || view === "preview") && (
                        <Card>
                            <div
                                className="prose prose-sm max-w-none px-4 py-3 rounded-xl overflow-y-auto"
                                style={{ minHeight: 500, color: palette.textPrimary, fontSize: 14 }}
                                dangerouslySetInnerHTML={{ __html: preview }}
                            />
                        </Card>
                    )}
                </div>
            </div>
        </ToolPageWrapper>
    );
}
