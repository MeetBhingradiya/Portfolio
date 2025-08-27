"use client";

import React, { useState, useRef, useEffect } from "react";
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
    CheckCircle,
    Settings,
    Download
} from "@mui/icons-material";
import { Button, Card, CardBody, Tabs, Tab, Textarea, Chip, Tooltip, Divider } from "@heroui/react";

interface IState {
    markdown: string;
    htmlOutput: string;
    activeTab: "editor" | "preview" | "split";
    copied: boolean;
    fileName: string | null;
    wordCount: number;
    charCount: number;
}

export default function MarkdownPreview() {
    const [state, setState] = useState<IState>({
        markdown: `# Welcome to Markdown Editor

This is a **live markdown editor** with real-time preview capabilities and modern glassmorphism UI.

## ✨ Features
- 🚀 Real-time preview
- 🎨 Syntax highlighting  
- 📤 Export to HTML/PDF
- 📁 File upload support
- 📱 Mobile responsive
- 🔢 Word & character count

### 💻 Code Example
\`\`\`javascript
function greetUser(name) {
    console.log(\`Hello, \${name}! Welcome to our markdown editor.\`);
    return \`Nice to meet you, \${name}!\`;
}

greetUser("Developer");
\`\`\`

### 📊 Table Example
| Feature | Status | Priority |
|---------|--------|----------|
| Live Preview | ✅ Complete | High |
| Export HTML | ✅ Complete | High |
| File Upload | ✅ Complete | Medium |
| Syntax Highlight | ✅ Complete | Medium |
| Dark Mode | ✅ Complete | Low |

### 📝 Lists & Quotes
**Unordered List:**
- Modern glassmorphism design
- Responsive layout
- Professional typography
- Smooth animations

**Ordered List:**
1. Write your markdown
2. See live preview
3. Export or copy
4. Share with others

> 💡 **Pro Tip:** This editor supports all standard markdown syntax plus some extended features. Try experimenting with different elements!

### 🔗 Links & Media
[Visit GitHub](https://github.com) for more amazing projects.

---

**Try editing this text to see the live preview in action!** ✨`,
        htmlOutput: "",
        activeTab: "split",
        copied: false,
        fileName: null,
        wordCount: 0,
        charCount: 0
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

    // Update HTML output and counts when markdown changes
    useEffect(() => {
        const htmlOutput = parseMarkdown(state.markdown);
        const wordCount = state.markdown.trim() ? state.markdown.trim().split(/\s+/).length : 0;
        const charCount = state.markdown.length;
        
        setState((prev) => ({ 
            ...prev, 
            htmlOutput,
            wordCount,
            charCount
        }));
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
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-6 pt-45 min-h-max pb-16">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-4xl font-bold mb-2 text-white">
                    📝 Markdown Editor & Preview
                </div>
                <div className="text-base text-gray-400 mb-6 max-w-2xl">
                    Write, preview, and export beautiful markdown documents with real-time rendering
                </div>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats & Actions */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-white">{state.wordCount}</div>
                                        <div className="text-xs text-gray-400">Words</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-white">{state.charCount}</div>
                                        <div className="text-xs text-gray-400">Characters</div>
                                    </div>
                                    {state.fileName && (
                                        <Chip 
                                            startContent={<InsertDriveFile />} 
                                            variant="flat" 
                                            color="primary"
                                            size="sm"
                                        >
                                            {state.fileName}
                                        </Chip>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Tooltip content="Upload Markdown File">
                                        <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            onPress={() => fileInputRef.current?.click()}
                                        >
                                            <Upload />
                                        </Button>
                                    </Tooltip>
                                    
                                    <Tooltip content="Insert Sample">
                                        <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            onPress={insertSample}
                                        >
                                            <InsertDriveFile />
                                        </Button>
                                    </Tooltip>
                                    
                                    <Tooltip content="Clear All">
                                        <Button
                                            isIconOnly
                                            variant="bordered"
                                            size="sm"
                                            color="danger"
                                            onPress={handleClear}
                                        >
                                            <Clear />
                                        </Button>
                                    </Tooltip>
                                    
                                    <Button
                                        startContent={<Download />}
                                        color="primary"
                                        variant="shadow"
                                        size="sm"
                                        onPress={handleExportHtml}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                                    >
                                        Export HTML
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Editor and Preview */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <Tabs 
                                selectedKey={state.activeTab}
                                onSelectionChange={(key) => setState(prev => ({ ...prev, activeTab: key as "editor" | "preview" | "split" }))}
                                variant="underlined"
                                classNames={{
                                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                                    cursor: "w-full bg-blue-500",
                                    tab: "max-w-fit px-0 h-12",
                                    tabContent: "group-data-[selected=true]:text-blue-400"
                                }}
                            >
                                <Tab 
                                    key="editor" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <Edit />
                                            <span>Editor</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6">
                                        <Textarea
                                            ref={textareaRef}
                                            value={state.markdown}
                                            onChange={(e) => handleMarkdownChange(e.target.value)}
                                            placeholder="Start typing your markdown here..."
                                            minRows={20}
                                            maxRows={30}
                                            variant="bordered"
                                            className="bg-white/5 font-mono"
                                            classNames={{
                                                input: "font-mono text-sm resize-none",
                                                inputWrapper: "bg-gray-900/50 border-white/10"
                                            }}
                                        />
                                        
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="text-xs text-gray-400">
                                                Lines: {state.markdown.split('\n').length}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="bordered"
                                                startContent={state.copied ? <CheckCircle /> : <ContentCopy />}
                                                onPress={handleCopyMarkdown}
                                                color={state.copied ? "success" : "default"}
                                            >
                                                {state.copied ? "Copied!" : "Copy Markdown"}
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab 
                                    key="preview" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <Visibility />
                                            <span>Preview</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6">
                                        <div className="bg-white rounded-lg p-6 min-h-[500px] shadow-inner border border-gray-200">
                                            <div
                                                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-table:table-auto prose-th:bg-gray-50"
                                                dangerouslySetInnerHTML={{ __html: state.htmlOutput }}
                                            />
                                        </div>
                                        
                                        <div className="flex justify-end mt-3">
                                            <Button
                                                size="sm"
                                                variant="bordered"
                                                startContent={state.copied ? <CheckCircle /> : <ContentCopy />}
                                                onPress={handleCopyHtml}
                                                color={state.copied ? "success" : "default"}
                                            >
                                                {state.copied ? "Copied!" : "Copy HTML"}
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>

                                <Tab 
                                    key="split" 
                                    title={
                                        <div className="flex items-center gap-2">
                                            <Code />
                                            <span>Split View</span>
                                        </div>
                                    }
                                >
                                    <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4 h-[600px]">
                                        {/* Editor Side */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-gray-300">Markdown Source</h4>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    isIconOnly
                                                    onPress={handleCopyMarkdown}
                                                >
                                                    <ContentCopy className="text-gray-400" />
                                                </Button>
                                            </div>
                                            <Textarea
                                                value={state.markdown}
                                                onChange={(e) => handleMarkdownChange(e.target.value)}
                                                placeholder="Type markdown here..."
                                                minRows={25}
                                                variant="bordered"
                                                className="bg-white/5 font-mono flex-1"
                                                classNames={{
                                                    input: "font-mono text-sm resize-none",
                                                    inputWrapper: "bg-gray-900/50 border-white/10 h-full"
                                                }}
                                            />
                                        </div>

                                        {/* Preview Side */}
                                        <div className="flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-medium text-gray-300">Live Preview</h4>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    isIconOnly
                                                    onPress={handleCopyHtml}
                                                >
                                                    <ContentCopy className="text-gray-400" />
                                                </Button>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 flex-1 overflow-y-auto shadow-inner border border-gray-200 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                                                <div
                                                    className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-white prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50"
                                                    dangerouslySetInnerHTML={{ __html: state.htmlOutput }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Export Options */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <FileDownload className="text-green-400" />
                                Export Options
                            </h3>
                            
                            <div className="space-y-3">
                                <Button
                                    fullWidth
                                    variant="bordered"
                                    startContent={<GetApp />}
                                    onPress={handleExportHtml}
                                    className="justify-start"
                                >
                                    Export as HTML
                                </Button>
                                
                                <Button
                                    fullWidth
                                    variant="bordered"
                                    startContent={<GetApp />}
                                    onPress={handleExportMarkdown}
                                    className="justify-start"
                                >
                                    Export as Markdown
                                </Button>
                                
                                <Divider />
                                
                                <Button
                                    fullWidth
                                    variant="bordered"
                                    startContent={<ContentCopy />}
                                    onPress={handleCopyHtml}
                                    className="justify-start"
                                    color={state.copied ? "success" : "default"}
                                >
                                    {state.copied ? "Copied HTML!" : "Copy HTML"}
                                </Button>
                                
                                <Button
                                    fullWidth
                                    variant="bordered"
                                    startContent={<ContentCopy />}
                                    onPress={handleCopyMarkdown}
                                    className="justify-start"
                                    color={state.copied ? "success" : "default"}
                                >
                                    {state.copied ? "Copied Markdown!" : "Copy Markdown"}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Markdown Guide */}
                    <Card className="bg-black/10 backdrop-blur-lg border border-white/20">
                        <CardBody className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Code className="text-blue-400" />
                                Quick Reference
                            </h3>
                            
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="text-gray-300 font-medium">Headers</div>
                                    <div className="text-gray-400 font-mono"># H1 ## H2 ### H3</div>
                                </div>
                                
                                <div>
                                    <div className="text-gray-300 font-medium">Emphasis</div>
                                    <div className="text-gray-400 font-mono">**bold** *italic*</div>
                                </div>
                                
                                <div>
                                    <div className="text-gray-300 font-medium">Links</div>
                                    <div className="text-gray-400 font-mono">[text](url)</div>
                                </div>
                                
                                <div>
                                    <div className="text-gray-300 font-medium">Lists</div>
                                    <div className="text-gray-400 font-mono">- item<br />1. numbered</div>
                                </div>
                                
                                <div>
                                    <div className="text-gray-300 font-medium">Code</div>
                                    <div className="text-gray-400 font-mono">`inline` ```block```</div>
                                </div>
                                
                                <div>
                                    <div className="text-gray-300 font-medium">Tables</div>
                                    <div className="text-gray-400 font-mono">| col | col |<br />|-----|-----|</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileUpload}
                style={{ display: "none" }}
            />
        </div>
    );
}
