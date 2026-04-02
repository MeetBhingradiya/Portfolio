/**
 * RegExp Tester — /tools/regexp
 * Real-time regex matching, flag toggles, preset patterns,
 * capture-group highlighting and find & replace.
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import { Code, ContentCopy, Check, AutoFixHigh, FindReplace, BookmarkBorder, ExpandMore } from "@mui/icons-material";

interface RegExpState {
    pattern: string;
    flags: string;
    testString: string;
    replaceWith: string;
}

interface MatchResult {
    match: string;
    index: number;
    groups: string[];
}

const FLAG_OPTIONS = [
    { flag: "g", label: "Global", desc: "Find all matches" },
    { flag: "i", label: "Case-insensitive", desc: "Ignore case" },
    { flag: "m", label: "Multiline", desc: "^ and $ match line boundaries" },
    { flag: "s", label: "Dotall", desc: ". matches newlines" },
    { flag: "u", label: "Unicode", desc: "Unicode support" },
    { flag: "y", label: "Sticky", desc: "Match from lastIndex" }
];

const PRESETS: { label: string; pattern: string; flags: string }[] = [
    {
        label: "Email",
        pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        flags: "gi"
    },
    {
        label: "URL",
        pattern: "https?://[\\w\\-]+(\\.[\\w\\-]+)+([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?",
        flags: "gi"
    },
    { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g" },
    { label: "Phone", pattern: "\\+?[\\d\\s\\-().]{7,15}", flags: "g" },
    {
        label: "Hex Colour",
        pattern: "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b",
        flags: "gi"
    },
    { label: "HTML Tag", pattern: "<\\/?[a-z][a-z0-9]*[^>]*>", flags: "gi" },
    {
        label: "Date (YYYY-MM-DD)",
        pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])",
        flags: "g"
    },
    {
        label: "UUID",
        pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        flags: "gi"
    },
    { label: "Credit Card", pattern: "\\b(?:\\d[ -]*?){13,19}\\b", flags: "g" },
    {
        label: "Password Strength",
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        flags: ""
    }
];

export default function RegExpPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [state, setState] = useState<RegExpState>({
        pattern: "",
        flags: "g",
        testString: "Hello world! Email me at test@example.com or visit https://example.com",
        replaceWith: ""
    });
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [activeTab, setActiveTab] = useState<"match" | "replace">("match");
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.regexp) return;
        defaultsApplied.current = true;
        const d = toolDefaults.regexp;
        if (d.defaultFlags) setState((p) => ({ ...p, flags: d.defaultFlags! }));
        if (d.showPresets != null) setShowPresets(d.showPresets);
        if (d.defaultTab) setActiveTab(d.defaultTab as "match" | "replace");
    }, [toolDefaults]);

    const update = useCallback((patch: Partial<RegExpState>) => {
        setState((p) => ({ ...p, ...patch }));
    }, []);

    const toggleFlag = (flag: string) => {
        const flags = state.flags.includes(flag) ? state.flags.replace(flag, "") : state.flags + flag;
        update({ flags });
    };

    // ── Run regex ────────────────────────────────────────────────────────────
    const { matches, highlightedText, replaceResult } = useMemo(() => {
        const result: {
            matches: MatchResult[];
            highlightedText: string;
            replaceResult: string;
        } = {
            matches: [],
            highlightedText: state.testString,
            replaceResult: ""
        };

        if (!state.pattern) {
            setError(null);
            return result;
        }

        try {
            const regex = new RegExp(state.pattern, state.flags.includes("g") ? state.flags : state.flags + "g");
            setError(null);

            let match: RegExpExecArray | null;
            const testRegex = new RegExp(state.pattern, state.flags.includes("g") ? state.flags : state.flags + "g");

            while ((match = testRegex.exec(state.testString)) !== null) {
                result.matches.push({
                    match: match[0],
                    index: match.index,
                    groups: match.slice(1)
                });
                if (!state.flags.includes("g")) break;
            }

            // Build highlighted text
            if (result.matches.length > 0) {
                let html = "";
                let lastIndex = 0;
                for (const m of result.matches) {
                    html += escapeHtml(state.testString.slice(lastIndex, m.index));
                    html += `<mark style="background:${palette.accent}40;color:${palette.textPrimary};border-radius:4px;padding:0 2px">${escapeHtml(m.match)}</mark>`;
                    lastIndex = m.index + m.match.length;
                }
                html += escapeHtml(state.testString.slice(lastIndex));
                result.highlightedText = html;
            }

            // Replace
            if (state.replaceWith !== undefined) {
                try {
                    const replaceRegex = new RegExp(state.pattern, state.flags);
                    result.replaceResult = state.testString.replace(replaceRegex, state.replaceWith);
                } catch {
                    /* ignore */
                }
            }
        } catch (e: any) {
            setError(e.message);
        }

        return result;
    }, [state, palette]);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    return (
        <ToolPageWrapper
            title="RegExp Tester"
            description="Test, explore and share regular expressions"
            icon={<Code sx={{ fontSize: 24 }} />}
            accentColor="#FF2D55">
            <div className="space-y-6">
                {/* ── Pattern input ── */}
                <Card>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span
                                className="text-lg font-mono"
                                style={{ color: palette.textTertiary }}>
                                /
                            </span>
                            <input
                                value={state.pattern}
                                onChange={(e) => update({ pattern: e.target.value })}
                                placeholder="Enter regex pattern…"
                                className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                    color: palette.textPrimary,
                                    border: `1.5px solid ${error ? "#FF3B30" : isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
                                }}
                            />
                            <span
                                className="text-lg font-mono"
                                style={{ color: palette.textTertiary }}>
                                /{state.flags}
                            </span>
                            <motion.button
                                onClick={() => copy(`/${state.pattern}/${state.flags}`)}
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    color: copied ? "#34C759" : palette.textTertiary
                                }}>
                                {copied ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                            </motion.button>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs font-bold"
                                style={{ color: "#FF3B30" }}>
                                {error}
                            </motion.p>
                        )}

                        {/* Flags */}
                        <div className="flex flex-wrap gap-2">
                            {FLAG_OPTIONS.map((f) => (
                                <motion.button
                                    key={f.flag}
                                    onClick={() => toggleFlag(f.flag)}
                                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                                    title={f.desc}
                                    style={{
                                        background: state.flags.includes(f.flag)
                                            ? `${palette.accent}20`
                                            : isDark
                                              ? "rgba(255,255,255,0.06)"
                                              : "rgba(0,0,0,0.04)",
                                        color: state.flags.includes(f.flag) ? palette.accent : palette.textTertiary,
                                        border: `1px solid ${state.flags.includes(f.flag) ? `${palette.accent}40` : "transparent"}`
                                    }}
                                    whileTap={{ scale: 0.95 }}>
                                    {f.flag} — {f.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* ── Presets ── */}
                <Card>
                    <motion.button
                        onClick={() => setShowPresets(!showPresets)}
                        className="flex items-center justify-between w-full">
                        <span
                            className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                            style={{ color: palette.textPrimary }}>
                            <BookmarkBorder sx={{ fontSize: 16, marginRight: 4 }} />
                            Preset Patterns ({PRESETS.length})
                        </span>
                        <motion.div animate={{ rotate: showPresets ? 180 : 0 }}>
                            <ExpandMore
                                sx={{
                                    fontSize: 20,
                                    color: palette.textTertiary
                                }}
                            />
                        </motion.div>
                    </motion.button>

                    <AnimatePresence>
                        {showPresets && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                                    {PRESETS.map((p) => (
                                        <motion.button
                                            key={p.label}
                                            onClick={() =>
                                                update({
                                                    pattern: p.pattern,
                                                    flags: p.flags
                                                })
                                            }
                                            className="px-3 py-2 rounded-xl text-xs font-bold text-left"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                                color: palette.textSecondary,
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`
                                            }}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}>
                                            {p.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ── Test string ── */}
                    <Card>
                        <div className="space-y-3">
                            <h3
                                className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                Test String
                            </h3>
                            <textarea
                                value={state.testString}
                                onChange={(e) => update({ testString: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none font-mono"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                    color: palette.textPrimary,
                                    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
                                }}
                            />

                            {/* Highlighted preview */}
                            {state.pattern && matches.length > 0 && (
                                <div className="space-y-1.5">
                                    <label
                                        className="text-xs font-bold"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Highlighted
                                    </label>
                                    <div
                                        className="px-4 py-3 rounded-xl text-sm font-mono whitespace-pre-wrap"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                            color: palette.textPrimary,
                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: highlightedText
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* ── Matches + Replace ── */}
                    <div className="space-y-5">
                        {/* Tab toggle */}
                        <div className="flex gap-1.5">
                            {(["match", "replace"] as const).map((tab) => (
                                <motion.button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className="px-4 py-2 rounded-full text-sm font-bold capitalize"
                                    style={{
                                        background:
                                            activeTab === tab ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                        color: activeTab === tab ? "#fff" : palette.textSecondary
                                    }}
                                    whileTap={{ scale: 0.95 }}>
                                    {tab === "match" ? (
                                        <AutoFixHigh
                                            sx={{
                                                fontSize: 14,
                                                marginRight: 4
                                            }}
                                        />
                                    ) : (
                                        <FindReplace
                                            sx={{
                                                fontSize: 14,
                                                marginRight: 4
                                            }}
                                        />
                                    )}
                                    {tab} {tab === "match" && `(${matches.length})`}
                                </motion.button>
                            ))}
                        </div>

                        <Card>
                            {activeTab === "match" ? (
                                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                                    {matches.length === 0 ? (
                                        <p
                                            className="text-center py-8 text-sm"
                                            style={{
                                                color: palette.textTertiary
                                            }}>
                                            {state.pattern ? "No matches" : "Enter a pattern above"}
                                        </p>
                                    ) : (
                                        matches.map((m, i) => (
                                            <motion.div
                                                key={`${i}-${m.index}`}
                                                initial={{ opacity: 0, x: 8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="px-3 py-2 rounded-xl"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`
                                                }}>
                                                <div className="flex items-center justify-between">
                                                    <code
                                                        className="text-sm font-mono"
                                                        style={{
                                                            color: palette.accent
                                                        }}>
                                                        {m.match}
                                                    </code>
                                                    <span
                                                        className="text-[10px] font-mono"
                                                        style={{
                                                            color: palette.textTertiary
                                                        }}>
                                                        @{m.index}
                                                    </span>
                                                </div>
                                                {m.groups.length > 0 && (
                                                    <div className="flex gap-1.5 mt-1.5">
                                                        {m.groups.map((g, gi) => (
                                                            <OneUIBadge
                                                                key={gi}
                                                                variant="neutral">
                                                                ${gi + 1}: {g ?? "undefined"}
                                                            </OneUIBadge>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label
                                            className="text-xs font-bold"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Replace with
                                        </label>
                                        <input
                                            value={state.replaceWith}
                                            onChange={(e) =>
                                                update({
                                                    replaceWith: e.target.value
                                                })
                                            }
                                            placeholder="Replacement string ($1 for groups)"
                                            className="w-full px-4 py-2.5 rounded-xl text-sm font-mono outline-none"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                color: palette.textPrimary,
                                                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label
                                            className="text-xs font-bold"
                                            style={{
                                                color: palette.textSecondary
                                            }}>
                                            Result
                                        </label>
                                        <div
                                            className="px-4 py-3 rounded-xl text-sm font-mono whitespace-pre-wrap"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                                color: palette.textPrimary,
                                                minHeight: 80
                                            }}>
                                            {replaceResult || state.testString}
                                        </div>
                                    </div>
                                    <motion.button
                                        onClick={() => copy(replaceResult)}
                                        className="px-4 py-2 rounded-full text-xs font-bold"
                                        style={{
                                            background: palette.accent,
                                            color: "#fff"
                                        }}
                                        whileTap={{ scale: 0.95 }}>
                                        Copy Result
                                    </motion.button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </ToolPageWrapper>
    );
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
