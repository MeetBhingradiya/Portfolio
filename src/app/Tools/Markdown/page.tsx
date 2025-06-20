"use client";

import React, { useState, useRef, useEffect } from "react";
import "@Styles/Tools-Markdown.sass";
import {
    DescriptionOutlined,
    Edit,
    Visibility,
    ContentCopy,
    FileDownload,
    Upload,
    Code,
    Clear,
    GetApp,
    InsertDriveFile,
    CheckCircle
} from "@mui/icons-material";
import { Button } from "@heroui/react";

interface IState {
    markdown: string;
    htmlOutput: string;
    activeTab: "editor" | "preview";
    copied: boolean;
    fileName: string | null;
    showExportDropdown: boolean;
}

export default function MarkdownPreview() {
    const [state, setState] = useState<IState>({
        markdown: `# Welcome to Markdown Preview

This is a **live markdown editor** with real-time preview capabilities.

## Features
- Real-time preview
- Syntax highlighting
- Export to HTML
- File upload support
- Mobile responsive

### Code Example
\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

### Table Example
| Feature | Status |
|---------|--------|
| Live Preview | ✅ |
| Export | ✅ |
| Upload | ✅ |

> This is a blockquote example

**Try editing this text to see the live preview in action!**`,
        htmlOutput: "",
        activeTab: "editor",
        copied: false,
        fileName: null,
        showExportDropdown: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Simple markdown parser (basic implementation)
    const parseMarkdown = (markdown: string): string => {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
        html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
        html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Italic
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

        // Code blocks
        html = html.replace(
            /```(\w+)?\n?([\s\S]*?)```/g,
            '<pre><code class="language-$1">$2</code></pre>'
        );

        // Inline code
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

        // Links
        html = html.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        ); // Tables
        const tableRegex =
            /^\|(.+)\|\s*\n\|([|\-:\s]+)\|\s*\n((?:\|.+\|\s*\n?)*)/gm;
        html = html.replace(tableRegex, (match, header, separator, rows) => {
            const headerCells = header
                .split("|")
                .map((cell: string) => `<th>${cell.trim()}</th>`)
                .join("");
            const rowsHtml = rows
                .trim()
                .split("\n")
                .map((row: string) => {
                    const cells = row
                        .split("|")
                        .slice(1, -1)
                        .map((cell: string) => `<td>${cell.trim()}</td>`)
                        .join("");
                    return `<tr>${cells}</tr>`;
                })
                .join("");
            return `<table><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
        });

        // Blockquotes
        html = html.replace(/^> (.+)/gm, "<blockquote><p>$1</p></blockquote>");

        // Horizontal rules
        html = html.replace(/^---$/gm, "<hr>"); // Lists
        html = html.replace(/^\* (.+)/gm, "<li>$1</li>");
        html = html.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");

        // Line breaks
        html = html.replace(/\n\n/g, "</p><p>");
        html = html.replace(/\n/g, "<br>");

        // Wrap in paragraphs
        html = `<p>${html}</p>`;

        // Clean up multiple p tags
        html = html.replace(/<p><\/p>/g, "");
        html = html.replace(/<p>(<h[1-6]>)/g, "$1");
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
        html = html.replace(/<p>(<table>)/g, "$1");
        html = html.replace(/(<\/table>)<\/p>/g, "$1");
        html = html.replace(/<p>(<blockquote>)/g, "$1");
        html = html.replace(/(<\/blockquote>)<\/p>/g, "$1");
        html = html.replace(/<p>(<ul>)/g, "$1");
        html = html.replace(/(<\/ul>)<\/p>/g, "$1");
        html = html.replace(/<p>(<hr>)<\/p>/g, "$1");
        html = html.replace(/<p>(<pre>)/g, "$1");
        html = html.replace(/(<\/pre>)<\/p>/g, "$1");

        return html;
    };

    // Update HTML output when markdown changes
    useEffect(() => {
        const htmlOutput = parseMarkdown(state.markdown);
        setState((prev) => ({ ...prev, htmlOutput }));
    }, [state.markdown]);

    const handleMarkdownChange = (value: string) => {
        setState((prev) => ({ ...prev, markdown: value }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (
            file &&
            (file.type === "text/markdown" || file.name.endsWith(".md"))
        ) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setState((prev) => ({
                    ...prev,
                    markdown: content,
                    fileName: file.name
                }));
            };
            reader.readAsText(file);
        }
    };

    const handleCopyHtml = async () => {
        try {
            await navigator.clipboard.writeText(state.htmlOutput);
            setState((prev) => ({ ...prev, copied: true }));
            setTimeout(() => {
                setState((prev) => ({ ...prev, copied: false }));
            }, 2000);
        } catch (err) {
            console.error("Failed to copy HTML:", err);
        }
    };

    const handleCopyMarkdown = async () => {
        try {
            await navigator.clipboard.writeText(state.markdown);
            setState((prev) => ({ ...prev, copied: true }));
            setTimeout(() => {
                setState((prev) => ({ ...prev, copied: false }));
            }, 2000);
        } catch (err) {
            console.error("Failed to copy markdown:", err);
        }
    };

    const handleExportHtml = () => {
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 2rem; }
        h1, h2, h3, h4, h5, h6 { margin-top: 2rem; margin-bottom: 1rem; }
        code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
        th { background-color: #f2f2f2; }
        blockquote { border-left: 4px solid #ddd; margin: 1rem 0; padding: 0.5rem 1rem; background: #f9f9f9; }
    </style>
</head>
<body>
    ${state.htmlOutput}
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = state.fileName
            ? state.fileName.replace(".md", ".html")
            : "document.html";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportMarkdown = () => {
        const blob = new Blob([state.markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = state.fileName || "document.md";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setState((prev) => ({
            ...prev,
            markdown: "",
            fileName: null
        }));
    };

    const sampleMarkdown = `# Sample Document

This is a sample markdown document with various elements.

## Text Formatting
- **Bold text**
- *Italic text*
- \`inline code\`

## Code Block
\`\`\`javascript
function example() {
    return "Hello, World!";
}
\`\`\`

## Table
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

> This is a blockquote

[Link example](https://example.com)`;

    const insertSample = () => {
        setState((prev) => ({ ...prev, markdown: sampleMarkdown }));
    };

    return (
        <div className="markdown-tool">
            {/* Header */}
            <div className="tool-header">
                <div className="header-content">
                    <div className="title-section">
                        <div className="tool-icon">
                            <DescriptionOutlined
                                sx={{ width: 32, height: 32 }}
                            />
                        </div>
                        <div className="title-text">
                            <h1>Markdown Preview</h1>
                            <p>Edit and preview Markdown with live rendering</p>
                        </div>
                    </div>
                    <div className="action-buttons">
                        <Button
                            className="action-button secondary small"
                            onClick={insertSample}>
                            <InsertDriveFile />
                            Sample
                        </Button>
                        <Button
                            className="action-button secondary small"
                            onClick={handleClear}>
                            <Clear />
                            Clear
                        </Button>
                        <div className="export-dropdown">
                            <Button
                                className="action-button small"
                                onClick={() =>
                                    setState((prev) => ({
                                        ...prev,
                                        showExportDropdown:
                                            !prev.showExportDropdown
                                    }))
                                }>
                                <FileDownload />
                                Export
                            </Button>
                            {state.showExportDropdown && (
                                <div className="dropdown-content">
                                    <div
                                        className="dropdown-item"
                                        onClick={handleExportHtml}>
                                        <GetApp className="item-icon" />
                                        <span className="item-text">
                                            Export as HTML
                                        </span>
                                    </div>
                                    <div
                                        className="dropdown-item"
                                        onClick={handleExportMarkdown}>
                                        <GetApp className="item-icon" />
                                        <span className="item-text">
                                            Export as Markdown
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* File Upload Section */}
            <div className="file-upload-section">
                <Button
                    className="action-button secondary"
                    onClick={() => fileInputRef.current?.click()}>
                    <Upload />
                    Upload .md file
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.markdown"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                />
                {state.fileName && (
                    <div className="file-info">
                        <InsertDriveFile />
                        <span>{state.fileName}</span>
                    </div>
                )}
            </div>

            {/* Mobile Tabs */}
            <div className="mobile-tabs">
                <button
                    className={`tab ${state.activeTab === "editor" ? "active" : ""}`}
                    onClick={() =>
                        setState((prev) => ({ ...prev, activeTab: "editor" }))
                    }>
                    <Edit /> Editor
                </button>
                <button
                    className={`tab ${state.activeTab === "preview" ? "active" : ""}`}
                    onClick={() =>
                        setState((prev) => ({ ...prev, activeTab: "preview" }))
                    }>
                    <Visibility /> Preview
                </button>
            </div>

            {/* Main Content */}
            <div className="tool-content">
                {/* Editor Section */}
                <div
                    className={`editor-section ${state.activeTab === "preview" ? "mobile-hidden" : ""}`}>
                    <div className="editor-header">
                        <h3>
                            <Edit />
                            Markdown Editor
                        </h3>
                        <div className="editor-actions">
                            <button
                                className={`copy-button ${state.copied ? "copied" : ""}`}
                                onClick={handleCopyMarkdown}
                                title="Copy Markdown">
                                {state.copied ? (
                                    <CheckCircle />
                                ) : (
                                    <ContentCopy />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="editor-container">
                        <textarea
                            ref={textareaRef}
                            className="editor-textarea"
                            value={state.markdown}
                            onChange={(e) =>
                                handleMarkdownChange(e.target.value)
                            }
                            placeholder="Start typing your markdown here..."
                        />
                    </div>
                </div>

                {/* Preview Section */}
                <div
                    className={`preview-section ${state.activeTab === "editor" ? "mobile-hidden" : ""}`}>
                    <div className="preview-header">
                        <h3>
                            <Visibility />
                            Live Preview
                        </h3>
                        <div className="preview-actions">
                            <button
                                className={`copy-button ${state.copied ? "copied" : ""}`}
                                onClick={handleCopyHtml}
                                title="Copy HTML">
                                {state.copied ? (
                                    <CheckCircle />
                                ) : (
                                    <ContentCopy />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="preview-container">
                        <div
                            className="markdown-preview"
                            dangerouslySetInnerHTML={{
                                __html: state.htmlOutput
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
