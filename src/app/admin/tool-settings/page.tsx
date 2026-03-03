/**
 * Admin — Tool Settings Page
 * Redesigned to match the Features page design system.
 * Manage default settings and visibility for all developer tools.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    Save,
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
    Tag,
    CheckCircle,
    ExpandMore,
    Visibility,
    Star,
    Public,
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
    { id: "hash", name: "Hash Generator", icon: <Tag fontSize="small" />, color: "#FFCC00" },
];


export default function ToolSettingsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [defaults, setDefaults] = useState<ToolDefaults>(INITIAL_DEFAULTS);
    const [ui, setUi] = useState({
        loading: true,
        saving: false,
        saved: false,
        error: "",
        expandedTool: null as string | null,
        visibilityOpen: false,
    });
    const patchUi = useCallback((p: Partial<typeof ui>) => setUi(s => ({ ...s, ...p })), []);

    const getVisibility = (toolId: string) => {
        const found = defaults.visibility?.find((v) => v.toolId === toolId);
        return found ?? { toolId, enabled: true, featured: false, publicAccess: true };
    };

    const updateVisibility = (toolId: string, patch: Partial<{ enabled: boolean; featured: boolean; publicAccess: boolean }>) => {
        setDefaults((prev) => {
            const existing = prev.visibility ?? [];
            const idx = existing.findIndex((v) => v.toolId === toolId);
            const base = idx >= 0 ? existing[idx] : { toolId, enabled: true, featured: false, publicAccess: true };
            const updated = { ...base, ...patch };
            const next = idx >= 0
                ? existing.map((v, i) => (i === idx ? updated : v))
                : [...existing, updated];
            return { ...prev, visibility: next };
        });
    };

    const fetchSettings = useCallback(async () => {
        patchUi({ loading: true, error: "" });
        try {
            const res = await fetch("/api/admin/tool-settings");
            const json = await res.json();
            if (json.success && json.data) setDefaults((prev) => deepMerge(prev, json.data));
        } catch { patchUi({ error: "Failed to load settings" }); }
        patchUi({ loading: false });
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const saveSettings = async () => {
        patchUi({ saving: true, saved: false, error: "" });
        try {
            const res = await fetch("/api/admin/tool-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(defaults),
            });
            const json = await res.json();
            if (json.success) { patchUi({ saved: true }); setTimeout(() => patchUi({ saved: false }), 2500); }
            else patchUi({ error: json.error || "Save failed" });
        } catch { patchUi({ error: "Network error" }); }
        patchUi({ saving: false });
    };

    const updateTool = <T extends keyof ToolDefaults>(tool: T, patch: Partial<ToolDefaults[T]>) =>
        setDefaults((prev) => ({ ...prev, [tool]: { ...prev[tool], ...patch } }));

    const toggleAccordion = (id: string) => setUi(s => ({ ...s, expandedTool: s.expandedTool === id ? null : id }));

    // ── "Select all" derived state ──────────────────────────────────────
    const allEnabled  = TOOL_SECTIONS.every((t) => getVisibility(t.id).enabled);
    const allFeatured = TOOL_SECTIONS.every((t) => getVisibility(t.id).featured);
    const allPublic   = TOOL_SECTIONS.every((t) => getVisibility(t.id).publicAccess);

    const toggleAllField = (field: "enabled" | "featured" | "publicAccess", value: boolean) => {
        setDefaults((prev) => {
            const existing = prev.visibility ?? [];
            const next = TOOL_SECTIONS.map((tool) => {
                const found = existing.find((v) => v.toolId === tool.id);
                const base = found ?? { toolId: tool.id, enabled: true, featured: false, publicAccess: true };
                return { ...base, [field]: value };
            });
            return { ...prev, visibility: next };
        });
    };

    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const cardBg = isApple
        ? isDark ? "rgba(28,28,32,0.80)" : "rgba(255,255,255,0.80)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
        borderRadius: 10,
        padding: "9px 12px",
        fontSize: 13,
        outline: "none",
        width: "100%",
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1
                        className={isApple ? "text-2xl font-semibold" : "text-3xl font-black"}
                        style={{ color: palette.textPrimary }}
                    >
                        Tool Settings
                    </h1>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                        Configure defaults and visibility for every developer tool.
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={saveSettings}
                    disabled={ui.saving || ui.loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
                    style={{ background: ui.saved ? "#34C759" : palette.accent, color: "#fff" }}
                >
                    {ui.saved ? <><CheckCircle fontSize="small" /> Saved</>
                        : ui.saving ? "Saving…"
                        : <><Save fontSize="small" /> Save All</>}
                </motion.button>
            </div>

            {ui.error && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
                    {ui.error}
                </div>
            )}

            {ui.loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 rounded-2xl animate-pulse"
                            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
                    ))}
                </div>
            ) : (
                <div className="space-y-8">

                    {/* ── Visibility & Featured ── */}
                    <section>
                        <p className="text-xs font-black uppercase tracking-widest mb-3"
                            style={{ color: palette.textTertiary }}>
                            Visibility &amp; Featured
                        </p>
                        <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border }}>
                            <button
                                onClick={() => setUi(s => ({ ...s, visibilityOpen: !s.visibilityOpen }))}
                                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: "rgba(255,214,0,0.15)" }}>
                                    <Star sx={{ fontSize: 20, color: "#FFD600" }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>
                                        Tool Visibility &amp; Featured
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                                        Enable / disable tools, mark as featured, and control public access
                                    </p>
                                </div>
                                <motion.div animate={{ rotate: ui.visibilityOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ExpandMore fontSize="small" style={{ color: palette.textTertiary }} />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {ui.visibilityOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 pt-2 space-y-2"
                                            style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                                            {/* Toggle-all header row */}
                                            <div className="flex items-center gap-3 pb-2"
                                                style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                                                <span className="flex-1 text-xs font-black uppercase tracking-widest"
                                                    style={{ color: palette.textTertiary }}>Toggle All</span>
                                                {/* All Enabled */}
                                                <div className="w-20 flex flex-col items-center gap-1.5">
                                                    <span className="flex items-center gap-1 text-xs font-bold"
                                                        style={{ color: palette.textTertiary }}>
                                                        <Visibility sx={{ fontSize: 11 }} /> Enabled
                                                    </span>
                                                    <PillToggle
                                                        value={allEnabled}
                                                        onChange={(v) => toggleAllField("enabled", v)}
                                                        accent="#34C759" isDark={isDark} />
                                                </div>
                                                {/* All Featured */}
                                                <div className="w-20 flex flex-col items-center gap-1.5">
                                                    <span className="flex items-center gap-1 text-xs font-bold"
                                                        style={{ color: palette.textTertiary }}>
                                                        <Star sx={{ fontSize: 11 }} /> Featured
                                                    </span>
                                                    <PillToggle
                                                        value={allFeatured}
                                                        onChange={(v) => toggleAllField("featured", v)}
                                                        accent="#FFD600" isDark={isDark} />
                                                </div>
                                                {/* All Public */}
                                                <div className="w-20 flex flex-col items-center gap-1.5">
                                                    <span className="flex items-center gap-1 text-xs font-bold"
                                                        style={{ color: palette.textTertiary }}>
                                                        <Public sx={{ fontSize: 11 }} /> Public
                                                    </span>
                                                    <PillToggle
                                                        value={allPublic}
                                                        onChange={(v) => toggleAllField("publicAccess", v)}
                                                        accent="#007AFF" isDark={isDark} />
                                                </div>
                                            </div>
                                            {TOOL_SECTIONS.map((tool) => {
                                                const vis = getVisibility(tool.id);
                                                return (
                                                    <div key={tool.id}
                                                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                                                        style={{
                                                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
                                                            border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                                                            opacity: vis.enabled ? 1 : 0.6,
                                                        }}>
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                            style={{ background: `${tool.color}18` }}>
                                                            <span style={{ color: tool.color, fontSize: 16 }}>{tool.icon}</span>
                                                        </div>
                                                        <span className="flex-1 text-sm font-semibold"
                                                            style={{ color: palette.textPrimary }}>{tool.name}</span>
                                                        <div className="w-20 flex justify-center">
                                                            <PillToggle value={vis.enabled}
                                                                onChange={(v) => updateVisibility(tool.id, { enabled: v })}
                                                                accent="#34C759" isDark={isDark} />
                                                        </div>
                                                        <div className="w-20 flex justify-center">
                                                            <PillToggle value={vis.featured}
                                                                onChange={(v) => updateVisibility(tool.id, { featured: v })}
                                                                accent="#FFD600" isDark={isDark} />
                                                        </div>
                                                        <div className="w-20 flex justify-center">
                                                            <PillToggle value={vis.publicAccess}
                                                                onChange={(v) => updateVisibility(tool.id, { publicAccess: v })}
                                                                accent="#007AFF" isDark={isDark} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* ── Per-tool Default Settings ── */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <p className="text-xs font-black uppercase tracking-widest"
                                style={{ color: palette.textTertiary }}>
                                Default Values per Tool
                            </p>
                        </div>
                        <div className="space-y-2">
                            {TOOL_SECTIONS.map((tool) => {
                                const isOpen = ui.expandedTool === tool.id;
                                return (
                                    <div key={tool.id} className="rounded-2xl overflow-hidden"
                                        style={{ background: cardBg, border }}>
                                        <button
                                            onClick={() => toggleAccordion(tool.id)}
                                            className="w-full flex items-center gap-4 px-5 py-4"
                                        >
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${tool.color}18`, color: tool.color }}>
                                                {tool.icon}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="font-bold text-sm" style={{ color: palette.textPrimary }}>{tool.name}</p>
                                                <p className="text-xs mt-0.5" style={{ color: palette.textSecondary }}>
                                                    {isOpen ? "Editing defaults" : "Click to configure defaults"}
                                                </p>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: isOpen ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="p-1.5 rounded-lg"
                                                style={{ color: palette.textTertiary, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                                            >
                                                <ExpandMore fontSize="small" />
                                            </motion.div>
                                        </button>
                                        <AnimatePresence>
                                            {isOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-5 pt-3 space-y-4"
                                                        style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                                                        {renderToolSettings(tool.id, defaults, updateTool, inputStyle, palette, isDark)}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// renderToolSettings
// ────────────────────────────────────────────────────────────────────────────

function renderToolSettings(
    toolId: string,
    defaults: ToolDefaults,
    updateTool: <T extends keyof ToolDefaults>(tool: T, patch: Partial<ToolDefaults[T]>) => void,
    inputStyle: React.CSSProperties,
    palette: any,
    isDark: boolean
) {
    const grid = "grid grid-cols-1 sm:grid-cols-2 gap-4";
    switch (toolId) {

        case "qr": {
            const d = defaults.qr;
            return (
                <div className={grid}>
                    <Field label="Default Size (px)" palette={palette}>
                        <input type="number" value={d.size} min={100} max={2048}
                            onChange={(e) => updateTool("qr", { size: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Error Correction" palette={palette}>
                        <SimpleSelect value={d.errorCorrection} onChange={(v) => updateTool("qr", { errorCorrection: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[
                                { value: "L", label: "L — Low (7%)" },
                                { value: "M", label: "M — Medium (15%)" },
                                { value: "Q", label: "Q — Quartile (25%)" },
                                { value: "H", label: "H — High (30%)" },
                            ]} />
                    </Field>
                    <Field label="Dot Style" palette={palette}>
                        <SimpleSelect value={d.dotStyle} onChange={(v) => updateTool("qr", { dotStyle: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["rounded","dots","classy","classy-rounded","square","extra-rounded"].map((v) => ({ value: v, label: v }))} />
                    </Field>
                    <Field label="Corner Style" palette={palette}>
                        <SimpleSelect value={d.cornerStyle} onChange={(v) => updateTool("qr", { cornerStyle: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["square","dot","extra-rounded"].map((v) => ({ value: v, label: v }))} />
                    </Field>
                    <Field label="Foreground Color" palette={palette}>
                        <div className="flex gap-2 items-center">
                            <input type="color" value={d.foreground}
                                onChange={(e) => updateTool("qr", { foreground: e.target.value })}
                                className="w-9 h-9 rounded-xl border-0 cursor-pointer flex-shrink-0" />
                            <input type="text" value={d.foreground}
                                onChange={(e) => updateTool("qr", { foreground: e.target.value })}
                                style={{ ...inputStyle, fontFamily: "monospace" }} />
                        </div>
                    </Field>
                    <Field label="Background Color" palette={palette}>
                        <div className="flex gap-2 items-center">
                            <input type="color" value={d.background}
                                onChange={(e) => updateTool("qr", { background: e.target.value })}
                                className="w-9 h-9 rounded-xl border-0 cursor-pointer flex-shrink-0" />
                            <input type="text" value={d.background}
                                onChange={(e) => updateTool("qr", { background: e.target.value })}
                                style={{ ...inputStyle, fontFamily: "monospace" }} />
                        </div>
                    </Field>
                </div>
            );
        }

        case "uuid": {
            const d = defaults.uuid;
            return (
                <div className={grid}>
                    <Field label="Default Version" palette={palette}>
                        <SimpleSelect value={d.version} onChange={(v) => updateTool("uuid", { version: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["v1","v4","v5","nil"].map((v) => ({ value: v, label: v.toUpperCase() }))} />
                    </Field>
                    <Field label="Default Bulk Count" palette={palette}>
                        <input type="number" value={d.bulkCount} min={1} max={100}
                            onChange={(e) => updateTool("uuid", { bulkCount: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Format Options" palette={palette} colSpan>
                        <div className="flex flex-wrap gap-3">
                            <CheckToggle label="Uppercase" checked={d.uppercase}
                                onChange={(v) => updateTool("uuid", { uppercase: v })} palette={palette} isDark={isDark} />
                            <CheckToggle label="No dashes" checked={d.noDashes}
                                onChange={(v) => updateTool("uuid", { noDashes: v })} palette={palette} isDark={isDark} />
                            <CheckToggle label="Braces {}" checked={d.braces}
                                onChange={(v) => updateTool("uuid", { braces: v })} palette={palette} isDark={isDark} />
                        </div>
                    </Field>
                </div>
            );
        }

        case "password": {
            const d = defaults.password;
            return (
                <div className={grid}>
                    <Field label="Default Mode" palette={palette}>
                        <SimpleSelect value={d.mode} onChange={(v) => updateTool("password", { mode: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[{ value: "random", label: "Random" }, { value: "passphrase", label: "Passphrase" }, { value: "pin", label: "PIN" }]} />
                    </Field>
                    <Field label="Password Length" palette={palette}>
                        <input type="number" value={d.length} min={4} max={128}
                            onChange={(e) => updateTool("password", { length: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Passphrase Words" palette={palette}>
                        <input type="number" value={d.wordCount} min={3} max={12}
                            onChange={(e) => updateTool("password", { wordCount: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="PIN Length" palette={palette}>
                        <input type="number" value={d.pinLength} min={4} max={12}
                            onChange={(e) => updateTool("password", { pinLength: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="Separator" palette={palette}>
                        <SimpleSelect value={d.separator} onChange={(v) => updateTool("password", { separator: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[
                                { value: "-", label: 'Hyphen "-"' },
                                { value: "_", label: 'Underscore "_"' },
                                { value: ".", label: 'Dot "."' },
                                { value: " ", label: "Space" },
                                { value: "", label: "None" },
                            ]} />
                    </Field>
                    <Field label="Character Types" palette={palette} colSpan>
                        <div className="flex flex-wrap gap-3">
                            <CheckToggle label="Uppercase A-Z" checked={d.uppercase}
                                onChange={(v) => updateTool("password", { uppercase: v })} palette={palette} isDark={isDark} />
                            <CheckToggle label="Lowercase a-z" checked={d.lowercase}
                                onChange={(v) => updateTool("password", { lowercase: v })} palette={palette} isDark={isDark} />
                            <CheckToggle label="Digits 0-9" checked={d.digits}
                                onChange={(v) => updateTool("password", { digits: v })} palette={palette} isDark={isDark} />
                            <CheckToggle label="Symbols !@#$" checked={d.symbols}
                                onChange={(v) => updateTool("password", { symbols: v })} palette={palette} isDark={isDark} />
                            <CheckToggle label="Exclude ambiguous" checked={d.excludeAmbiguous}
                                onChange={(v) => updateTool("password", { excludeAmbiguous: v })} palette={palette} isDark={isDark} />
                        </div>
                    </Field>
                </div>
            );
        }

        case "todo": {
            const d = defaults.todo;
            return (
                <div className={grid}>
                    <Field label="Default Filter" palette={palette}>
                        <SimpleSelect value={d.defaultFilter} onChange={(v) => updateTool("todo", { defaultFilter: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["all","active","completed"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
                    </Field>
                </div>
            );
        }

        case "regexp": {
            const d = defaults.regexp;
            return (
                <div className={grid}>
                    <Field label="Default Flags" palette={palette}>
                        <input type="text" value={d.defaultFlags}
                            onChange={(e) => updateTool("regexp", { defaultFlags: e.target.value })}
                            placeholder="g, gi, gm…" style={{ ...inputStyle, fontFamily: "monospace" }} />
                    </Field>
                    <Field label="Default Tab" palette={palette}>
                        <SimpleSelect value={d.defaultTab} onChange={(v) => updateTool("regexp", { defaultTab: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["match","replace"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
                    </Field>
                    <Field label="Options" palette={palette} colSpan>
                        <CheckToggle label="Show presets by default" checked={d.showPresets}
                            onChange={(v) => updateTool("regexp", { showPresets: v })} palette={palette} isDark={isDark} />
                    </Field>
                </div>
            );
        }

        case "jwt": {
            const d = defaults.jwt;
            return (
                <div className={grid}>
                    <Field label="Default Tab" palette={palette}>
                        <SimpleSelect value={d.defaultTab} onChange={(v) => updateTool("jwt", { defaultTab: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["decode","build","reference"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
                    </Field>
                    <Field label="Default Algorithm" palette={palette}>
                        <SimpleSelect value={d.defaultAlgorithm} onChange={(v) => updateTool("jwt", { defaultAlgorithm: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["HS256","HS384","HS512","RS256","ES256","EdDSA"].map((v) => ({ value: v, label: v }))} />
                    </Field>
                </div>
            );
        }

        case "json": {
            const d = defaults.json;
            return (
                <div className={grid}>
                    <Field label="Default Direction" palette={palette}>
                        <SimpleSelect value={d.direction} onChange={(v) => updateTool("json", { direction: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[
                                { value: "json-to-js", label: "JSON → JS Object" },
                                { value: "js-to-json", label: "JS Object → JSON" },
                            ]} />
                    </Field>
                    <Field label="Options" palette={palette}>
                        <CheckToggle label="Auto-format on load" checked={d.autoFormat}
                            onChange={(v) => updateTool("json", { autoFormat: v })} palette={palette} isDark={isDark} />
                    </Field>
                </div>
            );
        }

        case "image": {
            const d = defaults.image;
            return (
                <div className={grid}>
                    <Field label="Default Mode" palette={palette}>
                        <SimpleSelect value={d.mode} onChange={(v) => updateTool("image", { mode: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[
                                { value: "compress", label: "Compress" },
                                { value: "to-pdf", label: "Images → PDF" },
                            ]} />
                    </Field>
                    <Field label="Output Format" palette={palette}>
                        <SimpleSelect value={d.outputFormat} onChange={(v) => updateTool("image", { outputFormat: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["jpeg","png","webp"].map((v) => ({ value: v, label: v.toUpperCase() }))} />
                    </Field>
                    <Field label={`Compression Quality — ${Math.round(d.quality * 100)}%`} palette={palette} colSpan>
                        <input type="range" min={0.1} max={1} step={0.05} value={d.quality}
                            onChange={(e) => updateTool("image", { quality: Number(e.target.value) })}
                            className="w-full" style={{ accentColor: palette.accent }} />
                    </Field>
                    <Field label="Max Width (px)" palette={palette}>
                        <input type="number" value={d.maxWidth} min={320} max={3840} step={160}
                            onChange={(e) => updateTool("image", { maxWidth: Number(e.target.value) })} style={inputStyle} />
                    </Field>
                    <Field label="PDF Orientation" palette={palette}>
                        <SimpleSelect value={d.pdfOrientation} onChange={(v) => updateTool("image", { pdfOrientation: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[{ value: "portrait", label: "Portrait" }, { value: "landscape", label: "Landscape" }]} />
                    </Field>
                </div>
            );
        }

        case "pdf": {
            const d = defaults.pdf;
            return (
                <div className={grid}>
                    <Field label="Default Mode" palette={palette}>
                        <SimpleSelect value={d.mode} onChange={(v) => updateTool("pdf", { mode: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[{ value: "merge", label: "Merge" }, { value: "split", label: "Split / Extract" }]} />
                    </Field>
                </div>
            );
        }

        case "markdown": {
            const d = defaults.markdown;
            return (
                <div className={grid}>
                    <Field label="Default View Mode" palette={palette}>
                        <SimpleSelect value={d.viewMode} onChange={(v) => updateTool("markdown", { viewMode: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["split","editor","preview"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
                    </Field>
                </div>
            );
        }

        case "colour": {
            const d = defaults.colour;
            return (
                <div className={grid}>
                    <Field label="Default Tab" palette={palette}>
                        <SimpleSelect value={d.defaultTab} onChange={(v) => updateTool("colour", { defaultTab: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["picker","palette","contrast"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
                    </Field>
                    <Field label="Default Harmony" palette={palette}>
                        <SimpleSelect value={d.harmony} onChange={(v) => updateTool("colour", { harmony: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["complementary","analogous","triadic","split-comp","tetradic"].map((v) => ({ value: v, label: v }))} />
                    </Field>
                    <Field label={`Default Hue — ${d.defaultHue}°`} palette={palette} colSpan>
                        <input type="range" min={0} max={360} value={d.defaultHue}
                            onChange={(e) => updateTool("colour", { defaultHue: Number(e.target.value) })}
                            className="w-full" style={{ accentColor: `hsl(${d.defaultHue}, 80%, 55%)` }} />
                    </Field>
                    <Field label={`Saturation — ${d.defaultSaturation}%`} palette={palette}>
                        <input type="range" min={0} max={100} value={d.defaultSaturation}
                            onChange={(e) => updateTool("colour", { defaultSaturation: Number(e.target.value) })}
                            className="w-full" style={{ accentColor: palette.accent }} />
                    </Field>
                    <Field label={`Lightness — ${d.defaultLightness}%`} palette={palette}>
                        <input type="range" min={0} max={100} value={d.defaultLightness}
                            onChange={(e) => updateTool("colour", { defaultLightness: Number(e.target.value) })}
                            className="w-full" style={{ accentColor: palette.accent }} />
                    </Field>
                </div>
            );
        }

        case "encrypt": {
            const d = defaults.encrypt;
            return (
                <div className={grid}>
                    <Field label="Default Algorithm" palette={palette}>
                        <SimpleSelect value={d.algorithm} onChange={(v) => updateTool("encrypt", { algorithm: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={["AES","DES","TripleDES","Rabbit","RC4"].map((v) => ({ value: v, label: v }))} />
                    </Field>
                    <Field label="Default Direction" palette={palette}>
                        <SimpleSelect value={d.direction} onChange={(v) => updateTool("encrypt", { direction: v })}
                            inputStyle={inputStyle} palette={palette} isDark={isDark}
                            options={[{ value: "encrypt", label: "Encrypt" }, { value: "decrypt", label: "Decrypt" }]} />
                    </Field>
                </div>
            );
        }

        default:
            return <p className="text-xs" style={{ color: palette.textTertiary }}>No configurable defaults.</p>;
    }
}

// ────────────────────────────────────────────────────────────────────────────
// UI Atoms
// ────────────────────────────────────────────────────────────────────────────

/** Animated spring pill toggle — matches Features page design */
function PillToggle({ value, onChange, accent, isDark }: {
    value: boolean; onChange: (v: boolean) => void; accent: string; isDark: boolean;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onChange(!value)}
            className="relative w-11 h-6 rounded-full flex-shrink-0"
            style={{ background: value ? accent : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }}
        >
            <motion.div
                animate={{ x: value ? 22 : 3 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
            />
        </motion.button>
    );
}

/** Pill-badge checkbox for inline boolean groups */
function CheckToggle({ label, checked, onChange, palette, isDark }: {
    label: string; checked: boolean; onChange: (v: boolean) => void; palette: any; isDark: boolean;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(!checked)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
                background: checked ? `${palette.accent}15` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${checked ? palette.accent : isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
                color: checked ? palette.accent : palette.textSecondary,
            }}
        >
            <span className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                style={{
                    background: checked ? palette.accent : "transparent",
                    border: `1.5px solid ${checked ? palette.accent : isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}`,
                }}>
                {checked && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
            {label}
        </motion.button>
    );
}

/** Labelled field wrapper */
function Field({ label, children, palette, colSpan = false }: {
    label: string; children: React.ReactNode; palette: any; colSpan?: boolean;
}) {
    return (
        <div className={colSpan ? "col-span-full" : ""}>
            <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider"
                style={{ color: palette.textTertiary }}>
                {label}
            </label>
            {children}
        </div>
    );
}

/** Select wrapper using the shared CustomSelect component */
function SimpleSelect({ value, onChange, options }: {
    value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[];
    inputStyle?: React.CSSProperties; palette?: any; isDark?: boolean;
}) {
    return (
        <CustomSelect value={value} onChange={onChange} options={options} />
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Deep merge helper
// ────────────────────────────────────────────────────────────────────────────

function deepMerge<T extends Record<string, any>>(target: T, source: Record<string, any>): T {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (key === "_id" || key === "__v" || key === "ConfigID") continue;
        if (
            source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) &&
            target[key] && typeof target[key] === "object" && !Array.isArray(target[key])
        ) {
            (result as any)[key] = deepMerge(target[key], source[key]);
        } else if (source[key] !== undefined) {
            (result as any)[key] = source[key];
        }
    }
    return result;
}
