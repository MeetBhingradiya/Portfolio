/**
 * Password Generator — /tools/password
 * 3 modes: random, passphrase, PIN.
 * Character-type toggles, length slider, strength meter, history.
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import { Password, ContentCopy, Check, Refresh, History, Delete } from "@mui/icons-material";

type GenMode = "random" | "passphrase" | "pin";

interface PasswordConfig {
    length: number;
    uppercase: boolean;
    lowercase: boolean;
    digits: boolean;
    symbols: boolean;
    excludeAmbiguous: boolean;
    wordCount: number;
    separator: string;
    pinLength: number;
}

interface HistoryEntry {
    value: string;
    mode: GenMode;
    strength: number;
    ts: number;
}

const WORDLIST = [
    "apple",
    "banana",
    "cherry",
    "delta",
    "eagle",
    "falcon",
    "gamma",
    "harbor",
    "igloo",
    "jacket",
    "kayak",
    "lemon",
    "mango",
    "noble",
    "ocean",
    "pepper",
    "quartz",
    "river",
    "solar",
    "tiger",
    "ultra",
    "vivid",
    "walnut",
    "xenon",
    "yacht",
    "zephyr",
    "alpha",
    "bravo",
    "coral",
    "drift",
    "ember",
    "frost",
    "globe",
    "haven",
    "ivory",
    "jewel",
    "karma",
    "lunar",
    "maple",
    "nexus",
    "oasis",
    "prism",
    "quest",
    "ridge",
    "storm",
    "thorn",
    "umbra",
    "viper",
    "wrath",
    "xylem"
];

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "Il1O0";

function calcStrength(password: string): number {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    return Math.min(score, 5);
}

const STRENGTH_LABELS = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const STRENGTH_COLORS = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759", "#30D158", "#00C7BE"];

export default function PasswordPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [mode, setMode] = useState<GenMode>("random");
    const [config, setConfig] = useState<PasswordConfig>({
        length: 16,
        uppercase: true,
        lowercase: true,
        digits: true,
        symbols: true,
        excludeAmbiguous: false,
        wordCount: 4,
        separator: "-",
        pinLength: 6
    });
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.password) return;
        defaultsApplied.current = true;
        const d = toolDefaults.password;
        if (d.mode) setMode(d.mode as GenMode);
        setConfig((prev) => ({
            ...prev,
            length: d.length ?? prev.length,
            uppercase: d.uppercase ?? prev.uppercase,
            lowercase: d.lowercase ?? prev.lowercase,
            digits: d.digits ?? prev.digits,
            symbols: d.symbols ?? prev.symbols,
            excludeAmbiguous: d.excludeAmbiguous ?? prev.excludeAmbiguous,
            wordCount: d.wordCount ?? prev.wordCount,
            separator: d.separator ?? prev.separator,
            pinLength: d.pinLength ?? prev.pinLength
        }));
    }, [toolDefaults]);

    const update = useCallback((patch: Partial<PasswordConfig>) => {
        setConfig((p) => ({ ...p, ...patch }));
    }, []);

    const generate = useCallback(() => {
        let result = "";

        if (mode === "random") {
            let charset = "";
            if (config.uppercase) charset += UPPER;
            if (config.lowercase) charset += LOWER;
            if (config.digits) charset += DIGITS;
            if (config.symbols) charset += SYMBOLS;
            if (config.excludeAmbiguous) {
                charset = charset
                    .split("")
                    .filter((c) => !AMBIGUOUS.includes(c))
                    .join("");
            }
            if (!charset) charset = LOWER;
            const arr = new Uint32Array(config.length);
            crypto.getRandomValues(arr);
            result = Array.from(arr, (v) => charset[v % charset.length]).join("");
        } else if (mode === "passphrase") {
            const arr = new Uint32Array(config.wordCount);
            crypto.getRandomValues(arr);
            result = Array.from(arr, (v) => WORDLIST[v % WORDLIST.length]).join(config.separator);
        } else {
            const arr = new Uint32Array(config.pinLength);
            crypto.getRandomValues(arr);
            result = Array.from(arr, (v) => DIGITS[v % DIGITS.length]).join("");
        }

        setPassword(result);
        const strength = calcStrength(result);
        setHistory((h) => [{ value: result, mode, strength, ts: Date.now() }, ...h].slice(0, 50));
    }, [mode, config]);

    // Generate on mount and mode change
    React.useEffect(() => {
        generate();
    }, [mode]);

    const strength = useMemo(() => calcStrength(password), [password]);

    const copy = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    return (
        <ToolPageWrapper
            title="Password Generator"
            description="Generate secure passwords, passphrases and PINs"
            icon={<Password sx={{ fontSize: 24 }} />}
            accentColor="#FF2D55"
            actions={
                <motion.button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 rounded-xl relative"
                    style={{
                        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"
                    }}
                    whileTap={{ scale: 0.9 }}>
                    <History sx={{ fontSize: 16, color: palette.textTertiary }} />
                    {history.length > 0 && (
                        <span
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                            style={{
                                background: palette.accent,
                                color: "#fff"
                            }}>
                            {history.length}
                        </span>
                    )}
                </motion.button>
            }>
            <div className="space-y-6">
                {/* Mode toggle */}
                <div className="flex gap-1.5">
                    {(["random", "passphrase", "pin"] as GenMode[]).map((m) => (
                        <motion.button
                            key={m}
                            onClick={() => setMode(m)}
                            className="px-5 py-2 rounded-full text-sm font-bold capitalize"
                            style={{
                                background: mode === m ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color: mode === m ? "#fff" : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.95 }}>
                            {m === "pin" ? "PIN" : m}
                        </motion.button>
                    ))}
                </div>

                {/* Generated password */}
                <Card>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex-1 px-4 py-3 rounded-xl font-mono text-lg font-bold break-all select-all"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                    color: palette.textPrimary,
                                    border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
                                }}>
                                {password}
                            </div>
                            <motion.button
                                onClick={copy}
                                className="p-2.5 rounded-xl"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)"
                                }}
                                whileTap={{ scale: 0.9 }}>
                                {copied ? (
                                    <Check sx={{ fontSize: 18, color: "#34C759" }} />
                                ) : (
                                    <ContentCopy
                                        sx={{
                                            fontSize: 18,
                                            color: palette.textTertiary
                                        }}
                                    />
                                )}
                            </motion.button>
                            <motion.button
                                onClick={generate}
                                className="p-2.5 rounded-xl"
                                style={{ background: palette.accent }}
                                whileTap={{ scale: 0.9 }}>
                                <Refresh sx={{ fontSize: 18, color: "#fff" }} />
                            </motion.button>
                        </div>

                        {/* Strength meter */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    Strength
                                </span>
                                <span
                                    className="text-xs font-bold"
                                    style={{
                                        color: STRENGTH_COLORS[strength]
                                    }}>
                                    {STRENGTH_LABELS[strength]}
                                </span>
                            </div>
                            <div className="flex gap-1 h-1.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex-1 rounded-full"
                                        style={{
                                            background:
                                                i <= strength
                                                    ? STRENGTH_COLORS[strength]
                                                    : isDark
                                                      ? "rgba(255,255,255,0.08)"
                                                      : "rgba(0,0,0,0.06)"
                                        }}
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Settings */}
                <Card>
                    <h3
                        className={`mb-4 ${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                        style={{ color: palette.textPrimary }}>
                        Settings
                    </h3>

                    {mode === "random" && (
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <label
                                        className="text-xs font-bold"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Length
                                    </label>
                                    <span
                                        className="text-xs font-mono"
                                        style={{ color: palette.textTertiary }}>
                                        {config.length}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={4}
                                    max={128}
                                    value={config.length}
                                    onChange={(e) =>
                                        update({
                                            length: Number(e.target.value)
                                        })
                                    }
                                    className="w-full"
                                    style={{ accentColor: palette.accent }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: "uppercase" as const, label: "A-Z" },
                                    { key: "lowercase" as const, label: "a-z" },
                                    { key: "digits" as const, label: "0-9" },
                                    { key: "symbols" as const, label: "!@#$" },
                                    {
                                        key: "excludeAmbiguous" as const,
                                        label: "No ambiguous (I,l,1,O,0)"
                                    }
                                ].map((opt) => (
                                    <motion.button
                                        key={opt.key}
                                        onClick={() =>
                                            update({
                                                [opt.key]: !config[opt.key]
                                            })
                                        }
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
                                        style={{
                                            background: config[opt.key]
                                                ? `${palette.accent}15`
                                                : isDark
                                                  ? "rgba(255,255,255,0.05)"
                                                  : "rgba(0,0,0,0.03)",
                                            color: config[opt.key] ? palette.accent : palette.textTertiary,
                                            border: `1px solid ${config[opt.key] ? `${palette.accent}30` : "transparent"}`
                                        }}
                                        whileTap={{ scale: 0.97 }}>
                                        <span
                                            className="w-4 h-4 rounded-md border-2 flex items-center justify-center"
                                            style={{
                                                borderColor: config[opt.key] ? palette.accent : palette.textTertiary
                                            }}>
                                            {config[opt.key] && (
                                                <Check
                                                    sx={{
                                                        fontSize: 10,
                                                        color: palette.accent
                                                    }}
                                                />
                                            )}
                                        </span>
                                        {opt.label}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === "passphrase" && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <label
                                        className="text-xs font-bold"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        Word Count
                                    </label>
                                    <span
                                        className="text-xs font-mono"
                                        style={{ color: palette.textTertiary }}>
                                        {config.wordCount}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={3}
                                    max={12}
                                    value={config.wordCount}
                                    onChange={(e) =>
                                        update({
                                            wordCount: Number(e.target.value)
                                        })
                                    }
                                    className="w-full"
                                    style={{ accentColor: palette.accent }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    Separator
                                </label>
                                <div className="flex gap-2">
                                    {["-", "_", ".", " ", ""].map((sep) => (
                                        <motion.button
                                            key={sep}
                                            onClick={() => update({ separator: sep })}
                                            className="px-3 py-1.5 rounded-full text-xs font-mono font-bold"
                                            style={{
                                                background:
                                                    config.separator === sep
                                                        ? palette.accent
                                                        : isDark
                                                          ? "rgba(255,255,255,0.07)"
                                                          : "rgba(0,0,0,0.04)",
                                                color: config.separator === sep ? "#fff" : palette.textSecondary
                                            }}
                                            whileTap={{ scale: 0.95 }}>
                                            {sep === "" ? "none" : sep === " " ? "space" : `"${sep}"`}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "pin" && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <label
                                    className="text-xs font-bold"
                                    style={{ color: palette.textSecondary }}>
                                    PIN Length
                                </label>
                                <span
                                    className="text-xs font-mono"
                                    style={{ color: palette.textTertiary }}>
                                    {config.pinLength}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={4}
                                max={12}
                                value={config.pinLength}
                                onChange={(e) =>
                                    update({
                                        pinLength: Number(e.target.value)
                                    })
                                }
                                className="w-full"
                                style={{ accentColor: palette.accent }}
                            />
                        </div>
                    )}

                    <motion.button
                        onClick={generate}
                        className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: palette.accent, color: "#fff" }}
                        whileTap={{ scale: 0.98 }}>
                        Generate
                    </motion.button>
                </Card>

                {/* History */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <Card>
                                <div className="flex items-center justify-between mb-3">
                                    <h3
                                        className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`}
                                        style={{ color: palette.textPrimary }}>
                                        History ({history.length})
                                    </h3>
                                    <motion.button
                                        onClick={() => setHistory([])}
                                        className="text-xs font-bold"
                                        style={{ color: "#FF3B30" }}
                                        whileTap={{ scale: 0.95 }}>
                                        Clear
                                    </motion.button>
                                </div>
                                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                    {history.map((h, i) => (
                                        <motion.button
                                            key={h.ts}
                                            onClick={() => {
                                                setPassword(h.value);
                                                navigator.clipboard.writeText(h.value);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left"
                                            style={{
                                                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"
                                            }}
                                            whileTap={{ scale: 0.98 }}>
                                            <span
                                                className="flex-1 text-xs font-mono truncate"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {h.value}
                                            </span>
                                            <OneUIBadge variant={h.strength >= 4 ? "success" : h.strength >= 2 ? "warning" : "error"}>
                                                {STRENGTH_LABELS[h.strength]}
                                            </OneUIBadge>
                                        </motion.button>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ToolPageWrapper>
    );
}
