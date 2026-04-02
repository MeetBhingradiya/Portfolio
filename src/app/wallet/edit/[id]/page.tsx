/**
 * Edit Transaction Page
 * Pre-fills form from existing transaction, PUTs to /api/wallet/[id]
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import { ArrowBack, ArrowDownward, ArrowUpward, SwapHoriz, Save, CheckCircle } from "@mui/icons-material";
import Link from "next/link";

interface Asset {
    AssetID: string;
    Name: string;
    Balance: number;
    Type: string;
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

export default function EditTransactionPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const router = useRouter();
    const params = useParams();
    const txnId = params.id as string;

    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState<"CREDIT" | "DEBIT" | "TRANSFER">("DEBIT");
    const [note, setNote] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("OTHER");
    const [fromAssetId, setFromAssetId] = useState("");
    const [toAssetId, setToAssetId] = useState("");
    const [date, setDate] = useState("");
    const [isHidden, setIsHidden] = useState(false);
    const [isWalletTransfer, setIsWalletTransfer] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const surfaceBg = isApple ? (isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)") : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

    const fetchAssets = useCallback(async () => {
        const res = await fetch("/api/wallet/assets").then((r) => r.json());
        if (res.success) setAssets(res.data.assets ?? []);
    }, []);

    const fetchTransaction = useCallback(async () => {
        try {
            const res = await fetch(`/api/wallet/${txnId}`).then((r) => r.json());
            if (res.success && res.data) {
                const t = res.data;
                setType(t.Type);
                setNote(t.Note || "");
                setAmount(String(t.Amount));
                setCategory(t.Category || "OTHER");
                setFromAssetId(t.FromAssetID || "");
                setToAssetId(t.ToAssetID || "");
                setDate(t.Date ? new Date(t.Date).toISOString().slice(0, 10) : "");
                setIsHidden(Boolean(t.IsHidden));
                setIsWalletTransfer(Boolean(t.IsWalletTransfer));
            }
        } finally {
            setLoading(false);
        }
    }, [txnId]);

    useEffect(() => {
        fetchAssets();
        fetchTransaction();
    }, [fetchAssets, fetchTransaction]);

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
                IsWalletTransfer: isWalletTransfer
            };
            if (type === "DEBIT" || type === "TRANSFER") body.FromAssetID = fromAssetId;
            if (type === "CREDIT" || type === "TRANSFER") body.ToAssetID = toAssetId;

            const res = await fetch(`/api/wallet/${txnId}`, {
                method: "PUT",
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

    const assetOptions = assets.map((a) => ({
        value: a.AssetID,
        label: `${a.Name} (₹${a.Balance.toLocaleString("en-IN")})`
    }));

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

    if (loading) {
        return (
            <div
                className="flex items-center justify-center p-12"
                style={{ color: palette.textSecondary }}>
                Loading transaction…
            </div>
        );
    }

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
                        Edit Transaction
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: palette.textSecondary }}>
                        Update transaction details
                    </p>
                </div>
            </div>

            <motion.div
                className="p-6 rounded-2xl space-y-5"
                style={{
                    background: surfaceBg,
                    border: `1px solid ${borderColor}`
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}>
                {/* Type selector */}
                <div>
                    <label
                        className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                        style={{ color: palette.textSecondary }}>
                        Transaction Type
                    </label>
                    <div className="flex gap-2">
                        {typeButtons.map((btn) => (
                            <motion.button
                                key={btn.key}
                                onClick={() => setType(btn.key)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                                style={{
                                    background: type === btn.key ? `${btn.color}18` : inputBg,
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
                        className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                        style={{ color: palette.textSecondary }}>
                        Amount (₹) *
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full rounded-xl px-4 py-3 text-2xl font-bold outline-none"
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
                        className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                        style={{ color: palette.textSecondary }}>
                        Note *
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Lunch at Domino's"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{
                            background: inputBg,
                            border: `1px solid ${borderColor}`,
                            color: palette.textPrimary
                        }}
                    />
                </div>

                {/* Asset selectors using CustomSelect */}
                {(type === "DEBIT" || type === "TRANSFER") && (
                    <div>
                        <label
                            className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                            style={{ color: palette.textSecondary }}>
                            From Asset
                        </label>
                        <CustomSelect
                            value={fromAssetId}
                            onChange={setFromAssetId}
                            options={assetOptions}
                            placeholder="Select asset…"
                        />
                    </div>
                )}

                {(type === "CREDIT" || type === "TRANSFER") && (
                    <div>
                        <label
                            className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                            style={{ color: palette.textSecondary }}>
                            To Asset
                        </label>
                        <CustomSelect
                            value={toAssetId}
                            onChange={setToAssetId}
                            options={assetOptions}
                            placeholder="Select asset…"
                        />
                    </div>
                )}

                {/* Category */}
                <div>
                    <label
                        className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                        style={{ color: palette.textSecondary }}>
                        Category
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {CATEGORIES.map((cat) => (
                            <motion.button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs"
                                style={{
                                    background: category === cat ? `${palette.accent}22` : inputBg,
                                    border: `1px solid ${category === cat ? palette.accent : borderColor}`,
                                    color: category === cat ? palette.accent : palette.textSecondary,
                                    fontWeight: category === cat ? 600 : 400
                                }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}>
                                <span className="text-base">{CATEGORY_EMOJI[cat] ?? "📌"}</span>
                                <span
                                    className="truncate w-full text-center"
                                    style={{ fontSize: 10 }}>
                                    {cat.replace(/_/g, " ")}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label
                        className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                        style={{ color: palette.textSecondary }}>
                        Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                        style={{
                            background: inputBg,
                            border: `1px solid ${borderColor}`,
                            color: palette.textPrimary
                        }}
                    />
                </div>

                {/* Visibility toggles */}
                <div className="flex gap-4">
                    <label
                        className="flex items-center gap-2 cursor-pointer text-sm"
                        style={{ color: palette.textSecondary }}>
                        <input
                            type="checkbox"
                            checked={isHidden}
                            onChange={(e) => setIsHidden(e.target.checked)}
                            style={{ accentColor: palette.accent }}
                            className="w-4 h-4"
                        />
                        Hidden
                    </label>
                    {type === "TRANSFER" && (
                        <label
                            className="flex items-center gap-2 cursor-pointer text-sm"
                            style={{ color: palette.textSecondary }}>
                            <input
                                type="checkbox"
                                checked={isWalletTransfer}
                                onChange={(e) => setIsWalletTransfer(e.target.checked)}
                                style={{ accentColor: palette.accent }}
                                className="w-4 h-4"
                            />
                            Wallet Transfer
                        </label>
                    )}
                </div>

                {/* Submit */}
                <motion.button
                    onClick={handleSubmit}
                    disabled={saving || !note.trim() || !amount || parseFloat(amount) <= 0}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                    style={{
                        background: saved ? "#22c55e" : palette.accent,
                        color: palette.textOnAccent || "#fff",
                        opacity: !note.trim() || !amount ? 0.5 : 1
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    {saved ? <CheckCircle fontSize="small" /> : <Save fontSize="small" />}
                    {saving ? "Saving…" : saved ? "Saved ✓" : "Update Transaction"}
                </motion.button>
            </motion.div>
        </div>
    );
}
