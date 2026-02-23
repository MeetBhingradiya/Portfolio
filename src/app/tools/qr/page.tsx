/**
 * QR Generator — /tools/qr
 * Full-featured QR code generator with UPI, WiFi, Bluetooth, vCard, Email, Phone, Text/URL.
 * Supports all qr-code-styling & qr-border-plugin options: gradients, borders,
 * inner/outer rings, decorations, logo, shape variants & more.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    QrCode2,
    ContentCopy,
    Download,
    Settings,
    Palette,
    Check,
    ChevronRight,
    ImageOutlined,
    BorderOuter,
    Security,
    Tune,
    Wifi as WifiIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    ContactPage,
    TextFields,
    Link as LinkIcon,
    CurrencyRupee,
    BluetoothSearching,
    Refresh
} from "@mui/icons-material";
import { generateLicenseKey, LicensingModel } from "./generateLicenseKey";

// ─── Types ────────────────────────────────────────────────────────────────────

type DataType = "text" | "url" | "upi" | "wifi" | "bluetooth" | "vcard" | "email" | "phone";
type DotType = "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
type CornerSquareType = "square" | "extra-rounded" | "dot";
type CornerDotType = "square" | "dot";
type FileExt = "svg" | "png" | "jpeg" | "webp";
type GradientType = "linear" | "radial";
type DrawType = "canvas" | "svg";

interface ColorStop { offset: number; color: string }
interface Gradient { type: GradientType; rotation: number; colorStops: ColorStop[] }

interface QRState {
    // Data
    dataType: DataType;
    text: string;
    upi: {
        pa: string; pn: string; am: string | null; mc: string | null;
        tr: string | null; url: string | null; cu: "INR"; tid: string | null;
        tn: string | null; gstBrkUp: string | null; invoiceNo: string | null;
        invoiceDate: string | null; gstin: string | null;
    };
    wifi: { ssid: string; password: string; type: "WPA" | "WEP" | "nopass"; hidden: boolean };
    bluetooth: { name: string; address: string };
    vcard: { name: string; phone: string; email: string; org: string; title: string; address: string; url: string };
    email: { to: string; subject: string; body: string };
    // Render & size
    drawType: DrawType;
    width: number;
    height: number;
    margin: number;
    shape: "square" | "circle";
    fileExt: FileExt;
    // Dots
    dotType: DotType;
    dotColorMode: "color" | "gradient";
    dotColor: string;
    dotGradient: Gradient;
    dotsRoundSize: boolean;
    // Corner Square
    cornerSquareType: CornerSquareType;
    cornerSquareColorMode: "color" | "gradient";
    cornerSquareColor: string;
    cornerSquareGradient: Gradient;
    // Corner Dot
    cornerDotType: CornerDotType;
    cornerDotColorMode: "color" | "gradient";
    cornerDotColor: string;
    cornerDotGradient: Gradient;
    // Background
    bgColorMode: "color" | "gradient";
    bgColor: string;
    bgGradient: Gradient;
    bgRound: number;
    // Image / Logo
    imageUrl: string;
    imageSize: number;
    imageMargin: number;
    hideBackgroundDots: boolean;
    saveAsBlob: boolean;
    // Error correction
    errorCorrection: "L" | "M" | "Q" | "H";
    // Border plugin — main ring
    borderEnabled: boolean;
    borderThickness: number;
    borderColor: string;
    borderRound: number;
    borderDasharray: string;
    // Border decorations
    borderTopText: string;
    borderBottomText: string;
    borderLeftText: string;
    borderRightText: string;
    borderTextStyle: string;
    // Border inner ring
    borderInnerColor: string;
    borderInnerThickness: number;
    borderInnerDasharray: string;
    // Border outer ring
    borderOuterColor: string;
    borderOuterThickness: number;
    borderOuterDasharray: string;
    // License
    licenseKey: string;
}

// ─── Theme prop shared across module-level primitives ─────────────────────────

interface ThemeProp {
    palette: {
        accent: string;
        textPrimary: string;
        textSecondary: string;
        textTertiary?: string;
        [k: string]: any;
    };
    isDark: boolean;
    isApple: boolean;
}

// ─── Module-level UI primitives ───────────────────────────────────────────────
// Defined at module scope (NOT inside the component) so React never chooses a
// new component type on re-render — which would unmount the input and lose focus.

function Field({
    label, value, onChange, placeholder, type = "text", theme
}: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; theme: ThemeProp;
}) {
    const { palette, isDark, isApple } = theme;
    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: isApple ? 12 : 16,
        outline: "none",
        width: "100%",
        padding: "10px 14px",
        fontSize: 13,
        boxSizing: "border-box" as const,
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {label && <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>{label}</label>}
            <input type={type} value={value} placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)} style={inputStyle} />
        </div>
    );
}

function Pill<T extends string>({
    label, options, value, onChange, theme
}: {
    label: string; options: readonly T[]; value: T; onChange: (v: T) => void; theme: ThemeProp;
}) {
    const { palette, isDark } = theme;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {label && <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>{label}</label>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {options.map((o) => (
                    <motion.button key={o} onClick={() => onChange(o)} whileTap={{ scale: 0.93 }}
                        style={{
                            padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            background: value === o ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                            color: value === o ? "#fff" : palette.textSecondary,
                            border: `1px solid ${value === o ? palette.accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                        }}>
                        {o}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

function Toggle({
    label, checked, onChange, theme
}: { label: string; checked: boolean; onChange: (v: boolean) => void; theme: ThemeProp }) {
    const { palette, isDark } = theme;
    return (
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div onClick={() => onChange(!checked)} style={{
                width: 40, height: 22, borderRadius: 11, position: "relative",
                background: checked ? palette.accent : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                transition: "background .2s", flexShrink: 0, cursor: "pointer",
            }}>
                <div style={{
                    position: "absolute", top: 2, left: checked ? 20 : 2,
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: palette.textSecondary }}>{label}</span>
        </label>
    );
}

function ColorRow({
    label, value, onChange, theme
}: { label: string; value: string; onChange: (v: string) => void; theme: ThemeProp }) {
    const { palette, isDark, isApple } = theme;
    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: isApple ? 12 : 16,
        outline: "none",
        padding: "10px 14px",
        fontSize: 13,
        boxSizing: "border-box" as const,
        flex: 1,
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {label && <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>{label}</label>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
                    style={{ width: 40, height: 36, borderRadius: isApple ? 8 : 12, border: "none", cursor: "pointer", padding: 0 }} />
                <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
                    style={inputStyle} placeholder="#000000" />
            </div>
        </div>
    );
}

function GradientEditor({
    gradient, onChange, theme
}: { gradient: Gradient; onChange: (g: Gradient) => void; theme: ThemeProp }) {
    const { palette } = theme;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Pill label="Type" options={["linear", "radial"] as const} value={gradient.type}
                onChange={(t) => onChange({ ...gradient, type: t })} theme={theme} />
            {gradient.type === "linear" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Rotation: {gradient.rotation}°</label>
                    <input type="range" min={0} max={360} value={gradient.rotation}
                        onChange={(e) => onChange({ ...gradient, rotation: +e.target.value })}
                        style={{ accentColor: palette.accent, width: "100%" }} />
                </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Color Stops</span>
                <motion.button whileTap={{ scale: 0.93 }}
                    onClick={() => onChange({ ...gradient, colorStops: [...gradient.colorStops, { offset: 0.5, color: "#888888" }] })}
                    style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        background: `${palette.accent}20`, color: palette.accent, border: `1px solid ${palette.accent}40`,
                    }}>+ Add</motion.button>
            </div>
            {gradient.colorStops.map((stop, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={stop.color}
                        onChange={(e) => onChange({ ...gradient, colorStops: gradient.colorStops.map((s, j) => j === i ? { ...s, color: e.target.value } : s) })}
                        style={{ width: 32, height: 32, borderRadius: 6, border: "none", cursor: "pointer", padding: 0 }} />
                    <input type="range" min={0} max={100} value={Math.round(stop.offset * 100)}
                        onChange={(e) => onChange({ ...gradient, colorStops: gradient.colorStops.map((s, j) => j === i ? { ...s, offset: +e.target.value / 100 } : s) })}
                        style={{ accentColor: palette.accent, flex: 1 }} />
                    <span style={{ fontSize: 11, color: palette.textTertiary, minWidth: 28 }}>{Math.round(stop.offset * 100)}%</span>
                    {gradient.colorStops.length > 2 && (
                        <motion.button whileTap={{ scale: 0.9 }}
                            onClick={() => onChange({ ...gradient, colorStops: gradient.colorStops.filter((_, j) => j !== i) })}
                            style={{ width: 24, height: 24, borderRadius: "50%", background: "#ff3b3020", color: "#ff3b30", border: "none", cursor: "pointer", fontSize: 16 }}>
                            ×
                        </motion.button>
                    )}
                </div>
            ))}
        </div>
    );
}

function ColorModeSection({
    label, mode, onModeChange, color, onColorChange, gradient, onGradientChange, theme
}: {
    label: string;
    mode: "color" | "gradient"; onModeChange: (m: "color" | "gradient") => void;
    color: string; onColorChange: (c: string) => void;
    gradient: Gradient; onGradientChange: (g: Gradient) => void;
    theme: ThemeProp;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Pill label={label} options={["color", "gradient"] as const} value={mode} onChange={onModeChange} theme={theme} />
            {mode === "color"
                ? <ColorRow label="" value={color} onChange={onColorChange} theme={theme} />
                : <GradientEditor gradient={gradient} onChange={onGradientChange} theme={theme} />
            }
        </div>
    );
}

function Section({
    id, icon, title, children, theme, Card, openSection, setOpenSection
}: {
    id: string; icon: React.ReactNode; title: string; children: React.ReactNode;
    theme: ThemeProp;
    Card: React.ComponentType<any>;
    openSection: string;
    setOpenSection: (id: string) => void;
}) {
    const { palette, isApple } = theme;
    const open = openSection === id;
    return (
        <Card>
            <div>
                <button
                    onClick={() => setOpenSection(open ? "" : id)}
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: palette.accent }}>{icon}</span>
                        <span style={{ fontSize: isApple ? 14 : 16, fontWeight: isApple ? 600 : 900, color: palette.textPrimary }}>{title}</span>
                    </div>
                    <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight sx={{ fontSize: 18, color: palette.textTertiary }} />
                    </motion.div>
                </button>
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}>
                            <div style={{ paddingTop: 16 }}>{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultGradient = (c1 = "#000000", c2 = "#ffffff"): Gradient => ({
    type: "linear",
    rotation: 0,
    colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }],
});

const DEFAULT_STATE: QRState = {
    dataType: "url",
    text: "https://meetbhingradiya.com",
    upi: {
        pa: "meetbhingradiya@pingpay", pn: "Buy a Coffee to Meet Bhingradiya",
        am: "100", mc: "", tr: "", url: "", cu: "INR", tid: "", tn: "", gstBrkUp: "",
        invoiceNo: "", invoiceDate: "", gstin: "",
    },
    wifi: { ssid: "MyWiFi", password: "password123", type: "WPA", hidden: false },
    bluetooth: { name: "My Device", address: "00:11:22:33:44:55" },
    vcard: {
        name: "Meet Bhingradiya", phone: "+911234567890", email: "meet@example.com",
        org: "Tech Company", title: "Software Engineer",
        address: "123 Tech Street, Mumbai, India", url: "https://meetbhingradiya.com",
    },
    email: { to: "meet@example.com", subject: "Hello from QR Code", body: "This is a message from a QR code!" },
    drawType: "svg",
    width: 400, height: 400, margin: 10, shape: "square", fileExt: "png",
    dotType: "rounded", dotColorMode: "color", dotColor: "#000000", dotGradient: defaultGradient(),
    dotsRoundSize: false,
    cornerSquareType: "extra-rounded", cornerSquareColorMode: "color", cornerSquareColor: "#000000", cornerSquareGradient: defaultGradient(),
    cornerDotType: "dot", cornerDotColorMode: "color", cornerDotColor: "#000000", cornerDotGradient: defaultGradient(),
    bgColorMode: "color", bgColor: "#ffffff", bgGradient: defaultGradient("#ffffff", "#f0f0f0"), bgRound: 0,
    imageUrl: "", imageSize: 0.4, imageMargin: 5, hideBackgroundDots: true, saveAsBlob: false,
    errorCorrection: "M",
    borderEnabled: false,
    borderThickness: 60, borderColor: "#000000", borderRound: 0, borderDasharray: "0",
    borderTopText: "Scan Here", borderBottomText: "Try Me", borderLeftText: "", borderRightText: "",
    borderTextStyle: "font: 30px sans-serif; fill: #D5B882;",
    borderInnerColor: "#000000", borderInnerThickness: 0, borderInnerDasharray: "0",
    borderOuterColor: "#000000", borderOuterThickness: 0, borderOuterDasharray: "0",
    licenseKey: "",
};

const DATA_TYPES: { value: DataType; label: string; icon: React.ReactNode }[] = [
    { value: "url",       label: "URL",       icon: <LinkIcon sx={{ fontSize: 15 }} /> },
    { value: "text",      label: "Text",      icon: <TextFields sx={{ fontSize: 15 }} /> },
    { value: "upi",       label: "UPI Pay",   icon: <CurrencyRupee sx={{ fontSize: 15 }} /> },
    { value: "wifi",      label: "WiFi",      icon: <WifiIcon sx={{ fontSize: 15 }} /> },
    { value: "bluetooth", label: "Bluetooth", icon: <BluetoothSearching sx={{ fontSize: 15 }} /> },
    { value: "vcard",     label: "Contact",   icon: <ContactPage sx={{ fontSize: 15 }} /> },
    { value: "email",     label: "Email",     icon: <EmailIcon sx={{ fontSize: 15 }} /> },
    { value: "phone",     label: "Phone",     icon: <PhoneIcon sx={{ fontSize: 15 }} /> },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function QRGeneratorPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const theme: ThemeProp = { palette, isDark, isApple };

    const [state, setState] = useState<QRState>(() => ({
        ...DEFAULT_STATE,
        licenseKey: typeof window !== "undefined"
            ? generateLicenseKey("qr-border-plugin", LicensingModel.Perpetual, "SM Network", 1, window.location.hostname)
            : "",
    }));
    const [copied, setCopied] = useState(false);
    const [openSection, setOpenSection] = useState<string>("data");
    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<any>(null);
    // Tracks whether a border extension is registered on the current instance.
    // qr-code-styling has no removeExtension API — we must destroy & recreate
    // the instance whenever border is disabled or options change while active.
    const borderApplied = useRef(false);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    // Apply saved tool defaults once
    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.qr) return;
        defaultsApplied.current = true;
        const d = toolDefaults.qr;
        setState((prev) => ({
            ...prev,
            width: d.size ?? prev.width,
            height: d.size ?? prev.height,
            dotColor: d.foreground ?? prev.dotColor,
            bgColor: d.background ?? prev.bgColor,
            dotType: (d.dotStyle as DotType) ?? prev.dotType,
            cornerSquareType: (d.cornerStyle as CornerSquareType) ?? prev.cornerSquareType,
            errorCorrection: (d.errorCorrection as "L" | "M" | "Q" | "H") ?? prev.errorCorrection,
        }));
    }, [toolDefaults]);

    // Init license key client-side (SSR guard)
    useEffect(() => {
        if (!state.licenseKey && typeof window !== "undefined") {
            setState((prev) => ({
                ...prev,
                licenseKey: generateLicenseKey("qr-border-plugin", LicensingModel.Perpetual, "SM Network", 1, window.location.hostname),
            }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const update = useCallback(<K extends keyof QRState>(field: K, value: QRState[K]) => {
        setState((prev) => ({ ...prev, [field]: value }));
    }, []);

    const updateNested = useCallback(<K extends keyof QRState>(field: K, patch: Partial<QRState[K]>) => {
        setState((prev) => ({ ...prev, [field]: { ...(prev[field] as object), ...patch } }));
    }, []);

    // ── Build QR data string ──────────────────────────────────────────────────
    const getQRData = useCallback((): string => {
        const s = state;
        switch (s.dataType) {
            case "url":
            case "text":  return s.text;
            case "phone": return `tel:${s.text}`;
            case "upi": {
                let url = "upi://pay";
                if (s.upi.pa)          url += `?pa=${s.upi.pa}`;
                if (s.upi.pn)          url += `&pn=${s.upi.pn}`;
                if (s.upi.am)          url += `&am=${s.upi.am}`;
                if (s.upi.cu)          url += `&cu=${s.upi.cu}`;
                if (s.upi.tn)          url += `&tn=${s.upi.tn}`;
                if (s.upi.mc)          url += `&mc=${s.upi.mc}`;
                if (s.upi.tr)          url += `&tr=${s.upi.tr}`;
                if (s.upi.url)         url += `&url=${s.upi.url}`;
                if (s.upi.tid)         url += `&tid=${s.upi.tid}`;
                if (s.upi.gstBrkUp)    url += `&gstBrkUp=${s.upi.gstBrkUp}`;
                if (s.upi.invoiceNo)   url += `&invoiceNo=${s.upi.invoiceNo}`;
                if (s.upi.invoiceDate) url += `&invoiceDate=${s.upi.invoiceDate}`;
                if (s.upi.gstin)       url += `&gstin=${s.upi.gstin}`;
                return url;
            }
            case "wifi":
                return `WIFI:T:${s.wifi.type};S:${s.wifi.ssid};P:${s.wifi.password};H:${s.wifi.hidden ? "true" : "false"};;`;
            case "bluetooth":
                return `B:${s.bluetooth.name};${s.bluetooth.address};`;
            case "vcard":
                return [
                    "BEGIN:VCARD", "VERSION:3.0",
                    `FN:${s.vcard.name}`, `TEL:${s.vcard.phone}`,
                    `EMAIL:${s.vcard.email}`, `ORG:${s.vcard.org}`,
                    `TITLE:${s.vcard.title}`, `ADR:${s.vcard.address}`,
                    `URL:${s.vcard.url}`, "END:VCARD",
                ].join("\n");
            case "email":
                return `mailto:${s.email.to}?subject=${encodeURIComponent(s.email.subject)}&body=${encodeURIComponent(s.email.body)}`;
            default: return s.text;
        }
    }, [state]);

    // ── Build qr-code-styling options object ──────────────────────────────────
    const buildQROpts = useCallback(() => {
        const s = state;

        const dotsOptions: any = { type: s.dotType, roundSize: s.dotsRoundSize };
        if (s.dotColorMode === "gradient") dotsOptions.gradient = s.dotGradient;
        else dotsOptions.color = s.dotColor;

        const cornersSquareOptions: any = { type: s.cornerSquareType };
        if (s.cornerSquareColorMode === "gradient") cornersSquareOptions.gradient = s.cornerSquareGradient;
        else cornersSquareOptions.color = s.cornerSquareColor;

        const cornersDotOptions: any = { type: s.cornerDotType };
        if (s.cornerDotColorMode === "gradient") cornersDotOptions.gradient = s.cornerDotGradient;
        else cornersDotOptions.color = s.cornerDotColor;

        const backgroundOptions: any = { round: s.bgRound };
        if (s.bgColorMode === "gradient") backgroundOptions.gradient = s.bgGradient;
        else backgroundOptions.color = s.bgColor;

        return {
            type: s.drawType,
            shape: s.shape,
            width: s.width,
            height: s.height,
            margin: s.margin,
            data: getQRData(),
            image: s.imageUrl || undefined,
            qrOptions: { errorCorrectionLevel: s.errorCorrection },
            dotsOptions,
            cornersSquareOptions,
            cornersDotOptions,
            backgroundOptions,
            imageOptions: {
                crossOrigin: "anonymous" as const,
                margin: s.imageMargin,
                imageSize: s.imageSize,
                hideBackgroundDots: s.hideBackgroundDots,
                saveAsBlob: s.saveAsBlob,
            },
        };
    }, [state, getQRData]);

    // ── QR render effect ──────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const QRCodeStyling = (await import("qr-code-styling")).default;
            if (cancelled || !qrRef.current) return;
            const opts = buildQROpts();

            // Strategy: qr-border-plugin registers a permanent extension callback.
            // To avoid stacking callbacks (border drawn multiple times) or leaving
            // a stale border when disabled, we destroy and recreate the QR instance
            // whenever: (a) border is active, or (b) border was just turned off.
            const needsRecreate = state.borderEnabled || (!state.borderEnabled && borderApplied.current);

            if (needsRecreate) {
                qrInstance.current = null;
                if (qrRef.current) qrRef.current.innerHTML = "";
            }

            if (qrInstance.current) {
                qrInstance.current.update(opts as any);
            } else {
                qrInstance.current = new QRCodeStyling(opts as any);
                if (qrRef.current) {
                    qrRef.current.innerHTML = "";
                    qrInstance.current.append(qrRef.current);
                }
            }

            borderApplied.current = false;

            if (state.borderEnabled && state.licenseKey) {
                try {
                    const QRBorder = (await import("qr-border-plugin")).default;
                    QRBorder.setKey(state.licenseKey);
                    qrInstance.current.applyExtension(
                        QRBorder({
                            round: state.borderRound,
                            thickness: state.borderThickness,
                            color: state.borderColor,
                            dasharray: state.borderDasharray,
                            decorations: {
                                top:    { type: "text" as const, value: state.borderTopText,    style: state.borderTextStyle },
                                bottom: { type: "text" as const, value: state.borderBottomText, style: state.borderTextStyle },
                                left:   { type: "text" as const, value: state.borderLeftText,   style: state.borderTextStyle },
                                right:  { type: "text" as const, value: state.borderRightText,  style: state.borderTextStyle },
                            },
                            borderInner: {
                                color: state.borderInnerColor,
                                thickness: state.borderInnerThickness,
                                dasharray: state.borderInnerDasharray,
                            },
                            borderOuter: {
                                color: state.borderOuterColor,
                                thickness: state.borderOuterThickness,
                                dasharray: state.borderOuterDasharray,
                            },
                        } as any)
                    );
                    borderApplied.current = true;
                } catch (e) {
                    console.warn("QR Border Plugin:", e);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [state, buildQROpts]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleDownload = () => qrInstance.current?.download({ extension: state.fileExt });

    const handleCopyData = () => {
        navigator.clipboard.writeText(getQRData());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const rotateLicense = () =>
        setState((prev) => ({
            ...prev,
            licenseKey: generateLicenseKey(
                "qr-border-plugin", LicensingModel.Perpetual, "SM Network", 1,
                typeof window !== "undefined" ? window.location.hostname : "localhost"
            ),
        }));

    const exportSettings = () => {
        const blob = new Blob(
            [JSON.stringify({ qrOptions: buildQROpts(), borderEnabled: state.borderEnabled }, null, 2)],
            { type: "application/json" }
        );
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "qr-settings.json";
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // Shorthand props passed to every Section
    const sectionProps = { theme, Card, openSection, setOpenSection };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <ToolPageWrapper
            title="QR Generator"
            description="Generate fully customisable QR codes — UPI, WiFi, Bluetooth, vCard, Email, Phone, Text, URL"
            icon={<QrCode2 sx={{ fontSize: 24 }} />}
            accentColor="#34C759"
        >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* ── LEFT : Controls ─────────────────────────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* Data Type */}
                    <Section id="datatype" icon={<QrCode2 sx={{ fontSize: 18 }} />} title="Data Type" {...sectionProps}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {DATA_TYPES.map((dt) => (
                                <motion.button key={dt.value} onClick={() => update("dataType", dt.value)} whileTap={{ scale: 0.93 }}
                                    style={{
                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                        padding: "10px 6px", borderRadius: isApple ? 14 : 18, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                        background: state.dataType === dt.value ? `${palette.accent}18` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                        color: state.dataType === dt.value ? palette.accent : palette.textSecondary,
                                        border: `1.5px solid ${state.dataType === dt.value ? `${palette.accent}50` : "transparent"}`,
                                    }}>
                                    {dt.icon}{dt.label}
                                </motion.button>
                            ))}
                        </div>
                    </Section>

                    {/* Content */}
                    <Section id="data" icon={<Settings sx={{ fontSize: 18 }} />} title="Content" {...sectionProps}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                            {(state.dataType === "text" || state.dataType === "url" || state.dataType === "phone") && (
                                <Field
                                    label={state.dataType === "phone" ? "Phone Number" : state.dataType === "url" ? "URL" : "Text"}
                                    value={state.text} onChange={(v) => update("text", v)}
                                    placeholder={state.dataType === "url" ? "https://example.com" : state.dataType === "phone" ? "+1234567890" : "Enter text…"}
                                    type={state.dataType === "phone" ? "tel" : "text"}
                                    theme={theme} />
                            )}

                            {state.dataType === "upi" && (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        <Field label="UPI ID (VPA)" value={state.upi.pa} onChange={(v) => updateNested("upi", { pa: v })} placeholder="user@upi" theme={theme} />
                                        <Field label="Payee Name" value={state.upi.pn} onChange={(v) => updateNested("upi", { pn: v })} placeholder="Recipient name" theme={theme} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        <Field label="Amount ₹" value={state.upi.am ?? ""} onChange={(v) => updateNested("upi", { am: v || null })} placeholder="100" type="number" theme={theme} />
                                        <Field label="Transaction Note" value={state.upi.tn ?? ""} onChange={(v) => updateNested("upi", { tn: v || null })} placeholder="Payment note" theme={theme} />
                                    </div>
                                    <details>
                                        <summary style={{ fontSize: 12, fontWeight: 700, color: palette.textSecondary, cursor: "pointer", marginBottom: 6 }}>Advanced UPI Fields</summary>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <Field label="Merchant Code (mc)" value={state.upi.mc ?? ""} onChange={(v) => updateNested("upi", { mc: v || null })} theme={theme} />
                                                <Field label="Transaction Ref (tr)" value={state.upi.tr ?? ""} onChange={(v) => updateNested("upi", { tr: v || null })} theme={theme} />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <Field label="Ref URL" value={state.upi.url ?? ""} onChange={(v) => updateNested("upi", { url: v || null })} placeholder="https://" theme={theme} />
                                                <Field label="Transaction ID (tid)" value={state.upi.tid ?? ""} onChange={(v) => updateNested("upi", { tid: v || null })} theme={theme} />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <Field label="Invoice No" value={state.upi.invoiceNo ?? ""} onChange={(v) => updateNested("upi", { invoiceNo: v || null })} theme={theme} />
                                                <Field label="Invoice Date" value={state.upi.invoiceDate ?? ""} onChange={(v) => updateNested("upi", { invoiceDate: v || null })} placeholder="2024-01-15" theme={theme} />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <Field label="GSTIN" value={state.upi.gstin ?? ""} onChange={(v) => updateNested("upi", { gstin: v || null })} theme={theme} />
                                                <Field label="GST Breakdown" value={state.upi.gstBrkUp ?? ""} onChange={(v) => updateNested("upi", { gstBrkUp: v || null })} theme={theme} />
                                            </div>
                                        </div>
                                    </details>
                                </>
                            )}

                            {state.dataType === "wifi" && (
                                <>
                                    <Field label="Network SSID" value={state.wifi.ssid} onChange={(v) => updateNested("wifi", { ssid: v })} placeholder="WiFi name" theme={theme} />
                                    <Field label="Password" value={state.wifi.password} onChange={(v) => updateNested("wifi", { password: v })} type="password" theme={theme} />
                                    <Pill label="Security Type" options={["WPA", "WEP", "nopass"] as const}
                                        value={state.wifi.type} onChange={(v) => updateNested("wifi", { type: v })} theme={theme} />
                                    <Toggle label="Hidden Network" checked={state.wifi.hidden} onChange={(v) => updateNested("wifi", { hidden: v })} theme={theme} />
                                </>
                            )}

                            {state.dataType === "bluetooth" && (
                                <>
                                    <Field label="Device Name" value={state.bluetooth.name} onChange={(v) => updateNested("bluetooth", { name: v })} placeholder="My Bluetooth Device" theme={theme} />
                                    <Field label="MAC Address" value={state.bluetooth.address} onChange={(v) => updateNested("bluetooth", { address: v })} placeholder="00:11:22:33:44:55" theme={theme} />
                                </>
                            )}

                            {state.dataType === "vcard" && (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        <Field label="Full Name" value={state.vcard.name} onChange={(v) => updateNested("vcard", { name: v })} theme={theme} />
                                        <Field label="Phone" value={state.vcard.phone} onChange={(v) => updateNested("vcard", { phone: v })} type="tel" theme={theme} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        <Field label="Email" value={state.vcard.email} onChange={(v) => updateNested("vcard", { email: v })} type="email" theme={theme} />
                                        <Field label="Organisation" value={state.vcard.org} onChange={(v) => updateNested("vcard", { org: v })} theme={theme} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                        <Field label="Job Title" value={state.vcard.title} onChange={(v) => updateNested("vcard", { title: v })} theme={theme} />
                                        <Field label="Website" value={state.vcard.url} onChange={(v) => updateNested("vcard", { url: v })} placeholder="https://" theme={theme} />
                                    </div>
                                    <Field label="Address" value={state.vcard.address} onChange={(v) => updateNested("vcard", { address: v })} placeholder="123 Street, City, Country" theme={theme} />
                                </>
                            )}

                            {state.dataType === "email" && (
                                <>
                                    <Field label="To" value={state.email.to} onChange={(v) => updateNested("email", { to: v })} placeholder="recipient@email.com" type="email" theme={theme} />
                                    <Field label="Subject" value={state.email.subject} onChange={(v) => updateNested("email", { subject: v })} theme={theme} />
                                    <Field label="Message Body" value={state.email.body} onChange={(v) => updateNested("email", { body: v })} theme={theme} />
                                </>
                            )}
                        </div>
                    </Section>

                    {/* Style & Appearance */}
                    <Section id="style" icon={<Palette sx={{ fontSize: 18 }} />} title="Style & Appearance" {...sectionProps}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                            <Pill label="QR Shape" options={["square", "circle"] as const} value={state.shape} onChange={(v) => update("shape", v)} theme={theme} />
                            <Pill label="Render Engine" options={["svg", "canvas"] as const} value={state.drawType} onChange={(v) => update("drawType", v)} theme={theme} />

                            {/* Dots */}
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary, display: "block", marginBottom: 6 }}>Dot Style</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {(["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"] as DotType[]).map((t) => (
                                        <motion.button key={t} whileTap={{ scale: 0.93 }} onClick={() => update("dotType", t)}
                                            style={{
                                                padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                                background: state.dotType === t ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                                color: state.dotType === t ? "#fff" : palette.textSecondary,
                                                border: `1px solid ${state.dotType === t ? palette.accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                            }}>
                                            {t}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                            <Toggle label="Round Dot Size (smoother edges)" checked={state.dotsRoundSize} onChange={(v) => update("dotsRoundSize", v)} theme={theme} />
                            <ColorModeSection label="Dots Color"
                                mode={state.dotColorMode} onModeChange={(m) => update("dotColorMode", m)}
                                color={state.dotColor} onColorChange={(c) => update("dotColor", c)}
                                gradient={state.dotGradient} onGradientChange={(g) => update("dotGradient", g)}
                                theme={theme} />

                            {/* Corner Square */}
                            <Pill label="Corner Square Style" options={["square", "extra-rounded", "dot"] as const}
                                value={state.cornerSquareType} onChange={(v) => update("cornerSquareType", v)} theme={theme} />
                            <ColorModeSection label="Corner Square Color"
                                mode={state.cornerSquareColorMode} onModeChange={(m) => update("cornerSquareColorMode", m)}
                                color={state.cornerSquareColor} onColorChange={(c) => update("cornerSquareColor", c)}
                                gradient={state.cornerSquareGradient} onGradientChange={(g) => update("cornerSquareGradient", g)}
                                theme={theme} />

                            {/* Corner Dot */}
                            <Pill label="Corner Dot Style" options={["square", "dot"] as const}
                                value={state.cornerDotType} onChange={(v) => update("cornerDotType", v)} theme={theme} />
                            <ColorModeSection label="Corner Dot Color"
                                mode={state.cornerDotColorMode} onModeChange={(m) => update("cornerDotColorMode", m)}
                                color={state.cornerDotColor} onColorChange={(c) => update("cornerDotColor", c)}
                                gradient={state.cornerDotGradient} onGradientChange={(g) => update("cornerDotGradient", g)}
                                theme={theme} />

                            {/* Background */}
                            <ColorModeSection label="Background"
                                mode={state.bgColorMode} onModeChange={(m) => update("bgColorMode", m)}
                                color={state.bgColor} onColorChange={(c) => update("bgColor", c)}
                                gradient={state.bgGradient} onGradientChange={(g) => update("bgGradient", g)}
                                theme={theme} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>
                                    Background Corner Radius: {Math.round(state.bgRound * 100)}%
                                </label>
                                <input type="range" min={0} max={100} value={Math.round(state.bgRound * 100)}
                                    onChange={(e) => update("bgRound", +e.target.value / 100)}
                                    style={{ accentColor: palette.accent, width: "100%" }} />
                            </div>
                        </div>
                    </Section>

                    {/* Logo & Image */}
                    <Section id="image" icon={<ImageOutlined sx={{ fontSize: 18 }} />} title="Logo & Image" {...sectionProps}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <Field label="Image URL" value={state.imageUrl} onChange={(v) => update("imageUrl", v)}
                                placeholder="https://example.com/logo.png or /favicon.ico" theme={theme} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Image Size: {state.imageSize.toFixed(2)}</label>
                                <input type="range" min={0.1} max={0.8} step={0.05} value={state.imageSize}
                                    onChange={(e) => update("imageSize", +e.target.value)} style={{ accentColor: palette.accent }} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Image Margin: {state.imageMargin}px</label>
                                <input type="range" min={0} max={20} value={state.imageMargin}
                                    onChange={(e) => update("imageMargin", +e.target.value)} style={{ accentColor: palette.accent }} />
                            </div>
                            <Toggle label="Hide Background Dots Behind Image" checked={state.hideBackgroundDots} onChange={(v) => update("hideBackgroundDots", v)} theme={theme} />
                            <Toggle label="Save as Blob (better cross-origin support)" checked={state.saveAsBlob} onChange={(v) => update("saveAsBlob", v)} theme={theme} />
                        </div>
                    </Section>

                    {/* Border & Decorations */}
                    <Section id="border" icon={<BorderOuter sx={{ fontSize: 18 }} />} title="Border & Decorations" {...sectionProps}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <Toggle label="Enable Border Design" checked={state.borderEnabled} onChange={(v) => update("borderEnabled", v)} theme={theme} />

                            {state.borderEnabled && (
                                <>
                                    {/* Main ring */}
                                    <fieldset style={{
                                        padding: 12, borderRadius: isApple ? 12 : 16, margin: 0,
                                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,
                                    }}>
                                        <legend style={{ fontSize: 10, fontWeight: 800, color: palette.textSecondary, textTransform: "uppercase", letterSpacing: 1, padding: "0 6px" }}>Main Ring</legend>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Thickness: {state.borderThickness}px</label>
                                                <input type="range" min={20} max={120} value={state.borderThickness}
                                                    onChange={(e) => update("borderThickness", +e.target.value)} style={{ accentColor: palette.accent }} />
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Corner Radius: {Math.round(state.borderRound * 100)}%</label>
                                                <input type="range" min={0} max={100} value={Math.round(state.borderRound * 100)}
                                                    onChange={(e) => update("borderRound", +e.target.value / 100)} style={{ accentColor: palette.accent }} />
                                            </div>
                                            <ColorRow label="Color" value={state.borderColor} onChange={(v) => update("borderColor", v)} theme={theme} />
                                            <Field label="Dash Array (e.g. 0 · 4 8 · 10 5 5)" value={state.borderDasharray}
                                                onChange={(v) => update("borderDasharray", v)} placeholder="0" theme={theme} />
                                        </div>
                                    </fieldset>

                                    {/* Decorations */}
                                    <fieldset style={{
                                        padding: 12, borderRadius: isApple ? 12 : 16, margin: 0,
                                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,
                                    }}>
                                        <legend style={{ fontSize: 10, fontWeight: 800, color: palette.textSecondary, textTransform: "uppercase", letterSpacing: 1, padding: "0 6px" }}>Decoration Text</legend>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <Field label="Top" value={state.borderTopText} onChange={(v) => update("borderTopText", v)} placeholder="Scan Here" theme={theme} />
                                                <Field label="Bottom" value={state.borderBottomText} onChange={(v) => update("borderBottomText", v)} placeholder="Try Me" theme={theme} />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <Field label="Left" value={state.borderLeftText} onChange={(v) => update("borderLeftText", v)} placeholder="" theme={theme} />
                                                <Field label="Right" value={state.borderRightText} onChange={(v) => update("borderRightText", v)} placeholder="" theme={theme} />
                                            </div>
                                            <Field label="Text Style (SVG CSS — applies to all sides)" value={state.borderTextStyle}
                                                onChange={(v) => update("borderTextStyle", v)}
                                                placeholder="font: 30px sans-serif; fill: #D5B882;" theme={theme} />
                                        </div>
                                    </fieldset>

                                    {/* Inner ring */}
                                    <fieldset style={{
                                        padding: 12, borderRadius: isApple ? 12 : 16, margin: 0,
                                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,
                                    }}>
                                        <legend style={{ fontSize: 10, fontWeight: 800, color: palette.textSecondary, textTransform: "uppercase", letterSpacing: 1, padding: "0 6px" }}>Inner Ring</legend>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Thickness: {state.borderInnerThickness}px</label>
                                                <input type="range" min={0} max={20} value={state.borderInnerThickness}
                                                    onChange={(e) => update("borderInnerThickness", +e.target.value)} style={{ accentColor: palette.accent }} />
                                            </div>
                                            <ColorRow label="Color" value={state.borderInnerColor} onChange={(v) => update("borderInnerColor", v)} theme={theme} />
                                            <Field label="Dash Array" value={state.borderInnerDasharray} onChange={(v) => update("borderInnerDasharray", v)} placeholder="0" theme={theme} />
                                        </div>
                                    </fieldset>

                                    {/* Outer ring */}
                                    <fieldset style={{
                                        padding: 12, borderRadius: isApple ? 12 : 16, margin: 0,
                                        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)"}`,
                                    }}>
                                        <legend style={{ fontSize: 10, fontWeight: 800, color: palette.textSecondary, textTransform: "uppercase", letterSpacing: 1, padding: "0 6px" }}>Outer Ring</legend>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Thickness: {state.borderOuterThickness}px</label>
                                                <input type="range" min={0} max={20} value={state.borderOuterThickness}
                                                    onChange={(e) => update("borderOuterThickness", +e.target.value)} style={{ accentColor: palette.accent }} />
                                            </div>
                                            <ColorRow label="Color" value={state.borderOuterColor} onChange={(v) => update("borderOuterColor", v)} theme={theme} />
                                            <Field label="Dash Array" value={state.borderOuterDasharray} onChange={(v) => update("borderOuterDasharray", v)} placeholder="0" theme={theme} />
                                        </div>
                                    </fieldset>

                                    {/* Quick actions */}
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setState((prev) => ({
                                            ...prev,
                                            borderThickness: 60, borderColor: "#000000", borderRound: 0, borderDasharray: "0",
                                            borderTopText: "Scan Here", borderBottomText: "Try Me", borderLeftText: "", borderRightText: "",
                                            borderTextStyle: "font: 30px sans-serif; fill: #D5B882;",
                                            borderInnerColor: "#000000", borderInnerThickness: 0, borderInnerDasharray: "0",
                                            borderOuterColor: "#000000", borderOuterThickness: 0, borderOuterDasharray: "0",
                                        }))}
                                            style={{
                                                padding: "7px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                                background: `${palette.accent}15`, color: palette.accent, border: `1px solid ${palette.accent}30`,
                                            }}>🔄 Reset Border</motion.button>
                                        <motion.button whileTap={{ scale: 0.93 }} onClick={() => update("borderEnabled", false)}
                                            style={{
                                                padding: "7px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                                background: "#ff3b3015", color: "#ff3b30", border: "1px solid #ff3b3030",
                                            }}>🚫 Remove Border</motion.button>
                                    </div>
                                </>
                            )}
                        </div>
                    </Section>

                    {/* Quality & Size */}
                    <Section id="quality" icon={<Security sx={{ fontSize: 18 }} />} title="Quality & Size" {...sectionProps}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary, display: "block", marginBottom: 6 }}>Error Correction</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                                    {(["L", "M", "Q", "H"] as const).map((lvl, i) => {
                                        const descs = ["~7%", "~15%", "~25%", "~30%"];
                                        return (
                                            <motion.button key={lvl} whileTap={{ scale: 0.93 }} onClick={() => update("errorCorrection", lvl)}
                                                style={{
                                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                                                    padding: "8px 4px", borderRadius: isApple ? 12 : 16, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                                    background: state.errorCorrection === lvl ? `${palette.accent}18` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                                    color: state.errorCorrection === lvl ? palette.accent : palette.textSecondary,
                                                    border: `1.5px solid ${state.errorCorrection === lvl ? `${palette.accent}50` : "transparent"}`,
                                                }}>
                                                <span style={{ fontWeight: 900 }}>{lvl}</span>
                                                <span style={{ fontSize: 10, opacity: 0.7 }}>{descs[i]}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <Field label="Width (px)" value={state.width.toString()} type="number" placeholder="400"
                                    onChange={(v) => update("width", Math.max(100, Math.min(2000, +v || 400)))} theme={theme} />
                                <Field label="Height (px)" value={state.height.toString()} type="number" placeholder="400"
                                    onChange={(v) => update("height", Math.max(100, Math.min(2000, +v || 400)))} theme={theme} />
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {([["300×300", 300, 300], ["512×512", 512, 512], ["1024×1024", 1024, 1024]] as [string, number, number][]).map(([lbl, w, h]) => (
                                    <motion.button key={lbl} whileTap={{ scale: 0.93 }}
                                        onClick={() => { update("width", w); update("height", h); }}
                                        style={{
                                            padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                                            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                            color: palette.textSecondary, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                        }}>
                                        {lbl}
                                    </motion.button>
                                ))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: palette.textSecondary }}>Margin: {state.margin}px</label>
                                <input type="range" min={0} max={50} value={state.margin}
                                    onChange={(e) => update("margin", +e.target.value)} style={{ accentColor: palette.accent }} />
                            </div>
                        </div>
                    </Section>

                    {/* Advanced */}
                    <Section id="advanced" icon={<Tune sx={{ fontSize: 18 }} />} title="Advanced" {...sectionProps}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{
                                padding: 12, borderRadius: isApple ? 12 : 16,
                                background: isDark ? "rgba(255,149,0,0.10)" : "rgba(255,149,0,0.07)",
                                border: "1px solid rgba(255,149,0,0.20)",
                            }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#ff9500", margin: "0 0 4px" }}>QR Border Plugin License</p>
                                <p style={{ fontSize: 11, color: palette.textSecondary, margin: "0 0 8px" }}>
                                    Auto-generated demo key. Purchase production key at{" "}
                                    <a href="https://www.lefe.dev/marketplace/qr-border-plugin#pricing"
                                        target="_blank" rel="noopener noreferrer" style={{ color: palette.accent, textDecoration: "underline" }}>
                                        Lefe Marketplace
                                    </a>.
                                </p>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Field label="" value={state.licenseKey} onChange={(v) => update("licenseKey", v)} placeholder="license-key" theme={theme} />
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={rotateLicense}
                                        style={{ padding: "8px 12px", borderRadius: isApple ? 10 : 14, cursor: "pointer", background: "rgba(255,149,0,0.15)", color: "#ff9500", border: "none", flexShrink: 0 }}
                                        title="Rotate license key">
                                        <Refresh sx={{ fontSize: 18 }} />
                                    </motion.button>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={exportSettings}
                                    style={{
                                        padding: "10px 14px", borderRadius: isApple ? 12 : 16, fontSize: 12, fontWeight: 700, cursor: "pointer",
                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                        color: palette.textSecondary, border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                    }}>
                                    💾 Export Settings
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => setState((prev) => ({ ...DEFAULT_STATE, licenseKey: prev.licenseKey }))}
                                    style={{ padding: "10px 14px", borderRadius: isApple ? 12 : 16, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "#ff3b3010", color: "#ff3b30", border: "1px solid #ff3b3025" }}>
                                    🔄 Reset All
                                </motion.button>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* ── RIGHT : Preview + Download ──────────────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* QR Preview */}
                    <Card>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h3 style={{ fontSize: isApple ? 14 : 17, fontWeight: isApple ? 600 : 900, color: palette.textPrimary, margin: 0 }}>Preview</h3>
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: state.bgColor, borderRadius: isApple ? 16 : 24,
                                padding: 16, minHeight: 280,
                                boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)",
                            }}>
                                <div ref={qrRef} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {[
                                    { label: "Type",    value: state.dataType.toUpperCase() },
                                    { label: "Size",    value: `${state.width}×${state.height}` },
                                    { label: "EC",      value: state.errorCorrection },
                                    { label: "Border",  value: state.borderEnabled ? "On" : "Off" },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{
                                        padding: "8px 12px", borderRadius: isApple ? 10 : 14,
                                        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                                    }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: palette.textTertiary, marginBottom: 2 }}>{label}</div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: palette.textPrimary }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Download */}
                    <Card>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <h3 style={{ fontSize: isApple ? 14 : 16, fontWeight: isApple ? 600 : 900, color: palette.textPrimary, margin: 0 }}>Download</h3>
                            <Pill label="Format" options={["png", "svg", "jpeg", "webp"] as const} value={state.fileExt} onChange={(v) => update("fileExt", v)} theme={theme} />
                            <div style={{ display: "flex", gap: 8 }}>
                                <motion.button onClick={handleDownload} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    style={{
                                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                        padding: "12px 20px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                                        background: "linear-gradient(135deg,#34C759,#30B350)", color: "#fff", border: "none",
                                    }}>
                                    <Download sx={{ fontSize: 18 }} />Download .{state.fileExt}
                                </motion.button>
                                <motion.button onClick={handleCopyData} whileTap={{ scale: 0.95 }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 6, padding: "12px 16px",
                                        borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer",
                                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                        color: copied ? "#34C759" : palette.textSecondary,
                                        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                    }}>
                                    {copied ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                                    {copied ? "Copied!" : "Copy Data"}
                                </motion.button>
                            </div>
                        </div>
                    </Card>

                    {/* Reference */}
                    <Card>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <h3 style={{ fontSize: isApple ? 13 : 15, fontWeight: isApple ? 600 : 900, color: palette.textPrimary, margin: 0 }}>Reference</h3>
                            {[
                                ["🔗 URL / Text",  "Any website URL or raw text string"],
                                ["💳 UPI Payment", "India UPI deep-link — works with PhonePe, GPay, Paytm"],
                                ["📶 WiFi",         "Auto-connects device to the Wi-Fi network on scan"],
                                ["🔵 Bluetooth",    "Bluetooth device pairing — name + MAC address"],
                                ["👤 Contact",      "vCard 3.0 — saves directly to contacts on scan"],
                                ["📧 Email",        "Pre-fills email client with to, subject and body"],
                                ["📞 Phone",        "Opens dialler with the number on scan"],
                            ].map(([type, desc]) => (
                                <div key={type as string} style={{ display: "flex", gap: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: palette.textPrimary, minWidth: 110, flexShrink: 0 }}>{type}</span>
                                    <span style={{ fontSize: 11, color: palette.textSecondary }}>{desc}</span>
                                </div>
                            ))}
                            <div style={{ paddingTop: 8, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                                <p style={{ fontSize: 11, color: palette.textTertiary, margin: 0 }}>
                                    <strong>Error Correction:</strong> L ~7% · M ~15% · Q ~25% · H ~30%.
                                    Higher levels tolerate more damage but produce denser codes.
                                </p>
                                <p style={{ fontSize: 11, color: palette.textTertiary, margin: "6px 0 0" }}>
                                    <strong>Dash Array:</strong> SVG stroke-dasharray — "0" = solid, "4 8" = dashed, "10 5 5" = dash-dot.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolPageWrapper>
    );
}
