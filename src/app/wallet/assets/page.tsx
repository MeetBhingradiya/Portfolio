/**
 * Asset Management Page
 * Grid of asset cards + add new asset modal.
 * Uses LiquidGlass (Apple) and OneUI (Samsung) components.
 * Supports CDN icon uploading and UPI->Bank linking.
 */

"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme, useCDNUpload } from "@Hooks";
import {
    LiquidGlassCard,
    LiquidGlassButton,
    LiquidGlassModal,
} from "@Components/Atoms/LiquidGlass";
import {
    OneUICard,
    OneUIButton,
    OneUIBadge,
} from "@Components/Atoms/OneUI";
import { CustomSelect } from "@Components/Atoms/CustomSelect";
import {
    Add,
    Close,
    AccountBalance,
    PhoneAndroid,
    CurrencyRupee,
    Wallet,
    Delete,
    Edit,
    Save,
    CloudUpload,
} from "@mui/icons-material";

interface Asset {
    AssetID: string;
    Name: string;
    Icon?: string;
    Balance: number;
    InitialBalance: number;
    Type: string;
    Color: string;
    Currency: string;
    Notes?: string;
    LinkedAssetID?: string;
    LinkedBankName?: string;
    UPIIds?: string[];
    createdAt: string;
}

const ASSET_TYPES = [
    { value: "BANK",           label: "Bank Account",   icon: <AccountBalance fontSize="small" /> },
    { value: "DIGITAL_WALLET", label: "Digital Wallet",  icon: <Wallet fontSize="small" /> },
    { value: "UPI_APP",        label: "UPI App",         icon: <PhoneAndroid fontSize="small" /> },
    { value: "CASH",           label: "Cash",            icon: <CurrencyRupee fontSize="small" /> },
];

const ASSET_COLORS = [
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
    "#22c55e", "#f59e0b", "#ef4444", "#14b8a6",
];

export default function AssetsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const { upload, uploading } = useCDNUpload();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [assets, setAssets] = useState<Asset[]>([]);
    const [totalBalance, setTotalBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editAsset, setEditAsset] = useState<Asset | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState("CASH");
    const [initialBalance, setInitialBalance] = useState("");
    const [color, setColor] = useState("");
    const [notes, setNotes] = useState("");
    const [iconUrl, setIconUrl] = useState("");
    const [linkedAssetId, setLinkedAssetId] = useState("");
    const [upiIds, setUpiIds] = useState("");
    const [saving, setSaving] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const surfaceBg = isApple
        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

    const bankAssets = assets.filter(a => a.Type === "BANK");

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/wallet/assets").then(r => r.json());
        if (res.success) {
            setAssets(res.data.assets ?? []);
            setTotalBalance(res.data.totalBalance ?? 0);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAssets(); }, [fetchAssets]);

    const openModal = (asset?: Asset) => {
        if (asset) {
            setEditAsset(asset);
            setName(asset.Name);
            setType(asset.Type);
            setInitialBalance(String(asset.InitialBalance));
            setColor(asset.Color || "");
            setNotes(asset.Notes || "");
            setIconUrl(asset.Icon || "");
            setLinkedAssetId(asset.LinkedAssetID || "");
            setUpiIds((asset.UPIIds || []).join(", "));
        } else {
            setEditAsset(null);
            setName(""); setType("CASH"); setInitialBalance(""); setColor(""); setNotes(""); setIconUrl(""); setLinkedAssetId(""); setUpiIds("");
        }
        setShowModal(true);
    };

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await upload(file, { type: "icon", tags: ["wallet", "asset"] });
            setIconUrl(res.cdnUrl);
        } catch (err) {
            alert("Failed to upload icon. " + (err as Error).message);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        if (type === "UPI_APP" && !linkedAssetId) {
            alert("Please select a linked bank account for the UPI App.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                Name: name.trim(),
                Type: type,
                InitialBalance: type === "UPI_APP" ? 0 : (parseFloat(initialBalance) || 0),
                Color: color || palette.accent,
                Notes: notes,
                Icon: iconUrl || undefined,
                LinkedAssetID: type === "UPI_APP" ? linkedAssetId : undefined,
                UPIIds: type === "UPI_APP" ? upiIds : undefined,
            };

            if (editAsset) {
                await fetch(`/api/wallet/assets?id=${editAsset.AssetID}`, {
                    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
                });
            } else {
                await fetch("/api/wallet/assets", {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
                });
            }
            setShowModal(false);
            fetchAssets();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this asset? Assets with transactions will be archived instead.")) return;
        setDeletingId(id);
        const res = await fetch(`/api/wallet/assets?id=${id}`, { method: "DELETE" }).then(r => r.json());
        if (res.success && res.data?.archived) {
            alert(`Asset archived. It has ${res.data.transactionCount} linked transactions and cannot be hard deleted.`);
        }
        setDeletingId(null);
        fetchAssets();
    };

    const typeIcon = (t: string) => ASSET_TYPES.find(at => at.value === t)?.icon ?? <CurrencyRupee fontSize="small" />;
    const typeLabel = (t: string) => ASSET_TYPES.find(at => at.value === t)?.label ?? t;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>Assets</h1>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                        Manage your bank accounts, wallets, and cash
                    </p>
                </div>
                {isApple ? (
                    <LiquidGlassButton className="flex items-center gap-2 px-5 py-2.5" onClick={() => openModal()}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Add fontSize="small" />
                            <span className="font-semibold text-sm tracking-wide">Add Asset</span>
                        </span>
                    </LiquidGlassButton>
                ) : (
                    <OneUIButton variant="primary" className="flex items-center gap-2 px-5 py-2.5" onClick={() => openModal()}>
                        <Add fontSize="small" />
                        <span className="font-semibold text-sm">Add Asset</span>
                    </OneUIButton>
                )}
            </div>

            {/* Total Balance Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            >
                {isApple ? (
                    <LiquidGlassCard intensity="strong" className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: palette.accent }}>Total Net Worth</p>
                            <p className="text-4xl font-bold mt-1" style={{ color: totalBalance >= 0 ? palette.textPrimary : "#ef4444" }}>
                                ₹{Math.abs(totalBalance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <p className="text-sm font-medium px-4 py-2 rounded-xl" style={{ background: `${palette.accent}15`, color: palette.accent }}>
                            {assets.length} {assets.length === 1 ? "asset" : "assets"}
                        </p>
                    </LiquidGlassCard>
                ) : (
                    <div style={{ borderLeft: `4px solid ${palette.accent}`, borderRadius: "32px", overflow: "hidden" }}>
                        <OneUICard className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: palette.accent }}>Total Net Worth</p>
                                <p className="text-4xl font-extrabold mt-1" style={{ color: totalBalance >= 0 ? palette.textPrimary : "#ef4444" }}>
                                    ₹{Math.abs(totalBalance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <OneUIBadge variant="accent">
                                {assets.length} {assets.length === 1 ? "asset" : "assets"}
                            </OneUIBadge>
                        </OneUICard>
                    </div>
                )}
            </motion.div>

            {/* Asset Grid */}
            <AnimatePresence mode="popLayout">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                className="flex justify-center p-12 text-sm font-medium" style={{ color: palette.textTertiary }}>
                        Loading assets...
                    </motion.div>
                ) : assets.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="p-5 rounded-full" style={{ background: `${palette.accent}15`, color: palette.accent }}>
                            <AccountBalance style={{ fontSize: 40 }} />
                        </div>
                        <h3 className="text-lg font-bold" style={{ color: palette.textPrimary }}>No assets yet</h3>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>Add your first bank account or wallet.</p>
                    </motion.div>
                ) : (
                    <motion.div key="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {assets.map((asset, i) => {
                            const assetColor = asset.Color || palette.accent;
                            const isUpi = asset.Type === "UPI_APP";
                            
                            const innerContent = (
                                <div className="flex flex-col h-full gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {asset.Icon ? (
                                                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border flex-shrink-0" style={{ borderColor: `${assetColor}30` }}>
                                                    <img src={asset.Icon} alt={asset.Name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${assetColor}18`, color: assetColor }}>
                                                    {typeIcon(asset.Type)}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-base line-clamp-1" style={{ color: palette.textPrimary }}>{asset.Name}</h3>
                                                {isUpi && asset.LinkedBankName ? (
                                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 w-max mt-1"
                                                        style={{ background: `${assetColor}15`, color: assetColor }}>
                                                        <AccountBalance style={{ fontSize: 10 }} /> {asset.LinkedBankName}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-1 block w-max"
                                                        style={{ background: `${assetColor}15`, color: assetColor }}>
                                                        {typeLabel(asset.Type)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Actions overlay */}
                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal(asset)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" style={{ color: palette.textSecondary }}>
                                                <Edit fontSize="small" />
                                            </button>
                                            <button onClick={() => handleDelete(asset.AssetID)} disabled={deletingId === asset.AssetID} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" style={{ color: "#ef4444", opacity: deletingId === asset.AssetID ? 0.5 : 1 }}>
                                                <Delete fontSize="small" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto pt-2 border-t" style={{ borderColor: `${assetColor}20` }}>
                                        {isUpi ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold uppercase" style={{ color: palette.textSecondary }}>Virtual Link</span>
                                                <span className="text-sm font-bold" style={{ color: assetColor }}>Mirrors Bank</span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-3xl font-bold tracking-tight" style={{ color: asset.Balance >= 0 ? assetColor : "#ef4444" }}>
                                                    ₹{Math.abs(asset.Balance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs font-medium" style={{ color: palette.textTertiary }}>
                                                        Initial: ₹{asset.InitialBalance.toLocaleString("en-IN")}
                                                    </span>
                                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
                                                        background: asset.Balance >= asset.InitialBalance ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                                        color: asset.Balance >= asset.InitialBalance ? "#22c55e" : "#ef4444",
                                                    }}>
                                                        {asset.Balance >= asset.InitialBalance ? "+" : "−"}
                                                        ₹{Math.abs(asset.Balance - asset.InitialBalance).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                            
                            return (
                                <motion.div key={asset.AssetID} 
                                            initial={{ opacity: 0, y: 10 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            transition={{ duration: 0.4, delay: Math.min(i * 0.1, 0.6) }}
                                            layout>
                                    {isApple ? (
                                        <div style={{ borderTop: `2px solid ${assetColor}60`, borderRadius: "20px" }}>
                                            <LiquidGlassCard intensity="subtle" className="p-5 h-full group transition-all hover:-translate-y-1 hover:shadow-xl">
                                                {innerContent}
                                            </LiquidGlassCard>
                                        </div>
                                    ) : (
                                        <div style={{ borderTop: `3px solid ${assetColor}`, borderRadius: "32px", overflow: "hidden" }}>
                                            <OneUICard className="p-5 h-full group hover:-translate-y-1 transition-transform">
                                                {innerContent}
                                            </OneUICard>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <LiquidGlassModal isOpen={showModal} onClose={() => setShowModal(false)} title={editAsset ? "Edit Asset" : "Add New Asset"}>
                        <div className="space-y-5">
                            {/* Type */}
                            <div>
                                <label className="text-xs font-semibold block mb-2 uppercase tracking-wide" style={{ color: palette.textSecondary }}>Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ASSET_TYPES.map(at => (
                                        <button key={at.value} onClick={() => setType(at.value)}
                                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                                            style={{
                                                background: type === at.value ? `${color || palette.accent}15` : inputBg,
                                                border: `1.5px solid ${type === at.value ? (color || palette.accent) : "transparent"}`,
                                                color: type === at.value ? (color || palette.accent) : palette.textSecondary,
                                            }}>
                                            {at.icon} {at.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Icon Upload & Name */}
                            <div className="flex gap-4">
                                <div>
                                    <label className="text-xs font-semibold block mb-2 uppercase tracking-wide" style={{ color: palette.textSecondary }}>Icon</label>
                                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden transition-all hover:scale-105"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textTertiary }}>
                                        {uploading ? (
                                            <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: palette.accent, borderTopColor: "transparent" }} />
                                        ) : iconUrl ? (
                                            <img src={iconUrl} alt="Icon" className="w-full h-full object-cover" />
                                        ) : (
                                            <CloudUpload fontSize="small" />
                                        )}
                                    </button>
                                    <input type="file" hidden ref={fileInputRef} onChange={handleIconUpload} accept="image/*" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold block mb-2 uppercase tracking-wide" style={{ color: palette.textSecondary }}>Asset Name *</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HDFC Bank, GPay..."
                                        className="w-full rounded-xl px-4 py-3 text-sm outline-none font-medium"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                </div>
                            </div>

                            {/* UPI Specific Fields */}
                            {type === "UPI_APP" && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-5 p-4 rounded-xl" style={{ background: `${palette.accent}10`, border: `1px dashed ${palette.accent}40` }}>
                                    <div>
                                        <label className="text-xs font-bold block mb-2 uppercase tracking-wide flex items-center gap-1" style={{ color: palette.accent }}>
                                            <AccountBalance fontSize="small" /> Linked Bank Account *
                                        </label>
                                        <CustomSelect 
                                            value={linkedAssetId} 
                                            onChange={setLinkedAssetId} 
                                            options={bankAssets.map(b => ({ value: b.AssetID, label: `${b.Name} (₹${b.Balance.toLocaleString()})` }))}
                                            placeholder="Select bank to debit/credit..."
                                        />
                                        <p className="text-[10px] mt-1.5 opacity-70" style={{ color: palette.textSecondary }}>UPI apps use the linked bank's balance automatically.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold block mb-2 uppercase tracking-wide" style={{ color: palette.accent }}>UPI IDs (comma separated)</label>
                                        <input type="text" value={upiIds} onChange={e => setUpiIds(e.target.value)} placeholder="e.g. 9876543210@ybl, name@oksbi"
                                            className="w-full rounded-xl px-4 py-3 text-sm outline-none bg-transparent"
                                            style={{ border: `1px solid ${palette.accent}40`, color: palette.textPrimary }} />
                                    </div>
                                </motion.div>
                            )}

                            {/* Initial Balance */}
                            {(!editAsset && type !== "UPI_APP") && (
                                <div>
                                    <label className="text-xs font-semibold block mb-2 uppercase tracking-wide" style={{ color: palette.textSecondary }}>Initial Balance (₹)</label>
                                    <input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="0.00" step="0.01"
                                        className="w-full rounded-xl px-4 py-3 text-lg font-bold outline-none"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                </div>
                            )}

                            <div className="flex gap-4">
                                {/* Color */}
                                <div className="flex-[2]">
                                    <label className="text-xs font-semibold block mb-2 uppercase tracking-wide" style={{ color: palette.textSecondary }}>Accent Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[palette.accent, ...ASSET_COLORS].filter((v,i,a)=>a.indexOf(v)===i).slice(0, 7).map(c => (
                                            <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-full transition-all"
                                                style={{ background: c, border: `2px solid ${palette.background}`, boxShadow: (color || palette.accent) === c ? `0 0 0 2px ${c}` : "none", opacity: (color || palette.accent) === c ? 1 : 0.5 }} />
                                        ))}
                                    </div>
                                </div>
                                {/* Notes */}
                                <div className="flex-[3]">
                                    <label className="text-xs font-semibold block mb-2 uppercase tracking-wide" style={{ color: palette.textSecondary }}>Notes</label>
                                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional description..."
                                        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary }} />
                                </div>
                            </div>

                            <button onClick={handleSave} disabled={saving || !name.trim() || (type === "UPI_APP" && !linkedAssetId)}
                                className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95"
                                style={{ background: color || palette.accent, color: palette.textOnAccent || "#fff", opacity: (!name.trim() || (type === "UPI_APP" && !linkedAssetId)) ? 0.5 : 1 }}>
                                <Save fontSize="small" /> {saving ? "Saving..." : editAsset ? "Save Changes" : "Create Asset"}
                            </button>
                        </div>
                    </LiquidGlassModal>
                )}
            </AnimatePresence>
        </div>
    );
}
