/**
 * MermaidBlock — client component for rendering Mermaid diagrams
 * Dynamically imports mermaid to avoid SSR issues.
 */
"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { useDesignTheme } from "@Hooks/useDesignTheme";

interface MermaidBlockProps {
    code: string;
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
    const { actualColorMode } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const ref = useRef<HTMLDivElement>(null);
    const uid = useId().replace(/:/g, "mermaid");
    const [svgContent, setSvgContent] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        async function render() {
            try {
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? "dark" : "default",
                    fontFamily: "inherit",
                    fontSize: 14
                });
                const { svg } = await mermaid.render(`mermaid-${uid}`, code);
                if (mounted) setSvgContent(svg);
            } catch (e: any) {
                if (mounted) setError(e.message || "Diagram render error");
            }
        }
        render();
        return () => { mounted = false; };
    }, [code, isDark, uid]);

    if (error) {
        return (
            <div className="p-3 rounded-xl text-xs font-mono" style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444"
            }}>
                Mermaid error: {error}
            </div>
        );
    }

    if (!svgContent) {
        return (
            <div className="flex items-center justify-center py-8 rounded-xl opacity-50"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
                <span className="text-sm">Rendering diagram…</span>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="flex justify-center py-4 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
}
