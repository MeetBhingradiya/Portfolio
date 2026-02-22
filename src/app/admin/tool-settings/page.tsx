/**
 * Admin — Tool Settings Page
 * Manage default settings for all developer tools.
 * Uses the same design system as the rest of the admin panel.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    Save,
    Refresh,
    QrCode2,
    Fingerprint,
    Password,
    DataObject,
    VpnKey,
    Code,
    Image as ImageIcon,
    PictureAsPdf,
    Lock,
    Article,
    Palette,
    ChecklistRtl,
    Check,
    Settings,
    ExpandMore,
    VisibilityOff,
    Visibility
} from "@mui/icons-material";

// ── Types ──────────────────────────────────────────────────────────

interface ToolDefaults {
    qr: {
        size: number;
        errorCorrection: string;
        dotStyle: string;
        cornerStyle: string;
        foreground: string;
        background: string;
    };
    uuid: {
        version: string;
        uppercase: boolean;
        noDashes: boolean;
        braces: boolean;
        bulkCount: number;
    };
    password: {
        mode: string;
        length: number;
        uppercase: boolean;
        lowercase: boolean;
        digits: boolean;
        symbols: boolean;
        excludeAmbiguous: boolean;
        wordCount: number;
        separator: string;
        pinLength: number;
    };
    json: {
        direction: string;
        autoFormat: boolean;
    };
    jwt: {
        defaultTab: string;
        defaultAlgorithm: string;
    };
    regexp: {
        defaultFlags: string;
        showPresets: boolean;
        defaultTab: string;
    };
    image: {
        mode: string;
        quality: number;
        maxWidth: number;
        outputFormat: string;
        pdfOrientation: string;
    };
    pdf: {
        mode: string;
    };
    encrypt: {
        algorithm: string;
        direction: string;
    };
    markdown: {
        viewMode: string;
    };
    colour: {
        defaultTab: string;
        harmony: string;
        defaultHue: number;
        defaultSaturation: number;
        defaultLightness: number;
    };
    todo: {
        defaultFilter: string;
    };
    visibility: Array<{
        toolId: string;
        enabled: boolean;
        featured: boolean;
        publicAccess: boolean;
    }>;
}

const INITIAL_DEFAULTS: ToolDefaults = {
    qr: { size: 300, errorCorrection: "M", dotStyle: "rounded", cornerStyle: "square", foreground: "#000000", background: "#FFFFFF" },
    uuid: { version: "v4", uppercase: false, noDashes: false, braces: false, bulkCount: 5 },
    password: { mode: "random", length: 16, uppercase: true, lowercase: true, digits: true, symbols: true, excludeAmbiguous: false, wordCount: 4, separator: "-", pinLength: 6 },
    json: { direction: "json-to-js", autoFormat: true },
    jwt: { defaultTab: "decode", defaultAlgorithm: "HS256" },
    regexp: { defaultFlags: "g", showPresets: false, defaultTab: "match" },
    image: { mode: "compress", quality: 0.7, maxWidth: 1920, outputFormat: "jpeg", pdfOrientation: "portrait" },
    pdf: { mode: "merge" },
    encrypt: { algorithm: "AES", direction: "encrypt" },
    markdown: { viewMode: "split" },
    colour: { defaultTab: "picker", harmony: "analogous", defaultHue: 210, defaultSaturation: 80, defaultLightness: 55 },
    todo: { defaultFilter: "all" },
    visibility: []
};

// Tool metadata for rendering sections
const TOOL_SECTIONS = [
    { id: "qr", name: "QR Generator", icon: <QrCode2 fontSize="small" />, color: "#34C759" },
    { id: "uuid", name: "UUID Generator", icon: <Fingerprint fontSize="small" />, color: "#5E97F6" },
    { id: "password", name: "Password Generator", icon: <Password fontSize="small" />, color: "#FF3B30" },
    { id: "todo", name: "Todo List", icon: <ChecklistRtl fontSize="small" />, color: "#FF9500" },
    { id: "regexp", name: "RegExp Tester", icon: <Code fontSize="small" />, color: "#FF2D55" },
    { id: "jwt", name: "JWT Debugger", icon: <VpnKey fontSize="small" />, color: "#AF52DE" },
    { id: "json", name: "JSON ↔ JS Object", icon: <DataObject fontSize="small" />, color: "#FF9500" },
    { id: "image", name: "Image Tools", icon: <ImageIcon fontSize="small" />, color: "#5AC8FA" },
    { id: "pdf", name: "PDF Tools", icon: <PictureAsPdf fontSize="small" />, color: "#FF3B30" },
    { id: "markdown", name: "Markdown Preview", icon: <Article fontSize="small" />, color: "#007AFF" },
    { id: "colour", name: "Colour Studio", icon: <Palette fontSize="small" />, color: "#FF2D55" },
    { id: "encrypt", name: "Encrypt / Decrypt", icon: <Lock fontSize="small" />, color: "#FF9500" },
];

export default function ToolSettingsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [defaults, setDefaults] = useState<ToolDefaults>(INITIAL_DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [expandedTool, setExpandedTool] = useState<string | null>("qr");

    // ── Fetch current settings ──────────────────────────────────
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/admin/tool-settings");
            const json = await res.json();
            if (json.success && json.data) {
                setDefaults((prev) => deepMerge(prev, json.data));
            }
        } catch {
            setError("Failed to load settings");
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    // ── Save settings ───────────────────────────────────────────
    const saveSettings = async () => {
        setSaving(true);
        setSaved(false);
        setError("");
        try {
            const res = await fetch("/api/admin/tool-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(defaults)
            });
            const json = await res.json();
            if (json.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            } else {
                setError(json.error || "Save failed");
            }
        } catch {
            setError("Network error");
        }
        setSaving(false);
    };

    // ── Helpers ─────────────────────────────────────────────────
    const updateTool = <T extends keyof ToolDefaults>(tool: T, patch: Partial<ToolDefaults[T]>) => {
        setDefaults((prev) => ({
            ...prev,
            [tool]: { ...prev[tool], ...patch }
        }));
    };

    const toggle = (tool: string) => {
        setExpandedTool(expandedTool === tool ? null : tool);
    };

    // ── Styles ──────────────────────────────────────────────────
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";
    const inputBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";

    const inputStyle: React.CSSProperties = {
        background: inputBg,
        color: palette.textPrimary,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 12,
        padding: "8px 14px",
        fontSize: 13,
        outline: "none",
        width: "100%"
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: "pointer"
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 700,
        color: palette.textSecondary,
        marginBottom: 4,
        display: "block"
    };

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between" style={{ background: isDark ? "rgba(15,15,15,0.92)" : "rgba(250,250,250,0.92)", backdropFilter: isApple ? "blur(20px)" : "none", borderBottom: `1px solid ${borderColor}` }}>
                <div>
                    <h1 className="text-xl font-black flex items-center gap-2" style={{ color: palette.textPrimary }}>
                        <Settings sx={{ fontSize: 22 }} /> Tool Default Settings
                    </h1>
                    <p className="text-xs mt-0.5" style={{ color: palette.textTertiary }}>
                        Configure default values for all developer tools. Users see these as initial settings.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        onClick={fetchSettings}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                        style={{ background: inputBg, color: palette.textSecondary, border: `1px solid ${borderColor}` }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Refresh sx={{ fontSize: 14 }} /> Reload
                    </motion.button>
                    <motion.button
                        onClick={saveSettings}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold"
                        style={{ background: saved ? "#34C759" : palette.accent, color: "#fff", opacity: saving ? 0.6 : 1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {saved ? <Check sx={{ fontSize: 14 }} /> : <Save sx={{ fontSize: 14 }} />}
                        {saving ? "Saving…" : saved ? "Saved!" : "Save All"}
                    </motion.button>
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-4 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "#FF3B3015", color: "#FF3B30", border: "1px solid #FF3B3030" }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Refresh sx={{ fontSize: 28, color: palette.textTertiary }} />
                    </motion.div>
                </div>
            ) : (
                <div className="p-6 space-y-3 max-w-4xl">
                    {TOOL_SECTIONS.map((tool) => (
                        <motion.div
                            key={tool.id}
                            className="rounded-2xl overflow-hidden"
                            style={{ background: cardBg, border: `1px solid ${borderColor}` }}
                            layout
                        >
                            {/* Section header */}
                            <motion.button
                                onClick={() => toggle(tool.id)}
                                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                                whileHover={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)" }}
                            >
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${tool.color}20` }}>
                                    <span style={{ color: tool.color }}>{tool.icon}</span>
                                </div>
                                <span className="flex-1 text-sm font-bold" style={{ color: palette.textPrimary }}>{tool.name}</span>
                                <motion.div animate={{ rotate: expandedTool === tool.id ? 180 : 0 }}>
                                    <ExpandMore sx={{ fontSize: 18, color: palette.textTertiary }} />
                                </motion.div>
                            </motion.button>

                            {/* Expanded settings */}
                            <AnimatePresence>
                                {expandedTool === tool.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 pt-1">
                                            {renderToolSettings(tool.id, defaults, updateTool, inputStyle, selectStyle, labelStyle, palette, isDark)}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Render per-tool setting controls ────────────────────────────────────

function renderToolSettings(
    toolId: string,
    defaults: ToolDefaults,
    updateTool: <T extends keyof ToolDefaults>(tool: T, patch: Partial<ToolDefaults[T]>) => void,
    inputStyle: React.CSSProperties,
    selectStyle: React.CSSProperties,
    labelStyle: React.CSSProperties,
    palette: any,
    isDark: boolean
) {
    const grid = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

    switch (toolId) {
        case "qr": {
            const d = defaults.qr;
            return (
                <div className={grid}>
                    <Field label="Default Size (px)">
                        <input type="number" value={d.size} min={100} max={2048} onChange={(e) => updateTool("qr", { size: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Error Correction">
                        <select value={d.errorCorrection} onChange={(e) => updateTool("qr", { errorCorrection: e.target.value })} style={selectStyle}>
                            {["L", "M", "Q", "H"].map((v) => <option key={v} value={v}>{v} — {({ L: "Low (7%)", M: "Medium (15%)", Q: "Quartile (25%)", H: "High (30%)" } as any)[v]}</option>)}
                        </select>
                    </Field>
                    <Field label="Dot Style">
                        <select value={d.dotStyle} onChange={(e) => updateTool("qr", { dotStyle: e.target.value })} style={selectStyle}>
                            {["rounded", "dots", "classy", "classy-rounded", "square", "extra-rounded"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Corner Style">
                        <select value={d.cornerStyle} onChange={(e) => updateTool("qr", { cornerStyle: e.target.value })} style={selectStyle}>
                            {["square", "dot", "extra-rounded"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Foreground Color">
                        <div className="flex gap-2 items-center">
                            <input type="color" value={d.foreground} onChange={(e) => updateTool("qr", { foreground: e.target.value })} className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
                            <input type="text" value={d.foreground} onChange={(e) => updateTool("qr", { foreground: e.target.value })} style={inputStyle} />
                        </div>
                    </Field>
                    <Field label="Background Color">
                        <div className="flex gap-2 items-center">
                            <input type="color" value={d.background} onChange={(e) => updateTool("qr", { background: e.target.value })} className="w-8 h-8 rounded-lg border-0 cursor-pointer" />
                            <input type="text" value={d.background} onChange={(e) => updateTool("qr", { background: e.target.value })} style={inputStyle} />
                        </div>
                    </Field>
                </div>
            );
        }

        case "uuid": {
            const d = defaults.uuid;
            return (
                <div className={grid}>
                    <Field label="Default Version">
                        <select value={d.version} onChange={(e) => updateTool("uuid", { version: e.target.value })} style={selectStyle}>
                            {["v1", "v4", "v5", "nil"].map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                        </select>
                    </Field>
                    <Field label="Default Bulk Count">
                        <input type="number" value={d.bulkCount} min={1} max={100} onChange={(e) => updateTool("uuid", { bulkCount: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Format Options">
                        <div className="flex flex-col gap-2">
                            <Toggle label="Uppercase" checked={d.uppercase} onChange={(v) => updateTool("uuid", { uppercase: v })} palette={palette} isDark={isDark} />
                            <Toggle label="No dashes" checked={d.noDashes} onChange={(v) => updateTool("uuid", { noDashes: v })} palette={palette} isDark={isDark} />
                            <Toggle label="Braces {}" checked={d.braces} onChange={(v) => updateTool("uuid", { braces: v })} palette={palette} isDark={isDark} />
                        </div>
                    </Field>
                </div>
            );
        }

        case "password": {
            const d = defaults.password;
            return (
                <div className={grid}>
                    <Field label="Default Mode">
                        <select value={d.mode} onChange={(e) => updateTool("password", { mode: e.target.value })} style={selectStyle}>
                            {["random", "passphrase", "pin"].map((v) => <option key={v} value={v}>{v === "pin" ? "PIN" : v}</option>)}
                        </select>
                    </Field>
                    <Field label="Password Length">
                        <input type="number" value={d.length} min={4} max={128} onChange={(e) => updateTool("password", { length: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Passphrase Words">
                        <input type="number" value={d.wordCount} min={3} max={12} onChange={(e) => updateTool("password", { wordCount: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="PIN Length">
                        <input type="number" value={d.pinLength} min={4} max={12} onChange={(e) => updateTool("password", { pinLength: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Separator">
                        <select value={d.separator} onChange={(e) => updateTool("password", { separator: e.target.value })} style={selectStyle}>
                            {["-", "_", ".", " ", ""].map((s) => <option key={s} value={s}>{s === "" ? "none" : s === " " ? "space" : `"${s}"`}</option>)}
                        </select>
                    </Field>
                    <Field label="Character Types">
                        <div className="flex flex-col gap-2">
                            <Toggle label="Uppercase A-Z" checked={d.uppercase} onChange={(v) => updateTool("password", { uppercase: v })} palette={palette} isDark={isDark} />
                            <Toggle label="Lowercase a-z" checked={d.lowercase} onChange={(v) => updateTool("password", { lowercase: v })} palette={palette} isDark={isDark} />
                            <Toggle label="Digits 0-9" checked={d.digits} onChange={(v) => updateTool("password", { digits: v })} palette={palette} isDark={isDark} />
                            <Toggle label="Symbols !@#$" checked={d.symbols} onChange={(v) => updateTool("password", { symbols: v })} palette={palette} isDark={isDark} />
                            <Toggle label="Exclude ambiguous" checked={d.excludeAmbiguous} onChange={(v) => updateTool("password", { excludeAmbiguous: v })} palette={palette} isDark={isDark} />
                        </div>
                    </Field>
                </div>
            );
        }

        case "todo": {
            const d = defaults.todo;
            return (
                <div className={grid}>
                    <Field label="Default Filter">
                        <select value={d.defaultFilter} onChange={(e) => updateTool("todo", { defaultFilter: e.target.value })} style={selectStyle}>
                            {["all", "active", "completed"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                </div>
            );
        }

        case "regexp": {
            const d = defaults.regexp;
            return (
                <div className={grid}>
                    <Field label="Default Flags">
                        <input type="text" value={d.defaultFlags} onChange={(e) => updateTool("regexp", { defaultFlags: e.target.value })} placeholder="g, gi, gm…" style={inputStyle} />
                    </Field>
                    <Field label="Default Tab">
                        <select value={d.defaultTab} onChange={(e) => updateTool("regexp", { defaultTab: e.target.value })} style={selectStyle}>
                            {["match", "replace"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Options">
                        <Toggle label="Show presets by default" checked={d.showPresets} onChange={(v) => updateTool("regexp", { showPresets: v })} palette={palette} isDark={isDark} />
                    </Field>
                </div>
            );
        }

        case "jwt": {
            const d = defaults.jwt;
            return (
                <div className={grid}>
                    <Field label="Default Tab">
                        <select value={d.defaultTab} onChange={(e) => updateTool("jwt", { defaultTab: e.target.value })} style={selectStyle}>
                            {["decode", "build", "reference"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Default Algorithm">
                        <select value={d.defaultAlgorithm} onChange={(e) => updateTool("jwt", { defaultAlgorithm: e.target.value })} style={selectStyle}>
                            {["HS256", "HS384", "HS512", "RS256", "ES256", "EdDSA"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                </div>
            );
        }

        case "json": {
            const d = defaults.json;
            return (
                <div className={grid}>
                    <Field label="Default Direction">
                        <select value={d.direction} onChange={(e) => updateTool("json", { direction: e.target.value })} style={selectStyle}>
                            <option value="json-to-js">JSON → JS Object</option>
                            <option value="js-to-json">JS Object → JSON</option>
                        </select>
                    </Field>
                    <Field label="Options">
                        <Toggle label="Auto-format on load" checked={d.autoFormat} onChange={(v) => updateTool("json", { autoFormat: v })} palette={palette} isDark={isDark} />
                    </Field>
                </div>
            );
        }

        case "image": {
            const d = defaults.image;
            return (
                <div className={grid}>
                    <Field label="Default Mode">
                        <select value={d.mode} onChange={(e) => updateTool("image", { mode: e.target.value })} style={selectStyle}>
                            <option value="compress">Compress</option>
                            <option value="to-pdf">Images → PDF</option>
                        </select>
                    </Field>
                    <Field label="Compression Quality">
                        <div className="flex items-center gap-2">
                            <input type="range" min={0.1} max={1} step={0.05} value={d.quality} onChange={(e) => updateTool("image", { quality: Number(e.target.value) })} className="flex-1" style={{ accentColor: palette.accent }} />
                            <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{Math.round(d.quality * 100)}%</span>
                        </div>
                    </Field>
                    <Field label="Max Width (px)">
                        <input type="number" value={d.maxWidth} min={320} max={3840} step={160} onChange={(e) => updateTool("image", { maxWidth: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Output Format">
                        <select value={d.outputFormat} onChange={(e) => updateTool("image", { outputFormat: e.target.value })} style={selectStyle}>
                            {["jpeg", "png", "webp"].map((v) => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                        </select>
                    </Field>
                    <Field label="PDF Orientation">
                        <select value={d.pdfOrientation} onChange={(e) => updateTool("image", { pdfOrientation: e.target.value })} style={selectStyle}>
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                    </Field>
                </div>
            );
        }

        case "pdf": {
            const d = defaults.pdf;
            return (
                <div className={grid}>
                    <Field label="Default Mode">
                        <select value={d.mode} onChange={(e) => updateTool("pdf", { mode: e.target.value })} style={selectStyle}>
                            <option value="merge">Merge</option>
                            <option value="split">Split / Extract</option>
                        </select>
                    </Field>
                </div>
            );
        }

        case "markdown": {
            const d = defaults.markdown;
            return (
                <div className={grid}>
                    <Field label="Default View Mode">
                        <select value={d.viewMode} onChange={(e) => updateTool("markdown", { viewMode: e.target.value })} style={selectStyle}>
                            {["split", "editor", "preview"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                </div>
            );
        }

        case "colour": {
            const d = defaults.colour;
            return (
                <div className={grid}>
                    <Field label="Default Tab">
                        <select value={d.defaultTab} onChange={(e) => updateTool("colour", { defaultTab: e.target.value })} style={selectStyle}>
                            {["picker", "palette", "contrast"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Default Harmony">
                        <select value={d.harmony} onChange={(e) => updateTool("colour", { harmony: e.target.value })} style={selectStyle}>
                            {["complementary", "analogous", "triadic", "split-comp", "tetradic"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Default Hue">
                        <div className="flex items-center gap-2">
                            <input type="range" min={0} max={360} value={d.defaultHue} onChange={(e) => updateTool("colour", { defaultHue: Number(e.target.value) })} className="flex-1" style={{ accentColor: `hsl(${d.defaultHue}, 80%, 55%)` }} />
                            <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{d.defaultHue}°</span>
                        </div>
                    </Field>
                    <Field label="Default Saturation">
                        <div className="flex items-center gap-2">
                            <input type="range" min={0} max={100} value={d.defaultSaturation} onChange={(e) => updateTool("colour", { defaultSaturation: Number(e.target.value) })} className="flex-1" style={{ accentColor: palette.accent }} />
                            <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{d.defaultSaturation}%</span>
                        </div>
                    </Field>
                    <Field label="Default Lightness">
                        <div className="flex items-center gap-2">
                            <input type="range" min={0} max={100} value={d.defaultLightness} onChange={(e) => updateTool("colour", { defaultLightness: Number(e.target.value) })} className="flex-1" style={{ accentColor: palette.accent }} />
                            <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{d.defaultLightness}%</span>
                        </div>
                    </Field>
                </div>
            );
        }

        case "encrypt": {
            const d = defaults.encrypt;
            return (
                <div className={grid}>
                    <Field label="Default Algorithm">
                        <select value={d.algorithm} onChange={(e) => updateTool("encrypt", { algorithm: e.target.value })} style={selectStyle}>
                            {["AES", "DES", "TripleDES", "Rabbit", "RC4"].map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </Field>
                    <Field label="Default Direction">
                        <select value={d.direction} onChange={(e) => updateTool("encrypt", { direction: e.target.value })} style={selectStyle}>
                            <option value="encrypt">Encrypt</option>
                            <option value="decrypt">Decrypt</option>
                        </select>
                    </Field>
                </div>
            );
        }

        default:
            return <p className="text-xs" style={{ color: palette.textTertiary }}>No configurable defaults.</p>;
    }
}

// ── Reusable UI atoms ───────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-[11px] font-bold mb-1 block" style={{ color: "inherit", opacity: 0.7 }}>{label}</label>
            {children}
        </div>
    );
}

function Toggle({ label, checked, onChange, palette, isDark }: { label: string; checked: boolean; onChange: (v: boolean) => void; palette: any; isDark: boolean }) {
    return (
        <motion.button
            onClick={() => onChange(!checked)}
            className="flex items-center gap-2 text-xs font-semibold"
            style={{ color: checked ? palette.accent : palette.textTertiary }}
            whileTap={{ scale: 0.97 }}
        >
            <span
                className="w-4 h-4 rounded-md flex items-center justify-center"
                style={{
                    border: `2px solid ${checked ? palette.accent : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                    background: checked ? `${palette.accent}20` : "transparent"
                }}
            >
                {checked && <Check sx={{ fontSize: 10, color: palette.accent }} />}
            </span>
            {label}
        </motion.button>
    );
}

// ── Deep merge helper ───────────────────────────────────────────────────

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (key === "_id" || key === "__v" || key === "ConfigID") continue;
        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key]) &&
            target[key] &&
            typeof target[key] === "object" &&
            !Array.isArray(target[key])
        ) {
            (result as any)[key] = deepMerge(target[key], source[key]);
        } else if (source[key] !== undefined) {
            (result as any)[key] = source[key];
        }
    }
    return result;
}
