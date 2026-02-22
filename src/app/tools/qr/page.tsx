/**
 * QR Generator — /tools/qr
 * Generate customisable QR codes with multiple data types, styling options
 * and download in SVG/PNG/JPEG/WebP.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    QrCode2,
    ContentCopy,
    Download,
    Refresh,
    TextFields,
    Link as LinkIcon,
    Wifi,
    Email,
    Phone,
    ContactPage,
    Settings,
    Palette,
    Check
} from "@mui/icons-material";

type QRDataType = "text" | "url" | "wifi" | "email" | "phone" | "vcard";
type QRDotStyle = "square" | "dots" | "rounded" | "classy" | "classy-rounded";
type QRCornerStyle = "square" | "dot" | "extra-rounded";
type FileFormat = "png" | "svg" | "jpeg" | "webp";

interface QRState {
    data: string;
    dataType: QRDataType;
    size: number;
    margin: number;
    fgColor: string;
    bgColor: string;
    dotStyle: QRDotStyle;
    cornerStyle: QRCornerStyle;
    errorCorrection: "L" | "M" | "Q" | "H";
    // WiFi
    wifiSSID: string;
    wifiPassword: string;
    wifiEncryption: "WPA" | "WEP" | "nopass";
    // Email
    emailTo: string;
    emailSubject: string;
    emailBody: string;
    // vCard
    vcardName: string;
    vcardPhone: string;
    vcardEmail: string;
    vcardOrg: string;
}

const DATA_TYPES: { value: QRDataType; label: string; icon: React.ReactNode }[] = [
    { value: "text", label: "Text", icon: <TextFields sx={{ fontSize: 16 }} /> },
    { value: "url", label: "URL", icon: <LinkIcon sx={{ fontSize: 16 }} /> },
    { value: "wifi", label: "WiFi", icon: <Wifi sx={{ fontSize: 16 }} /> },
    { value: "email", label: "Email", icon: <Email sx={{ fontSize: 16 }} /> },
    { value: "phone", label: "Phone", icon: <Phone sx={{ fontSize: 16 }} /> },
    { value: "vcard", label: "vCard", icon: <ContactPage sx={{ fontSize: 16 }} /> }
];

const DEFAULT_STATE: QRState = {
    data: "https://meetbhingradiya.com",
    dataType: "url",
    size: 300,
    margin: 10,
    fgColor: "#000000",
    bgColor: "#FFFFFF",
    dotStyle: "square",
    cornerStyle: "square",
    errorCorrection: "M",
    wifiSSID: "",
    wifiPassword: "",
    wifiEncryption: "WPA",
    emailTo: "",
    emailSubject: "",
    emailBody: "",
    vcardName: "",
    vcardPhone: "",
    vcardEmail: "",
    vcardOrg: ""
};

export default function QRGeneratorPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [state, setState] = useState<QRState>(DEFAULT_STATE);
    const [copied, setCopied] = useState(false);
    const [fileFormat, setFileFormat] = useState<FileFormat>("png");
    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<any>(null);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.qr) return;
        defaultsApplied.current = true;
        const d = toolDefaults.qr;
        setState((prev) => ({
            ...prev,
            size: d.size ?? prev.size,
            fgColor: d.foreground ?? prev.fgColor,
            bgColor: d.background ?? prev.bgColor,
            dotStyle: (d.dotStyle as QRDotStyle) ?? prev.dotStyle,
            cornerStyle: (d.cornerStyle as QRCornerStyle) ?? prev.cornerStyle,
            errorCorrection: (d.errorCorrection as "L" | "M" | "Q" | "H") ?? prev.errorCorrection
        }));
    }, [toolDefaults]);

    const update = useCallback((patch: Partial<QRState>) => {
        setState((prev) => ({ ...prev, ...patch }));
    }, []);

    // Build QR data string based on type
    const getQRData = useCallback((): string => {
        switch (state.dataType) {
            case "wifi":
                return `WIFI:T:${state.wifiEncryption};S:${state.wifiSSID};P:${state.wifiPassword};;`;
            case "email":
                return `mailto:${state.emailTo}?subject=${encodeURIComponent(state.emailSubject)}&body=${encodeURIComponent(state.emailBody)}`;
            case "phone":
                return `tel:${state.data}`;
            case "vcard":
                return [
                    "BEGIN:VCARD",
                    "VERSION:3.0",
                    `FN:${state.vcardName}`,
                    `TEL:${state.vcardPhone}`,
                    `EMAIL:${state.vcardEmail}`,
                    `ORG:${state.vcardOrg}`,
                    "END:VCARD"
                ].join("\n");
            default:
                return state.data;
        }
    }, [state]);

    // Initialize & update QR via qr-code-styling
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const QRCodeStyling = (await import("qr-code-styling")).default;
            if (cancelled) return;

            const data = getQRData();
            if (!data) return;

            const opts: any = {
                width: state.size,
                height: state.size,
                margin: state.margin,
                data,
                dotsOptions: { type: state.dotStyle, color: state.fgColor },
                cornersSquareOptions: { type: state.cornerStyle, color: state.fgColor },
                backgroundOptions: { color: state.bgColor },
                qrOptions: { errorCorrectionLevel: state.errorCorrection }
            };

            if (qrInstance.current) {
                qrInstance.current.update(opts);
            } else {
                qrInstance.current = new QRCodeStyling(opts);
                if (qrRef.current) {
                    qrRef.current.innerHTML = "";
                    qrInstance.current.append(qrRef.current);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [state, getQRData]);

    const handleDownload = () => {
        qrInstance.current?.download({ extension: fileFormat });
    };

    const handleCopyData = () => {
        navigator.clipboard.writeText(getQRData());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    // ── Input field helper ────────────────────────────────────────────────────
    const Input = ({
        label,
        value,
        onChange,
        placeholder,
        type = "text"
    }: {
        label: string;
        value: string;
        onChange: (v: string) => void;
        placeholder?: string;
        type?: string;
    }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                    color: palette.textPrimary,
                    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                    borderRadius: isApple ? "12px" : "16px"
                }}
            />
        </div>
    );

    // ── Pill selector helper ─────────────────────────────────────────────────
    const PillSelect = <T extends string>({
        options,
        value,
        onChange,
        label,
        renderLabel
    }: {
        options: T[];
        value: T;
        onChange: (v: T) => void;
        label: string;
        renderLabel?: (o: T) => React.ReactNode;
    }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>
                {label}
            </label>
            <div className="flex flex-wrap gap-1.5">
                {options.map((o) => (
                    <motion.button
                        key={o}
                        onClick={() => onChange(o)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                            background: value === o ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                            color: value === o ? "#fff" : palette.textSecondary,
                            border: `1px solid ${value === o ? palette.accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {renderLabel ? renderLabel(o) : o}
                    </motion.button>
                ))}
            </div>
        </div>
    );

    return (
        <ToolPageWrapper
            title="QR Generator"
            description="Generate and customise QR codes"
            icon={<QrCode2 sx={{ fontSize: 24 }} />}
            accentColor="#34C759"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Left : Config ── */}
                <div className="space-y-5">
                    {/* Data type selector */}
                    <Card>
                        <div className="space-y-4">
                            <h3 className={`${isApple ? "text-base font-semibold" : "text-lg font-black"}`} style={{ color: palette.textPrimary }}>
                                Data Type
                            </h3>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {DATA_TYPES.map((dt) => (
                                    <motion.button
                                        key={dt.value}
                                        onClick={() => update({ dataType: dt.value })}
                                        className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-bold"
                                        style={{
                                            background: state.dataType === dt.value ? `${palette.accent}18` : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                                            color: state.dataType === dt.value ? palette.accent : palette.textSecondary,
                                            border: `1.5px solid ${state.dataType === dt.value ? `${palette.accent}40` : "transparent"}`
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {dt.icon}
                                        {dt.label}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Data input fields based on type */}
                    <Card>
                        <div className="space-y-4">
                            <h3 className={`${isApple ? "text-base font-semibold" : "text-lg font-black"}`} style={{ color: palette.textPrimary }}>
                                Content
                            </h3>

                            {(state.dataType === "text" || state.dataType === "url" || state.dataType === "phone") && (
                                <Input
                                    label={state.dataType === "phone" ? "Phone Number" : state.dataType === "url" ? "URL" : "Text"}
                                    value={state.data}
                                    onChange={(v) => update({ data: v })}
                                    placeholder={state.dataType === "url" ? "https://example.com" : state.dataType === "phone" ? "+1234567890" : "Enter text..."}
                                />
                            )}

                            {state.dataType === "wifi" && (
                                <>
                                    <Input label="SSID" value={state.wifiSSID} onChange={(v) => update({ wifiSSID: v })} placeholder="Network name" />
                                    <Input label="Password" value={state.wifiPassword} onChange={(v) => update({ wifiPassword: v })} placeholder="WiFi password" type="password" />
                                    <PillSelect label="Encryption" options={["WPA", "WEP", "nopass"] as const} value={state.wifiEncryption} onChange={(v) => update({ wifiEncryption: v as any })} />
                                </>
                            )}

                            {state.dataType === "email" && (
                                <>
                                    <Input label="To" value={state.emailTo} onChange={(v) => update({ emailTo: v })} placeholder="recipient@email.com" />
                                    <Input label="Subject" value={state.emailSubject} onChange={(v) => update({ emailSubject: v })} />
                                    <Input label="Body" value={state.emailBody} onChange={(v) => update({ emailBody: v })} />
                                </>
                            )}

                            {state.dataType === "vcard" && (
                                <>
                                    <Input label="Full Name" value={state.vcardName} onChange={(v) => update({ vcardName: v })} />
                                    <Input label="Phone" value={state.vcardPhone} onChange={(v) => update({ vcardPhone: v })} />
                                    <Input label="Email" value={state.vcardEmail} onChange={(v) => update({ vcardEmail: v })} />
                                    <Input label="Organisation" value={state.vcardOrg} onChange={(v) => update({ vcardOrg: v })} />
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Styling */}
                    <Card>
                        <div className="space-y-4">
                            <h3 className={`${isApple ? "text-base font-semibold" : "text-lg font-black"}`} style={{ color: palette.textPrimary }}>
                                <Settings sx={{ fontSize: 16, marginRight: 8 }} />
                                Styling
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Foreground</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={state.fgColor} onChange={(e) => update({ fgColor: e.target.value })} className="w-8 h-8 rounded-lg border-none cursor-pointer" />
                                        <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{state.fgColor}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Background</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={state.bgColor} onChange={(e) => update({ bgColor: e.target.value })} className="w-8 h-8 rounded-lg border-none cursor-pointer" />
                                        <span className="text-xs font-mono" style={{ color: palette.textTertiary }}>{state.bgColor}</span>
                                    </div>
                                </div>
                            </div>

                            <PillSelect label="Dot Style" options={["square", "dots", "rounded", "classy", "classy-rounded"]} value={state.dotStyle} onChange={(v) => update({ dotStyle: v })} />
                            <PillSelect label="Corner Style" options={["square", "dot", "extra-rounded"]} value={state.cornerStyle} onChange={(v) => update({ cornerStyle: v })} />
                            <PillSelect label="Error Correction" options={["L", "M", "Q", "H"]} value={state.errorCorrection} onChange={(v) => update({ errorCorrection: v })} />

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Size: {state.size}px</label>
                                <input
                                    type="range"
                                    min={100}
                                    max={600}
                                    value={state.size}
                                    onChange={(e) => update({ size: Number(e.target.value) })}
                                    className="w-full accent-current"
                                    style={{ accentColor: palette.accent }}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Right : Preview + Download ── */}
                <div className="space-y-5">
                    <Card>
                        <div className="flex flex-col items-center gap-6">
                            <h3 className={`${isApple ? "text-base font-semibold" : "text-lg font-black"} self-start`} style={{ color: palette.textPrimary }}>
                                Preview
                            </h3>

                            <div
                                ref={qrRef}
                                className="flex items-center justify-center p-4 rounded-2xl"
                                style={{
                                    background: state.bgColor,
                                    minHeight: 200,
                                    borderRadius: isApple ? "16px" : "24px",
                                    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)"
                                }}
                            />

                            {/* Download options */}
                            <div className="w-full space-y-3">
                                <PillSelect label="Download Format" options={["png", "svg", "jpeg", "webp"]} value={fileFormat} onChange={(v) => setFileFormat(v)} />

                                <div className="flex gap-2">
                                    <motion.button
                                        onClick={handleDownload}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold"
                                        style={{
                                            background: `linear-gradient(135deg, #34C759, #30B350)`,
                                            color: "#fff"
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <Download sx={{ fontSize: 18 }} />
                                        Download .{fileFormat}
                                    </motion.button>

                                    <motion.button
                                        onClick={handleCopyData}
                                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold"
                                        style={{
                                            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                                            color: copied ? "#34C759" : palette.textSecondary,
                                            border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {copied ? <Check sx={{ fontSize: 18 }} /> : <ContentCopy sx={{ fontSize: 18 }} />}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Quick info */}
                    <Card>
                        <div className="space-y-2">
                            <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>
                                Quick Info
                            </h3>
                            <div className="space-y-1.5 text-xs" style={{ color: palette.textSecondary }}>
                                <p><strong>L</strong> — 7% recovery · <strong>M</strong> — 15% · <strong>Q</strong> — 25% · <strong>H</strong> — 30%</p>
                                <p>Higher error correction allows more damage but creates denser codes.</p>
                                <p>Supports Text, URL, WiFi, Email, Phone and vCard data types.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </ToolPageWrapper>
    );
}
