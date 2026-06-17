/**
 * New Transaction Page
 * Form with type selector, asset picker, amount, note, category, date, visibility.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import { ArrowBack, ArrowDownward, ArrowUpward, SwapHoriz, Save, CheckCircle, PersonOutline } from "@mui/icons-material";
import Link from "next/link";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";

interface Asset {
    AssetID: string;
    Name: string;
    Balance: number;
    Type: string;
}

interface Contact {
    ContactID: string;
    Name: string;
    Relation?: string;
    Avatar?: string;
}

const CATEGORIES = [
    "FOOD",
    "TRANSPORT",
    "SHOPPING",
    "ENTERTAINMENT",
    "BILLS",
    "HEALTH",
    "EDUCATION",
    "RENT",
    "SALARY",
    "FREELANCE",
    "INVESTMENT",
    "GIFT",
    "RECHARGE",
    "SUBSCRIPTION",
    "TRAVEL",
    "GROCERIES",
    "DONATION",
    "LOAN",
    "REFUND",
    "OTHER"
];

const CATEGORY_EMOJI: Record<string, string> = {
    FOOD: "🍽️",
    TRANSPORT: "🚗",
    SHOPPING: "🛍️",
    ENTERTAINMENT: "🎬",
    BILLS: "📄",
    HEALTH: "🏥",
    EDUCATION: "📚",
    RENT: "🏠",
    SALARY: "💰",
    FREELANCE: "💻",
    INVESTMENT: "📈",
    GIFT: "🎁",
    RECHARGE: "📱",
    SUBSCRIPTION: "📺",
    TRAVEL: "✈️",
    GROCERIES: "🛒",
    DONATION: "❤️",
    LOAN: "🏦",
    REFUND: "↩️",
    OTHER: "📌"
};

export default function NewTransactionPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const router = useRouter();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [assets, setAssets] = useState<Asset[]>([]);
    const [type, setType] = useState<"CREDIT" | "DEBIT" | "TRANSFER">("DEBIT");
    const [note, setNote] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("OTHER");
    const [fromAssetId, setFromAssetId] = useState("");
    const [toAssetId, setToAssetId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [isHidden, setIsHidden] = useState(false);
    const [isWalletTransfer, setIsWalletTransfer] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactId, setContactId] = useState("");

    const surfaceBg = isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

    const fetchAssets = useCallback(async () => {
        const res = await fetch("/api/wallet/assets").then((r) => r.json());
        if (res.success) {
            setAssets(res.data.assets ?? []);
            if (res.data.assets?.length) {
                setFromAssetId(res.data.assets[0].AssetID);
                setToAssetId(res.data.assets[0].AssetID);
            }
        }
    }, []);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    const fetchContacts = useCallback(async () => {
        const res = await fetch("/api/wallet/contacts").then((r) => r.json());
        if (res.success) setContacts(res.data ?? []);
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const handleSubmit = async () => {
        if (!note.trim() || !amount || parseFloat(amount) <= 0) return;
        setSaving(true);
        try {
            const body: Record<string, any> = {
                Note: note.trim(),
                Amount: parseFloat(amount),
                Type: type,
                Category: category,
                Date: date,
                IsHidden: isHidden,
                IsWalletTransfer: isWalletTransfer,
                ContactID: contactId || undefined
            };
            if (type === "DEBIT" || type === "TRANSFER") body.FromAssetID = fromAssetId;
            if (type === "CREDIT" || type === "TRANSFER") body.ToAssetID = toAssetId;

            const res = await fetch("/api/wallet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }).then((r) => r.json());

            if (res.success) {
                setSaved(true);
                setTimeout(() => router.push("/wallet"), 800);
            }
        } finally {
            setSaving(false);
        }
    };

    const typeButtons = [
        {
            key: "DEBIT" as const,
            label: "Expense",
            icon: <ArrowUpward fontSize="small" />,
            color: "#ef4444"
        },
        {
            key: "CREDIT" as const,
            label: "Income",
            icon: <ArrowDownward fontSize="small" />,
            color: "#22c55e"
        },
        {
            key: "TRANSFER" as const,
            label: "Transfer",
            icon: <SwapHoriz fontSize="small" />,
            color: "#3b82f6"
        }
    ];

    const assetOptions = assets.map((a) => ({
        value: a.AssetID,
        label: `${a.Name} (₹${a.Balance.toLocaleString("en-IN")})`
    }));

    const contactOptions = [
        { value: "", label: "No contact linked" },
        ...contacts.map((c) => ({
            value: c.ContactID,
            label: c.Relation ? `${c.Name} (${c.Relation})` : c.Name
        }))
    ];

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/wallet">
                    <motion.button
                        className="p-2 rounded-xl"
                        style={{
                            background: surfaceBg,
                            border: `1px solid ${borderColor}`
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}>
                        <ArrowBack
                            fontSize="small"
                            style={{ color: palette.textSecondary }}
                        />
                    </motion.button>
                </Link>
                <div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: palette.textPrimary }}>
                        New Transaction
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        Record income, expense, or transfer
                    </p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}>
                <div
                    className={
                        isApple
                            ? "rounded-[20px] p-6 shadow-sm border relative overflow-hidden"
                            : "rounded-[32px] p-7 shadow-sm border relative overflow-hidden"
                    }
                    style={{
                        background: isApple
                            ? isDark
                                ? `linear-gradient(180deg, rgba(44, 44, 46, 0.7) 0%, rgba(28, 28, 30, 0.7) 100%)`
                                : `linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 250, 0.7) 100%)`
                            : isDark
                              ? "linear-gradient(135deg, rgba(30, 30, 35, 0.9) 0%, rgba(25, 25, 30, 0.85) 100%)"
                              : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 248, 250, 0.85) 100%)",
                        backdropFilter: isApple ? "blur(40px) saturate(180%)" : undefined,
                        WebkitBackdropFilter: isApple ? "blur(40px) saturate(180%)" : undefined,
                        borderColor: isApple
                            ? isDark
                                ? "rgba(255, 255, 255, 0.18)"
                                : "rgba(255, 255, 255, 0.8)"
                            : isDark
                              ? "rgba(255, 255, 255, 0.08)"
                              : "rgba(0, 0, 0, 0.06)"
                    }}>
                    <div className="space-y-6 relative z-10">
                        {/* Type selector */}
                        <div>
                            <label
                                className="text-xs font-bold uppercase tracking-widest mb-2 block"
                                style={{ color: palette.textSecondary }}>
                                Transaction Type
                            </label>
                            <div className="flex gap-2">
                                {typeButtons.map((btn) => (
                                    <motion.button
                                        key={btn.key}
                                        onClick={() => setType(btn.key)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors"
                                        style={{
                                            background: type === btn.key ? `${btn.color}15` : inputBg,
                                            border: `1.5px solid ${type === btn.key ? btn.color : borderColor}`,
                                            color: type === btn.key ? btn.color : palette.textSecondary
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}>
                                        {btn.icon}
                                        {btn.label}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label
                                className="text-xs font-bold uppercase tracking-widest mb-2 block"
                                style={{ color: palette.textSecondary }}>
                                Amount (₹) *
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                className="w-full rounded-xl px-4 py-3 text-2xl font-bold outline-none font-mono"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${borderColor}`,
                                    color: typeButtons.find((b) => b.key === type)?.color ?? palette.textPrimary
                                }}
                            />
                        </div>

                        {/* Note */}
                        <div>
                            <label
                                className="text-xs font-bold uppercase tracking-widest mb-2 block"
                                style={{ color: palette.textSecondary }}>
                                Note *
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Lunch at Domino's"
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none font-medium"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${borderColor}`,
                                    color: palette.textPrimary
                                }}
                            />
                        </div>

                        {/* Asset selectors */}
                        {(type === "DEBIT" || type === "TRANSFER") && (
                            <div>
                                <label
                                    className="text-xs font-bold uppercase tracking-widest mb-2 block"
                                    style={{ color: palette.textSecondary }}>
                                    From Asset
                                </label>
                                <CustomSelect
                                    value={fromAssetId}
                                    onChange={setFromAssetId}
                                    options={assetOptions}
                                    placeholder="Select asset to debit..."
                                />
                            </div>
                        )}

                        {(type === "CREDIT" || type === "TRANSFER") && (
                            <div>
                                <label
                                    className="text-xs font-bold uppercase tracking-widest mb-2 block"
                                    style={{ color: palette.textSecondary }}>
                                    To Asset
                                </label>
                                <CustomSelect
                                    value={toAssetId}
                                    onChange={setToAssetId}
                                    options={assetOptions}
                                    placeholder="Select asset to credit..."
                                />
                            </div>
                        )}

                        {/* Contact Picker */}
                        <div>
                            <label
                                className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
                                style={{ color: palette.textSecondary }}>
                                <PersonOutline style={{ fontSize: 14 }} />
                                Link Contact
                                <span
                                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md ml-1"
                                    style={{
                                        background: `${palette.accent}12`,
                                        color: palette.accent
                                    }}>
                                    Optional
                                </span>
                            </label>
                            <CustomSelect
                                value={contactId}
                                onChange={setContactId}
                                options={contactOptions}
                                placeholder="Search contacts..."
                            />
                            {contactId && (() => {
                                const selected = contacts.find(c => c.ContactID === contactId);
                                if (!selected) return null;
                                return (
                                    <div
                                        className="flex items-center gap-2.5 mt-2.5 px-3 py-2 rounded-xl"
                                        style={{
                                            background: `${palette.accent}08`,
                                            border: `1px solid ${palette.accent}20`
                                        }}>
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
                                            style={{
                                                background: `${palette.accent}20`,
                                                color: palette.accent
                                            }}>
                                            {selected.Avatar ? (
                                                <img
                                                    src={selected.Avatar}
                                                    alt={selected.Name}
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                selected.Name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: palette.textPrimary }}>
                                            {selected.Name}
                                        </span>
                                        {selected.Relation && (
                                            <span
                                                className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                                                style={{
                                                    background: `${palette.accent}15`,
                                                    color: palette.accent
                                                }}>
                                                {selected.Relation}
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Category */}
                        <div>
                            <label
                                className="text-xs font-bold uppercase tracking-widest mb-2 block"
                                style={{ color: palette.textSecondary }}>
                                Category
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                {CATEGORIES.map((cat) => (
                                    <motion.button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition-colors"
                                        style={{
                                            background: category === cat ? `${palette.accent}15` : inputBg,
                                            border: `1px solid ${category === cat ? palette.accent : borderColor}`,
                                            color: category === cat ? palette.accent : palette.textSecondary,
                                            fontWeight: category === cat ? 700 : 500
                                        }}
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.96 }}>
                                        <span className="text-lg mb-0.5">{CATEGORY_EMOJI[cat] ?? "📌"}</span>
                                        <span
                                            className="truncate w-full text-center"
                                            style={{
                                                fontSize: 9,
                                                letterSpacing: "0.05em"
                                            }}>
                                            {cat.replace(/_/g, " ")}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label
                                className="text-xs font-bold uppercase tracking-widest mb-2 block"
                                style={{ color: palette.textSecondary }}>
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none font-medium"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${borderColor}`,
                                    color: palette.textPrimary
                                }}
                            />
                        </div>

                        {/* Visibility toggles */}
                        <div className="flex gap-5 px-1 py-2">
                            <label
                                className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold tracking-wide"
                                style={{ color: palette.textSecondary }}>
                                <input
                                    type="checkbox"
                                    checked={isHidden}
                                    onChange={(e) => setIsHidden(e.target.checked)}
                                    style={{ accentColor: palette.accent }}
                                    className="w-4 h-4 rounded"
                                />
                                Hide from Dashboard
                            </label>
                            {type === "TRANSFER" && (
                                <label
                                    className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold tracking-wide"
                                    style={{ color: palette.textSecondary }}>
                                    <input
                                        type="checkbox"
                                        checked={isWalletTransfer}
                                        onChange={(e) => setIsWalletTransfer(e.target.checked)}
                                        style={{ accentColor: palette.accent }}
                                        className="w-4 h-4 rounded"
                                    />
                                    Self Transfer
                                </label>
                            )}
                        </div>

                        {/* Submit */}
                        <motion.button
                            onClick={handleSubmit}
                            disabled={saving || !note.trim() || !amount || parseFloat(amount) <= 0}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm tracking-widest mt-4"
                            style={{
                                background: saved ? "#22c55e" : palette.accent,
                                color: palette.textOnAccent || "#fff",
                                opacity: !note.trim() || !amount ? 0.5 : 1
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}>
                            {saved ? <CheckCircle fontSize="small" /> : <Save fontSize="small" />}
                            {saving ? "SAVING..." : saved ? "SAVED ✓" : "SAVE TRANSACTION"}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
