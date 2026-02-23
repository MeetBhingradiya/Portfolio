/**
 * Colour Studio — /tools/colour
 * HSL / HEX / RGB / CMYK colour picker, converter,
 * palette generator with harmonic relationships.
 */

"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Palette,
    ContentCopy,
    Check,
    Shuffle,
    Download
} from "@mui/icons-material";

// ── Colour conversions ──────────────────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, Math.round(l * 100)];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] | null {
    const m = hex.replace("#", "").match(/^([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})$/);
    if (!m) return null;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
    if (r === 0 && g === 0 && b === 0) return [0, 0, 0, 100];
    const c1 = 1 - r / 255, m1 = 1 - g / 255, y1 = 1 - b / 255;
    const k = Math.min(c1, m1, y1);
    return [
        Math.round(((c1 - k) / (1 - k)) * 100),
        Math.round(((m1 - k) / (1 - k)) * 100),
        Math.round(((y1 - k) / (1 - k)) * 100),
        Math.round(k * 100)
    ];
}

// ── Harmony generators ──────────────────────────────────────────────────
type Harmony = "complementary" | "analogous" | "triadic" | "split-comp" | "tetradic";

function generateHarmony(h: number, s: number, l: number, type: Harmony): [number, number, number][] {
    const mod = (v: number) => ((v % 360) + 360) % 360;
    switch (type) {
        case "complementary": return [[h, s, l], [mod(h + 180), s, l]];
        case "analogous": return [[mod(h - 30), s, l], [h, s, l], [mod(h + 30), s, l]];
        case "triadic": return [[h, s, l], [mod(h + 120), s, l], [mod(h + 240), s, l]];
        case "split-comp": return [[h, s, l], [mod(h + 150), s, l], [mod(h + 210), s, l]];
        case "tetradic": return [[h, s, l], [mod(h + 90), s, l], [mod(h + 180), s, l], [mod(h + 270), s, l]];
        default: return [[h, s, l]];
    }
}

export default function ColourStudioPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [hue, setHue] = useState(210);
    const [saturation, setSaturation] = useState(80);
    const [lightness, setLightness] = useState(55);
    const [hexInput, setHexInput] = useState("#2B8CD6");
    const [harmony, setHarmony] = useState<Harmony>("analogous");
    const [copied, setCopied] = useState<string | null>(null);
    const [tab, setTab] = useState<"picker" | "palette" | "contrast">("picker");
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = React.useRef(false);

    React.useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.colour) return;
        defaultsApplied.current = true;
        const d = toolDefaults.colour;
        if (d.defaultHue != null) setHue(d.defaultHue);
        if (d.defaultSaturation != null) setSaturation(d.defaultSaturation);
        if (d.defaultLightness != null) setLightness(d.defaultLightness);
        if (d.harmony) setHarmony(d.harmony as Harmony);
        if (d.defaultTab) setTab(d.defaultTab as "picker" | "palette" | "contrast");
    }, [toolDefaults]);

    const rgb = useMemo(() => hslToRgb(hue, saturation, lightness), [hue, saturation, lightness]);
    const hex = useMemo(() => rgbToHex(...rgb), [rgb]);
    const cmyk = useMemo(() => rgbToCmyk(...rgb), [rgb]);
    const harmonyColors = useMemo(() => generateHarmony(hue, saturation, lightness, harmony), [hue, saturation, lightness, harmony]);

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 1200);
    };

    const applyHex = (val: string) => {
        setHexInput(val);
        const parsed = hexToRgb(val);
        if (parsed) {
            const [h, s, l] = rgbToHsl(...parsed);
            setHue(h); setSaturation(s); setLightness(l);
        }
    };

    const randomize = () => {
        setHue(Math.floor(Math.random() * 360));
        setSaturation(40 + Math.floor(Math.random() * 60));
        setLightness(30 + Math.floor(Math.random() * 40));
    };

    // Update hex input when HSL changes
    React.useEffect(() => {
        setHexInput(hex);
    }, [hex]);

    // ── Contrast ratio helper ───────────────────────────────────────
    const relativeLuminance = (r: number, g: number, b: number) => {
        const [rs, gs, bs] = [r, g, b].map((c) => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const contrastRatio = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        const l1 = relativeLuminance(r1, g1, b1);
        const l2 = relativeLuminance(r2, g2, b2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    };

    const whiteContrast = contrastRatio(...rgb, 255, 255, 255);
    const blackContrast = contrastRatio(...rgb, 0, 0, 0);

    const sliderStyle = (bg: string): React.CSSProperties => ({
        background: bg,
        height: 12,
        borderRadius: 999,
        outline: "none",
        WebkitAppearance: "none" as any,
        cursor: "pointer",
        width: "100%"
    });

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
    };

    return (
        <ToolPageWrapper
            title="Colour Studio"
            description="Pick, convert, and generate colour palettes"
            icon={<Palette sx={{ fontSize: 24 }} />}
            accentColor={hex}
            actions={
                <motion.button onClick={randomize} className="p-2 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)" }} whileTap={{ scale: 0.9 }} title="Random colour">
                    <Shuffle sx={{ fontSize: 16, color: palette.textTertiary }} />
                </motion.button>
            }
        >
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex gap-1.5">
                    {(["picker", "palette", "contrast"] as const).map((t) => (
                        <motion.button
                            key={t}
                            onClick={() => setTab(t)}
                            className="px-5 py-2 rounded-full text-sm font-bold capitalize"
                            style={{
                                background: tab === t ? hex : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color: tab === t ? (lightness > 60 ? "#000" : "#fff") : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t}
                        </motion.button>
                    ))}
                </div>

                {/* ═══ PICKER TAB ═══ */}
                {tab === "picker" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Colour preview */}
                            <Card>
                                <div className="space-y-4">
                                    <div
                                        className="w-full aspect-[2/1] rounded-2xl transition-colors"
                                        style={{ background: hex, boxShadow: `0 8px 32px ${hex}40` }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={hexInput}
                                            onChange={(e) => applyHex(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-xl text-sm font-mono font-bold outline-none"
                                            style={inputStyle}
                                        />
                                        <motion.button
                                            onClick={() => copy(hex)}
                                            className="p-2 rounded-xl"
                                            style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)" }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            {copied === hex ? <Check sx={{ fontSize: 16, color: "#34C759" }} /> : <ContentCopy sx={{ fontSize: 16, color: palette.textTertiary }} />}
                                        </motion.button>
                                    </div>
                                </div>
                            </Card>

                            {/* Sliders */}
                            <Card>
                                <div className="space-y-5">
                                    {/* Hue */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Hue</label>
                                            <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{hue}°</span>
                                        </div>
                                        <input
                                            type="range" min={0} max={360} value={hue}
                                            onChange={(e) => setHue(Number(e.target.value))}
                                            style={sliderStyle("linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))")}
                                        />
                                    </div>

                                    {/* Saturation */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Saturation</label>
                                            <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{saturation}%</span>
                                        </div>
                                        <input
                                            type="range" min={0} max={100} value={saturation}
                                            onChange={(e) => setSaturation(Number(e.target.value))}
                                            style={sliderStyle(`linear-gradient(to right, hsl(${hue},0%,${lightness}%), hsl(${hue},100%,${lightness}%))`)}
                                        />
                                    </div>

                                    {/* Lightness */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Lightness</label>
                                            <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{lightness}%</span>
                                        </div>
                                        <input
                                            type="range" min={0} max={100} value={lightness}
                                            onChange={(e) => setLightness(Number(e.target.value))}
                                            style={sliderStyle(`linear-gradient(to right, hsl(${hue},${saturation}%,0%), hsl(${hue},${saturation}%,50%), hsl(${hue},${saturation}%,100%))`)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Values */}
                        <Card>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: "HEX", value: hex },
                                    { label: "RGB", value: `rgb(${rgb.join(", ")})` },
                                    { label: "HSL", value: `hsl(${hue}, ${saturation}%, ${lightness}%)` },
                                    { label: "CMYK", value: `cmyk(${cmyk.join("%, ")}%)` }
                                ].map((v) => (
                                    <motion.button
                                        key={v.label}
                                        onClick={() => copy(v.value)}
                                        className="flex flex-col gap-1 px-4 py-3 rounded-xl text-left"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                            border: `1px solid ${copied === v.value ? "#34C759" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`
                                        }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <span className="text-[10px] font-bold" style={{ color: palette.textTertiary }}>{v.label}</span>
                                        <span className="text-xs font-mono font-semibold" style={{ color: palette.textPrimary }}>{v.value}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ═══ PALETTE TAB ═══ */}
                {tab === "palette" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <Card>
                            <div className="space-y-4">
                                <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>Harmony Type</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(["complementary", "analogous", "triadic", "split-comp", "tetradic"] as Harmony[]).map((h) => (
                                        <motion.button
                                            key={h}
                                            onClick={() => setHarmony(h)}
                                            className="px-4 py-2 rounded-full text-xs font-bold capitalize"
                                            style={{
                                                background: harmony === h ? hex : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                color: harmony === h ? (lightness > 60 ? "#000" : "#fff") : palette.textSecondary
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {h.replace("-", " ")}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {harmonyColors.map(([ch, cs, cl], i) => {
                                const crgb = hslToRgb(ch, cs, cl);
                                const chex = rgbToHex(...crgb);
                                return (
                                    <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.06 }}>
                                        <Card>
                                            <div className="space-y-2">
                                                <div
                                                    className="aspect-square rounded-xl"
                                                    style={{ background: chex, boxShadow: `0 8px 24px ${chex}30` }}
                                                />
                                                <motion.button
                                                    onClick={() => copy(chex)}
                                                    className="w-full text-center text-xs font-mono font-bold py-1"
                                                    style={{ color: palette.textPrimary }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {copied === chex ? "Copied!" : chex}
                                                </motion.button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Shades & tints */}
                        <Card>
                            <h3 className={`mb-3 ${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>Shades & Tints</h3>
                            <div className="flex rounded-xl overflow-hidden">
                                {Array.from({ length: 10 }, (_, i) => {
                                    const l = 5 + i * 10;
                                    const shade = rgbToHex(...hslToRgb(hue, saturation, l));
                                    return (
                                        <motion.button
                                            key={i}
                                            onClick={() => copy(shade)}
                                            className="flex-1 aspect-[1/2]"
                                            style={{ background: shade }}
                                            whileTap={{ scale: 0.95 }}
                                            title={shade}
                                        />
                                    );
                                })}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ═══ CONTRAST TAB ═══ */}
                {tab === "contrast" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Card>
                                <div className="space-y-3">
                                    <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>White Text</h3>
                                    <div className="flex items-center justify-center aspect-video rounded-xl" style={{ background: hex }}>
                                        <span className="text-2xl font-black" style={{ color: "#fff" }}>Aa</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold" style={{ color: palette.textPrimary }}>{whiteContrast.toFixed(2)}:1</span>
                                        <div className="flex gap-1.5">
                                            <OneUIBadge variant={whiteContrast >= 4.5 ? "success" : "error"}>AA {whiteContrast >= 4.5 ? "Pass" : "Fail"}</OneUIBadge>
                                            <OneUIBadge variant={whiteContrast >= 7 ? "success" : "error"}>AAA {whiteContrast >= 7 ? "Pass" : "Fail"}</OneUIBadge>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div className="space-y-3">
                                    <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>Black Text</h3>
                                    <div className="flex items-center justify-center aspect-video rounded-xl" style={{ background: hex }}>
                                        <span className="text-2xl font-black" style={{ color: "#000" }}>Aa</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold" style={{ color: palette.textPrimary }}>{blackContrast.toFixed(2)}:1</span>
                                        <div className="flex gap-1.5">
                                            <OneUIBadge variant={blackContrast >= 4.5 ? "success" : "error"}>AA {blackContrast >= 4.5 ? "Pass" : "Fail"}</OneUIBadge>
                                            <OneUIBadge variant={blackContrast >= 7 ? "success" : "error"}>AAA {blackContrast >= 7 ? "Pass" : "Fail"}</OneUIBadge>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </div>
        </ToolPageWrapper>
    );
}
