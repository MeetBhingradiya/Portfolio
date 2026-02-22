/**
 * Encrypt / Decrypt — /tools/encrypt
 * AES, DES, TripleDES, Rabbit, RC4 via crypto-js.
 * Batch mode, key strength meter, history.
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard, OneUIBadge } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import {
    Lock,
    LockOpen,
    ContentCopy,
    Check,
    SwapVert,
    History,
    Delete,
    Key
} from "@mui/icons-material";

type Algorithm = "AES" | "DES" | "TripleDES" | "Rabbit" | "RC4";
type Direction = "encrypt" | "decrypt";

interface HistoryEntry {
    direction: Direction;
    algorithm: Algorithm;
    input: string;
    output: string;
    ts: number;
}

const ALGORITHMS: { alg: Algorithm; full: string; keySize: string }[] = [
    { alg: "AES", full: "Advanced Encryption Standard", keySize: "128/192/256-bit" },
    { alg: "DES", full: "Data Encryption Standard", keySize: "56-bit" },
    { alg: "TripleDES", full: "Triple DES (3DES)", keySize: "168-bit" },
    { alg: "Rabbit", full: "Rabbit Stream Cipher", keySize: "128-bit" },
    { alg: "RC4", full: "Rivest Cipher 4", keySize: "Variable" }
];

export default function EncryptPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [direction, setDirection] = useState<Direction>("encrypt");
    const [algorithm, setAlgorithm] = useState<Algorithm>("AES");
    const [input, setInput] = useState("");
    const [secret, setSecret] = useState("");
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.encrypt) return;
        defaultsApplied.current = true;
        const d = toolDefaults.encrypt;
        if (d.algorithm) setAlgorithm(d.algorithm as Algorithm);
        if (d.direction) setDirection(d.direction as Direction);
    }, [toolDefaults]);

    // Key strength
    const keyStrength = useMemo(() => {
        if (!secret) return 0;
        let s = 0;
        if (secret.length >= 8) s++;
        if (secret.length >= 16) s++;
        if (/[A-Z]/.test(secret) && /[a-z]/.test(secret)) s++;
        if (/\d/.test(secret)) s++;
        if (/[^A-Za-z0-9]/.test(secret)) s++;
        return Math.min(s, 5);
    }, [secret]);

    const STRENGTH_LABELS = ["None", "Weak", "Fair", "Good", "Strong", "Excellent"];
    const STRENGTH_COLORS = ["#666", "#FF3B30", "#FF9500", "#FFD60A", "#34C759", "#00C7BE"];

    const process = useCallback(async () => {
        if (!input || !secret) {
            setError("Input and secret key are required");
            return;
        }
        setProcessing(true);
        setError(null);

        try {
            const CryptoJS = (await import("crypto-js")).default;

            let result = "";
            if (direction === "encrypt") {
                switch (algorithm) {
                    case "AES": result = CryptoJS.AES.encrypt(input, secret).toString(); break;
                    case "DES": result = CryptoJS.DES.encrypt(input, secret).toString(); break;
                    case "TripleDES": result = CryptoJS.TripleDES.encrypt(input, secret).toString(); break;
                    case "Rabbit": result = CryptoJS.Rabbit.encrypt(input, secret).toString(); break;
                    case "RC4": result = CryptoJS.RC4.encrypt(input, secret).toString(); break;
                }
            } else {
                let bytes;
                switch (algorithm) {
                    case "AES": bytes = CryptoJS.AES.decrypt(input, secret); break;
                    case "DES": bytes = CryptoJS.DES.decrypt(input, secret); break;
                    case "TripleDES": bytes = CryptoJS.TripleDES.decrypt(input, secret); break;
                    case "Rabbit": bytes = CryptoJS.Rabbit.decrypt(input, secret); break;
                    case "RC4": bytes = CryptoJS.RC4.decrypt(input, secret); break;
                }
                result = bytes!.toString(CryptoJS.enc.Utf8);
                if (!result) throw new Error("Decryption failed — wrong key or algorithm");
            }

            setOutput(result);
            setHistory((h) => [{ direction, algorithm, input: input.slice(0, 60), output: result.slice(0, 60), ts: Date.now() }, ...h].slice(0, 50));
        } catch (e: any) {
            setError(e.message || "Operation failed");
            setOutput("");
        }
        setProcessing(false);
    }, [direction, algorithm, input, secret]);

    const swap = () => {
        setInput(output);
        setOutput("");
        setDirection((d) => (d === "encrypt" ? "decrypt" : "encrypt"));
    };

    const copy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    const inputStyle: React.CSSProperties = {
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
        color: palette.textPrimary,
        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`
    };

    return (
        <ToolPageWrapper
            title="Encrypt / Decrypt"
            description="Symmetric encryption with AES, DES, 3DES, Rabbit, RC4"
            icon={<Lock sx={{ fontSize: 24 }} />}
            accentColor="#5856D6"
            actions={
                <motion.button
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 rounded-xl relative"
                    style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)" }}
                    whileTap={{ scale: 0.9 }}
                >
                    <History sx={{ fontSize: 16, color: palette.textTertiary }} />
                    {history.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: palette.accent, color: "#fff" }}>
                            {history.length}
                        </span>
                    )}
                </motion.button>
            }
        >
            <div className="space-y-6">
                {/* Direction toggle */}
                <div className="flex gap-1.5">
                    {(["encrypt", "decrypt"] as Direction[]).map((d) => (
                        <motion.button
                            key={d}
                            onClick={() => { setDirection(d); setOutput(""); setError(null); }}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold capitalize"
                            style={{
                                background: direction === d ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                color: direction === d ? "#fff" : palette.textSecondary
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {d === "encrypt" ? <Lock sx={{ fontSize: 14 }} /> : <LockOpen sx={{ fontSize: 14 }} />}
                            {d}
                        </motion.button>
                    ))}
                </div>

                {/* Algorithm selector */}
                <Card>
                    <h3 className={`mb-3 ${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>Algorithm</h3>
                    <div className="flex flex-wrap gap-2">
                        {ALGORITHMS.map((a) => (
                            <motion.button
                                key={a.alg}
                                onClick={() => setAlgorithm(a.alg)}
                                className="px-4 py-2 rounded-full text-xs font-bold"
                                style={{
                                    background: algorithm === a.alg ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                    color: algorithm === a.alg ? "#fff" : palette.textSecondary
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {a.alg}
                            </motion.button>
                        ))}
                    </div>
                    <p className="mt-2 text-[10px]" style={{ color: palette.textTertiary }}>
                        {ALGORITHMS.find((a) => a.alg === algorithm)?.full} — Key: {ALGORITHMS.find((a) => a.alg === algorithm)?.keySize}
                    </p>
                </Card>

                {/* Secret key */}
                <Card>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Key sx={{ fontSize: 16, color: palette.textTertiary }} />
                            <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>Secret Key</label>
                        </div>
                        <input
                            type="password"
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            placeholder="Enter encryption key…"
                            className="w-full px-4 py-2.5 rounded-xl text-sm font-mono outline-none"
                            style={inputStyle}
                        />
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-[10px] font-bold" style={{ color: palette.textTertiary }}>Key Strength</span>
                                <span className="text-[10px] font-bold" style={{ color: STRENGTH_COLORS[keyStrength] }}>{STRENGTH_LABELS[keyStrength]}</span>
                            </div>
                            <div className="flex gap-0.5 h-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <div key={i} className="flex-1 rounded-full" style={{ background: i <= keyStrength ? STRENGTH_COLORS[keyStrength] : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Input / Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                    <Card>
                        <div className="space-y-2">
                            <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>
                                {direction === "encrypt" ? "Plaintext" : "Ciphertext"}
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none resize-none"
                                style={inputStyle}
                                placeholder={direction === "encrypt" ? "Enter text to encrypt…" : "Paste encrypted text…"}
                            />
                        </div>
                    </Card>

                    {/* Swap button */}
                    <motion.button
                        onClick={swap}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg lg:block hidden"
                        style={{ background: palette.accent }}
                        whileTap={{ scale: 0.85 }}
                    >
                        <SwapVert sx={{ fontSize: 18, color: "#fff" }} />
                    </motion.button>

                    <Card>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold" style={{ color: palette.textSecondary }}>
                                    {direction === "encrypt" ? "Ciphertext" : "Plaintext"}
                                </label>
                                {output && (
                                    <motion.button onClick={() => copy(output)} whileTap={{ scale: 0.9 }}>
                                        {copied ? <Check sx={{ fontSize: 14, color: "#34C759" }} /> : <ContentCopy sx={{ fontSize: 14, color: palette.textTertiary }} />}
                                    </motion.button>
                                )}
                            </div>
                            <div
                                className="w-full px-4 py-3 rounded-xl text-sm font-mono break-all min-h-[160px]"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                                    color: error ? "#FF3B30" : palette.textPrimary,
                                    border: `1.5px solid ${error ? "#FF3B3040" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`
                                }}
                            >
                                {error || output || "Output will appear here"}
                            </div>
                        </div>
                    </Card>
                </div>

                <motion.button
                    onClick={process}
                    disabled={processing || !input || !secret}
                    className="w-full py-3 rounded-xl text-sm font-bold"
                    style={{ background: palette.accent, color: "#fff", opacity: processing || !input || !secret ? 0.5 : 1 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {processing ? "Processing…" : direction === "encrypt" ? "Encrypt" : "Decrypt"}
                </motion.button>

                {/* History */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <Card>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className={`${isApple ? "text-sm font-semibold" : "text-base font-black"}`} style={{ color: palette.textPrimary }}>
                                        History ({history.length})
                                    </h3>
                                    <motion.button onClick={() => setHistory([])} className="text-xs font-bold" style={{ color: "#FF3B30" }} whileTap={{ scale: 0.95 }}>
                                        Clear
                                    </motion.button>
                                </div>
                                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                    {history.map((h) => (
                                        <div
                                            key={h.ts}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl"
                                            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }}
                                        >
                                            {h.direction === "encrypt" ? <Lock sx={{ fontSize: 12, color: "#34C759" }} /> : <LockOpen sx={{ fontSize: 12, color: "#5856D6" }} />}
                                            <OneUIBadge variant="neutral">{h.algorithm}</OneUIBadge>
                                            <span className="flex-1 text-xs font-mono truncate" style={{ color: palette.textSecondary }}>{h.output}</span>
                                        </div>
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
