/**
 * UUID Generator — /tools/uuid
 * Generate v1, v4, v5 UUIDs and NIL with bulk generation,
 * format options and history tracking.
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { v1, v4, v5, validate, version, NIL } from "uuid";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Fingerprint,
    ContentCopy,
    Check,
    Delete,
    Download,
    Refresh,
    History
} from "@mui/icons-material";

type UUIDVersion = "v1" | "v4" | "v5" | "nil";

interface GeneratedUUID {
    value: string;
    version: UUIDVersion;
    timestamp: number;
}

const UUID_NS_DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

export default function UUIDPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [uuidVersion, setUuidVersion] = useState<UUIDVersion>("v4");
    const [count, setCount] = useState(1);
    const [uppercase, setUppercase] = useState(false);
    const [noDashes, setNoDashes] = useState(false);
    const [braces, setBraces] = useState(false);
    const [generated, setGenerated] = useState<GeneratedUUID[]>([]);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.uuid) return;
        defaultsApplied.current = true;
        const d = toolDefaults.uuid;
        if (d.version) setUuidVersion(d.version as UUIDVersion);
        if (d.bulkCount != null) setCount(d.bulkCount);
        if (d.uppercase != null) setUppercase(d.uppercase);
        if (d.noDashes != null) setNoDashes(d.noDashes);
        if (d.braces != null) setBraces(d.braces);
    }, [toolDefaults]);
    const [history, setHistory] = useState<GeneratedUUID[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [v5Name, setV5Name] = useState("");
    const [v5Namespace, setV5Namespace] = useState(UUID_NS_DNS);
    const [validateInput, setValidateInput] = useState("");
    const [validationResult, setValidationResult] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const formatUUID = useCallback(
        (raw: string): string => {
            let result = raw;
            if (uppercase) result = result.toUpperCase();
            if (noDashes) result = result.replace(/-/g, "");
            if (braces) result = `{${result}}`;
            return result;
        },
        [uppercase, noDashes, braces]
    );

    const generate = useCallback(() => {
        const results: GeneratedUUID[] = [];
        for (let i = 0; i < count; i++) {
            let value: string;
            switch (uuidVersion) {
                case "v1":
                    value = v1();
                    break;
                case "v5":
                    value = v5(v5Name || "default", v5Namespace || UUID_NS_DNS);
                    break;
                case "nil":
                    value = NIL;
                    break;
                default:
                    value = v4();
            }
            results.push({ value: formatUUID(value), version: uuidVersion, timestamp: Date.now() });
        }
        setGenerated(results);
        setHistory((prev) => [...results, ...prev].slice(0, 50));
    }, [uuidVersion, count, formatUUID, v5Name, v5Namespace]);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 1200);
    };

    const copyAll = () => {
        const text = generated.map((g) => g.value).join("\n");
        copy(text);
    };

    const doValidate = () => {
        if (!validateInput.trim()) return;
        const clean = validateInput.trim().replace(/[{}]/g, "");
        if (validate(clean)) {
            const ver = version(clean);
            setValidationResult(`Valid UUID v${ver}`);
        } else {
            setValidationResult("Invalid UUID");
        }
    };

    const exportHistory = () => {
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "uuid-history.json";
        a.click();
    };

    const versions: { value: UUIDVersion; label: string; desc: string }[] = [
        { value: "v1", label: "v1", desc: "Timestamp-based" },
        { value: "v4", label: "v4", desc: "Random" },
        { value: "v5", label: "v5", desc: "Name-based (SHA-1)" },
        { value: "nil", label: "NIL", desc: "All zeros" }
    ];

    return (
        <ToolPageWrapper
            title="UUID Generator"
            description="Generate v1, v4, v5 and NIL identifiers"
            icon={<Fingerprint sx={{ fontSize: 24 }} />}
            accentColor="#5E97F6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left : Config ── */}
                <div className="lg:col-span-1 space-y-5">
                    <Card>
                        <div className="space-y-4">
                            <h3 className={`${isApple ? "text-base font-semibold" : "text-lg font-black"}`} style={{ color: palette.textPrimary }}>
                                Version
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {versions.map((ver) => (
                                    <motion.button
                                        key={ver.value}
                                        onClick={() => setUuidVersion(ver.value)}
                                        className="flex flex-col items-start p-3 rounded-2xl text-left"
                                        style={{
                                            background: uuidVersion === ver.value ? `${palette.accent}18` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                            border: `1.5px solid ${uuidVersion === ver.value ? `${palette.accent}40` : "transparent"}`,
                                            borderRadius: isApple ? "12px" : "16px"
                                        }}
                                        whileTap={{ scale: 0.96 }}
                                    >
                                        <span className="text-sm font-bold" style={{ color: uuidVersion === ver.value ? palette.accent : palette.textPrimary }}>{ver.label}</span>
                                        <span className="text-[10px]" style={{ color: palette.textTertiary }}>{ver.desc}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {uuidVersion === "v5" && (
                                <div className="space-y-3 mt-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Name</label>
                                        <input value={v5Name} onChange={(e) => setV5Name(e.target.value)} placeholder="Enter name" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}` }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Namespace</label>
                                        <input value={v5Namespace} onChange={(e) => setV5Namespace(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm font-mono outline-none" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="space-y-4">
                            <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>Options</h3>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Count: {count}</label>
                                <input type="range" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full" style={{ accentColor: palette.accent }} />
                            </div>
                            {[
                                { label: "Uppercase", checked: uppercase, toggle: () => setUppercase((p) => !p) },
                                { label: "Remove dashes", checked: noDashes, toggle: () => setNoDashes((p) => !p) },
                                { label: "Add braces { }", checked: braces, toggle: () => setBraces((p) => !p) }
                            ].map((opt) => (
                                <label key={opt.label} className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm" style={{ color: palette.textSecondary }}>{opt.label}</span>
                                    <motion.div
                                        onClick={opt.toggle}
                                        className="w-10 h-6 rounded-full relative cursor-pointer"
                                        style={{ background: opt.checked ? palette.accent : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white" animate={{ left: opt.checked ? 20 : 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                                    </motion.div>
                                </label>
                            ))}
                        </div>
                    </Card>

                    <motion.button
                        onClick={generate}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full text-base font-bold"
                        style={{ background: `linear-gradient(135deg, #5E97F6, #4285F4)`, color: "#fff" }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <Refresh sx={{ fontSize: 20 }} />
                        Generate {count > 1 ? `${count} UUIDs` : "UUID"}
                    </motion.button>
                </div>

                {/* ── Right : Output ── */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Generated UUIDs */}
                    <Card>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className={`${isApple ? "text-base font-semibold" : "text-lg font-black"}`} style={{ color: palette.textPrimary }}>
                                    Generated ({generated.length})
                                </h3>
                                {generated.length > 1 && (
                                    <motion.button onClick={copyAll} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: `${palette.accent}18`, color: palette.accent }} whileTap={{ scale: 0.95 }}>
                                        Copy All
                                    </motion.button>
                                )}
                            </div>

                            {generated.length === 0 ? (
                                <p className="text-center py-10 text-sm" style={{ color: palette.textTertiary }}>
                                    Click Generate to create UUIDs
                                </p>
                            ) : (
                                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                                    {generated.map((g, i) => (
                                        <motion.div
                                            key={`${g.value}-${i}`}
                                            initial={{ opacity: 0, x: 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`
                                            }}
                                        >
                                            <code className="text-sm font-mono break-all" style={{ color: palette.textPrimary }}>{g.value}</code>
                                            <motion.button onClick={() => copy(g.value)} whileTap={{ scale: 0.9 }} style={{ color: copied === g.value ? "#34C759" : palette.textTertiary, flexShrink: 0, marginLeft: 8 }}>
                                                {copied === g.value ? <Check sx={{ fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Validate */}
                    <Card>
                        <div className="space-y-3">
                            <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>Validate</h3>
                            <div className="flex gap-2">
                                <input
                                    value={validateInput}
                                    onChange={(e) => { setValidateInput(e.target.value); setValidationResult(null); }}
                                    onKeyDown={(e) => e.key === "Enter" && doValidate()}
                                    placeholder="Paste a UUID to validate…"
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono outline-none"
                                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", color: palette.textPrimary, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}` }}
                                />
                                <motion.button onClick={doValidate} className="px-4 rounded-full text-sm font-bold" style={{ background: palette.accent, color: "#fff" }} whileTap={{ scale: 0.95 }}>
                                    Check
                                </motion.button>
                            </div>
                            {validationResult && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold" style={{ color: validationResult.startsWith("Valid") ? "#34C759" : "#FF3B30" }}>
                                    {validationResult}
                                </motion.p>
                            )}
                        </div>
                    </Card>

                    {/* History */}
                    <Card>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>
                                    <History sx={{ fontSize: 16, marginRight: 4 }} />
                                    History ({history.length})
                                </h3>
                                <div className="flex gap-2">
                                    {history.length > 0 && (
                                        <>
                                            <motion.button onClick={exportHistory} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)", color: palette.textSecondary }} whileTap={{ scale: 0.95 }}>
                                                <Download sx={{ fontSize: 14 }} /> JSON
                                            </motion.button>
                                            <motion.button onClick={() => setHistory([])} className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(255,59,48,.12)", color: "#FF3B30" }} whileTap={{ scale: 0.95 }}>
                                                Clear
                                            </motion.button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                {history.slice(0, 20).map((h, i) => (
                                    <div key={`${h.value}-${h.timestamp}-${i}`} className="flex items-center justify-between py-1">
                                        <code className="text-xs font-mono truncate" style={{ color: palette.textSecondary }}>{h.value}</code>
                                        <OneUIBadge variant="neutral">{h.version}</OneUIBadge>
                                    </div>
                                ))}
                                {history.length === 0 && (
                                    <p className="text-xs text-center py-4" style={{ color: palette.textTertiary }}>No history yet</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolPageWrapper>
    );
}
