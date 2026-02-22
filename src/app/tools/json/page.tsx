/**
 * JSON ↔ JS Object Converter — /tools/json
 * Bidirectional JSON ↔ JavaScript Object conversion with
 * Monaco Editor for both panels, format / minify / swap.
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    DataObject,
    ContentCopy,
    Check,
    SwapHoriz,
    Compress,
    FormatAlignLeft,
    Delete
} from "@mui/icons-material";

const SAMPLE_JSON = `{
  "name": "Meet Bhingradiya",
  "role": "Software Engineer",
  "skills": ["TypeScript", "React", "Next.js", "Rust"],
  "experience": {
    "years": 3,
    "companies": [
      {
        "name": "Portfolio",
        "current": true
      }
    ]
  },
  "isAwesome": true
}`;

type Direction = "json-to-js" | "js-to-json";

/**
 * Converts JSON string → JS Object literal string.
 * Removes quotes from keys that are valid identifiers.
 */
function jsonToJsObject(json: string): string {
    try {
        const parsed = JSON.parse(json);
        return toJsLiteral(parsed, 0);
    } catch (e: any) {
        throw new Error(`Invalid JSON: ${e.message}`);
    }
}

function toJsLiteral(value: any, indent: number): string {
    const pad = "  ".repeat(indent);
    const inner = "  ".repeat(indent + 1);

    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    if (typeof value === "number" || typeof value === "boolean") return String(value);

    if (Array.isArray(value)) {
        if (value.length === 0) return "[]";
        const items = value.map((v) => `${inner}${toJsLiteral(v, indent + 1)}`);
        return `[\n${items.join(",\n")}\n${pad}]`;
    }

    if (typeof value === "object") {
        const keys = Object.keys(value);
        if (keys.length === 0) return "{}";
        const entries = keys.map((key) => {
            const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            return `${inner}${safeKey}: ${toJsLiteral(value[key], indent + 1)}`;
        });
        return `{\n${entries.join(",\n")}\n${pad}}`;
    }

    return String(value);
}

/**
 * Converts JS Object literal string → JSON string.
 * Uses Function constructor for evaluation (sandboxed enough for a tool).
 */
function jsObjectToJson(js: string): string {
    try {
        // Wrap in parens to make it an expression
        const fn = new Function(`return (${js})`);
        const obj = fn();
        return JSON.stringify(obj, null, 2);
    } catch (e: any) {
        throw new Error(`Invalid JS Object: ${e.message}`);
    }
}

export default function JsonPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [direction, setDirection] = useState<Direction>("json-to-js");
    const [left, setLeft] = useState(SAMPLE_JSON);
    const [right, setRight] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<"left" | "right" | null>(null);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = React.useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.json) return;
        defaultsApplied.current = true;
        if (toolDefaults.json.direction) setDirection(toolDefaults.json.direction as Direction);
    }, [toolDefaults]);

    const convert = useCallback(() => {
        setError(null);
        try {
            if (direction === "json-to-js") {
                setRight(jsonToJsObject(left));
            } else {
                setRight(jsObjectToJson(left));
            }
        } catch (e: any) {
            setError(e.message);
            setRight("");
        }
    }, [direction, left]);

    // Auto-convert on input/direction change
    useEffect(() => {
        const timer = setTimeout(convert, 300);
        return () => clearTimeout(timer);
    }, [left, direction]);

    const swap = () => {
        setLeft(right);
        setRight("");
        setDirection((d) => (d === "json-to-js" ? "js-to-json" : "json-to-js"));
    };

    const formatLeft = () => {
        try {
            if (direction === "json-to-js") {
                setLeft(JSON.stringify(JSON.parse(left), null, 2));
            }
        } catch { /* ignore */ }
    };

    const minifyLeft = () => {
        try {
            if (direction === "json-to-js") {
                setLeft(JSON.stringify(JSON.parse(left)));
            }
        } catch { /* ignore */ }
    };

    const copy = (text: string, side: "left" | "right") => {
        navigator.clipboard.writeText(text);
        setCopied(side);
        setTimeout(() => setCopied(null), 1200);
    };

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1.5px solid ${error ? "#FF3B3040" : isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
    };

    const leftLabel = direction === "json-to-js" ? "JSON" : "JS Object";
    const rightLabel = direction === "json-to-js" ? "JS Object" : "JSON";

    return (
        <ToolPageWrapper
            title="JSON ↔ JS Object"
            description="Convert between JSON and JavaScript Object literal"
            icon={<DataObject sx={{ fontSize: 24 }} />}
            accentColor="#FF9F0A"
        >
            <div className="space-y-6">
                {/* Direction toggle */}
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        {([
                            { key: "json-to-js" as Direction, label: "JSON → JS Object" },
                            { key: "js-to-json" as Direction, label: "JS Object → JSON" }
                        ]).map((d) => (
                            <motion.button
                                key={d.key}
                                onClick={() => { setDirection(d.key); setLeft(""); setRight(""); setError(null); }}
                                className="px-5 py-2 rounded-full text-sm font-bold"
                                style={{
                                    background: direction === d.key ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: direction === d.key ? "#fff" : palette.textSecondary
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {d.label}
                            </motion.button>
                        ))}
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-1 ml-auto">
                        {direction === "json-to-js" && (
                            <>
                                <motion.button onClick={formatLeft} className="p-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }} whileTap={{ scale: 0.9 }} title="Format">
                                    <FormatAlignLeft sx={{ fontSize: 14, color: palette.textTertiary }} />
                                </motion.button>
                                <motion.button onClick={minifyLeft} className="p-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }} whileTap={{ scale: 0.9 }} title="Minify">
                                    <Compress sx={{ fontSize: 14, color: palette.textTertiary }} />
                                </motion.button>
                            </>
                        )}
                        <motion.button onClick={swap} className="p-2 rounded-xl" style={{ background: palette.accent }} whileTap={{ scale: 0.9 }} title="Swap">
                            <SwapHoriz sx={{ fontSize: 14, color: "#fff" }} />
                        </motion.button>
                    </div>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "#FF3B3015", color: "#FF3B30", border: "1px solid #FF3B3030" }}>
                        {error}
                    </motion.div>
                )}

                {/* Side-by-side editors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Input */}
                    <Card>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <OneUIBadge variant="info">{leftLabel}</OneUIBadge>
                                    <span className="text-[10px] font-mono" style={{ color: palette.textTertiary }}>{left.length} chars</span>
                                </div>
                                <div className="flex gap-1">
                                    <motion.button onClick={() => copy(left, "left")} whileTap={{ scale: 0.9 }}>
                                        {copied === "left" ? <Check sx={{ fontSize: 14, color: "#34C759" }} /> : <ContentCopy sx={{ fontSize: 14, color: palette.textTertiary }} />}
                                    </motion.button>
                                    <motion.button onClick={() => setLeft("")} whileTap={{ scale: 0.9 }}>
                                        <Delete sx={{ fontSize: 14, color: palette.textTertiary }} />
                                    </motion.button>
                                </div>
                            </div>
                            <textarea
                                value={left}
                                onChange={(e) => setLeft(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-xs font-mono outline-none resize-none"
                                style={{ ...inputStyle, minHeight: 400 }}
                                spellCheck={false}
                                placeholder={direction === "json-to-js" ? '{"key": "value"}' : "{ key: 'value' }"}
                            />
                        </div>
                    </Card>

                    {/* Right: Output */}
                    <Card>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <OneUIBadge variant="success">{rightLabel}</OneUIBadge>
                                    <span className="text-[10px] font-mono" style={{ color: palette.textTertiary }}>{right.length} chars</span>
                                </div>
                                <motion.button onClick={() => copy(right, "right")} whileTap={{ scale: 0.9 }}>
                                    {copied === "right" ? <Check sx={{ fontSize: 14, color: "#34C759" }} /> : <ContentCopy sx={{ fontSize: 14, color: palette.textTertiary }} />}
                                </motion.button>
                            </div>
                            <div
                                className="w-full rounded-xl px-4 py-3 text-xs font-mono whitespace-pre-wrap overflow-auto"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                    color: palette.textPrimary,
                                    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
                                    minHeight: 400
                                }}
                            >
                                {right || "Output will appear here"}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolPageWrapper>
    );
}
