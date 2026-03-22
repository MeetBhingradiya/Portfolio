/**
 * Contact Manager Page
 * List contacts with pending collections/payments. Add/edit contact modal.
 * Uses LiquidGlass/OneUI theme components.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks";
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
import {
    Add,
    Close,
    PersonAdd,
    Delete,
    Edit,
    Save,
    Search,
    Phone,
    Email,
    ArrowDownward,
    ArrowUpward,
    Sync,
} from "@mui/icons-material";

interface Contact {
    ContactID: string;
    Name: string;
    Relation?: string;
    Phones: string[];
    Emails: string[];
    InstagramIDs: string[];
    SnapIDs: string[];
    PendingCollections: number;
    PendingPayments: number;
    Notes?: string;
    Source?: string;
}

export default function ContactsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark  = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editContact, setEditContact] = useState<Contact | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [relation, setRelation] = useState("");
    const [phones, setPhones] = useState("");
    const [emails, setEmails] = useState("");
    const [instagram, setInstagram] = useState("");
    const [snap, setSnap] = useState("");
    const [pendingCollections, setPendingCollections] = useState("");
    const [pendingPayments, setPendingPayments] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const surfaceBg = isApple
        ? isDark ? "rgba(38, 38, 42, 0.6)" : "rgba(255, 255, 255, 0.6)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("t", Date.now().toString());
        const res = await fetch(`/api/wallet/contacts?${params}`, { cache: "no-store" }).then(r => r.json());
        if (res.success) setContacts(res.data ?? []);
        setLoading(false);
    }, [search]);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    const importGoogleContacts = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/wallet/contacts/import", { method: "POST" }).then(r => r.json());
            if (res.success) {
                alert(`Successfully imported/synced contacts from Google! Imported: ${res.data.imported}, Skipped/Existing: ${res.data.skipped}`);
                fetchContacts();
            } else {
                alert(`Sync failed: ${res.error || "Unknown error. Please ensure you have granted Contacts permission during login."}`);
            }
        } catch (e: any) {
            alert("Error syncing contacts: " + e.message);
        } finally {
            setSyncing(false);
        }
    };

    const openModal = (contact?: Contact) => {
        if (contact) {
            setEditContact(contact);
            setName(contact.Name);
            setRelation(contact.Relation ?? "");
            setPhones(contact.Phones.join(", "));
            setEmails(contact.Emails.join(", "));
            setInstagram(contact.InstagramIDs.join(", "));
            setSnap(contact.SnapIDs.join(", "));
            setPendingCollections(String(contact.PendingCollections || ""));
            setPendingPayments(String(contact.PendingPayments || ""));
            setNotes(contact.Notes ?? "");
        } else {
            setEditContact(null);
            setName(""); setRelation(""); setPhones(""); setEmails("");
            setInstagram(""); setSnap(""); setPendingCollections(""); setPendingPayments(""); setNotes("");
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const body: Record<string, any> = {
                Name: name.trim(),
                Relation: relation || undefined,
                Phones: phones.split(",").map(s => s.trim()).filter(Boolean),
                Emails: emails.split(",").map(s => s.trim()).filter(Boolean),
                InstagramIDs: instagram.split(",").map(s => s.trim()).filter(Boolean),
                SnapIDs: snap.split(",").map(s => s.trim()).filter(Boolean),
                PendingCollections: parseFloat(pendingCollections) || 0,
                PendingPayments: parseFloat(pendingPayments) || 0,
                Notes: notes || undefined,
            };
            if (editContact) body.ContactID = editContact.ContactID;

            await fetch("/api/wallet/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            setShowModal(false);
            fetchContacts();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this contact?")) return;
        setDeletingId(id);
        await fetch(`/api/wallet/contacts?id=${id}`, { method: "DELETE" });
        setDeletingId(null);
        fetchContacts();
    };

    const totalCollections = contacts.reduce((s, c) => s + (c.PendingCollections || 0), 0);
    const totalPayments = contacts.reduce((s, c) => s + (c.PendingPayments || 0), 0);

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: palette.textPrimary }}>Contacts</h1>
                    <p className="text-sm mt-1" style={{ color: palette.textSecondary }}>
                        Manage relationships and track pending dues
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isApple ? (
                        <>
                            <LiquidGlassButton variant="secondary" className="px-4 py-2.5 flex items-center gap-2" onClick={importGoogleContacts} disabled={syncing}>
                                <Sync fontSize="small" className={syncing ? "animate-spin" : ""} />
                                <span className="font-semibold text-sm">{syncing ? "Syncing..." : "Sync Google"}</span>
                            </LiquidGlassButton>
                            <LiquidGlassButton className="px-5 py-2.5 flex items-center gap-2" onClick={() => openModal()}>
                                <PersonAdd fontSize="small" />
                                <span className="font-semibold text-sm tracking-wide">Add Contact</span>
                            </LiquidGlassButton>
                        </>
                    ) : (
                        <>
                            <OneUIButton variant="secondary" className="px-4 py-2.5 flex items-center gap-2" onClick={importGoogleContacts} disabled={syncing}>
                                <Sync fontSize="small" className={syncing ? "animate-spin" : ""} />
                                <span className="font-semibold text-sm">{syncing ? "Syncing..." : "Sync Google"}</span>
                            </OneUIButton>
                            <OneUIButton variant="primary" className="px-5 py-2.5 flex items-center gap-2" onClick={() => openModal()}>
                                <PersonAdd fontSize="small" />
                                <span className="font-semibold text-sm">Add Contact</span>
                            </OneUIButton>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    {isApple ? (
                        <LiquidGlassCard intensity="subtle" className="p-5 flex flex-col justify-center border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 rounded-full bg-green-500/10 text-green-500"><ArrowDownward fontSize="small" /></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-green-500">To Collect</span>
                            </div>
                            <p className="text-3xl font-bold text-green-500">₹{totalCollections.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                        </LiquidGlassCard>
                    ) : (
                        <div className="border-l-4 border-green-500 rounded-[32px]">
                            <OneUICard className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1 rounded-full bg-green-500/10 text-green-500"><ArrowDownward fontSize="small" /></div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-green-500">To Collect</span>
                                </div>
                                <p className="text-3xl font-extrabold text-green-500">₹{totalCollections.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                            </OneUICard>
                        </div>
                    )}
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    {isApple ? (
                        <LiquidGlassCard intensity="subtle" className="p-5 flex flex-col justify-center border-l-4 border-red-500">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 rounded-full bg-red-500/10 text-red-500"><ArrowUpward fontSize="small" /></div>
                                <span className="text-xs font-bold uppercase tracking-wider text-red-500">To Pay</span>
                            </div>
                            <p className="text-3xl font-bold text-red-500">₹{totalPayments.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                        </LiquidGlassCard>
                    ) : (
                        <div className="border-l-4 border-red-500 rounded-[32px]">
                            <OneUICard className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1 rounded-full bg-red-500/10 text-red-500"><ArrowUpward fontSize="small" /></div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-red-500">To Pay</span>
                                </div>
                                <p className="text-3xl font-extrabold text-red-500">₹{totalPayments.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                            </OneUICard>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: isApple ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : inputBg, border: `1px solid ${borderColor}` }}>
                <Search fontSize="small" style={{ color: palette.textTertiary }} />
                <input
                    type="text" placeholder="Search contacts by name, email, phone..."
                    className="bg-transparent outline-none flex-1 font-medium text-sm"
                    style={{ color: palette.textPrimary }}
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Contact List */}
            <AnimatePresence mode="popLayout">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                className="flex justify-center p-12 text-sm font-medium" style={{ color: palette.textTertiary }}>
                        Loading contacts...
                    </motion.div>
                ) : contacts.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                                className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                        <div className="p-5 rounded-full" style={{ background: `${palette.accent}15`, color: palette.accent }}>
                            <PersonAdd style={{ fontSize: 40 }} />
                        </div>
                        <h3 className="text-lg font-bold" style={{ color: palette.textPrimary }}>No contacts found</h3>
                        <p className="text-sm" style={{ color: palette.textSecondary }}>Sync with Google or add manually.</p>
                    </motion.div>
                ) : (
                    <motion.div key="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {contacts.map((c, i) => {
                            const innerContent = (
                                <div className="flex flex-col h-full group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
                                                style={{ background: `${palette.accent}15`, border: `1px solid ${palette.accent}30`, color: palette.accent }}>
                                                {c.Name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base line-clamp-1" style={{ color: palette.textPrimary }}>{c.Name}</h3>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {c.Relation && (
                                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded" style={{ background: `${palette.accent}15`, color: palette.accent }}>
                                                            {c.Relation}
                                                        </span>
                                                    )}
                                                    {c.Source === "google" && (
                                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                                                            Google Card
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                            <button onClick={() => openModal(c)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" style={{ color: palette.textSecondary }}>
                                                <Edit fontSize="small" />
                                            </button>
                                            <button onClick={() => handleDelete(c.ContactID)} disabled={deletingId === c.ContactID} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" style={{ color: "#ef4444", opacity: deletingId === c.ContactID ? 0.5 : 1 }}>
                                                <Delete fontSize="small" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4 flex-1">
                                        {c.Phones.length > 0 && (
                                            <div className="flex items-start gap-2 text-xs font-medium" style={{ color: palette.textSecondary }}>
                                                <Phone style={{ fontSize: 16, opacity: 0.7 }} />
                                                <span className="leading-snug">{c.Phones.join(", ")}</span>
                                            </div>
                                        )}
                                        {c.Emails.length > 0 && (
                                            <div className="flex items-start gap-2 text-xs font-medium" style={{ color: palette.textSecondary }}>
                                                <Email style={{ fontSize: 16, opacity: 0.7 }} />
                                                <span className="leading-snug break-all">{c.Emails.join(", ")}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Pending Dues */}
                                    <div className="pt-3 flex gap-2 border-t" style={{ borderColor: `${palette.border}` }}>
                                        {c.PendingCollections > 0 || c.PendingPayments > 0 ? (
                                            <>
                                                {c.PendingCollections > 0 && (
                                                    <div className="flex-1 px-2 py-1.5 rounded-lg text-center" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                                                        <span className="block text-[10px] uppercase font-bold opacity-80">Collect</span>
                                                        <span className="font-bold text-sm">₹{c.PendingCollections.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {c.PendingPayments > 0 && (
                                                    <div className="flex-1 px-2 py-1.5 rounded-lg text-center" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                                        <span className="block text-[10px] uppercase font-bold opacity-80">Pay</span>
                                                        <span className="font-bold text-sm">₹{c.PendingPayments.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full text-center text-xs font-medium py-1" style={{ color: palette.textTertiary }}>
                                                Settled
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );

                            return (
                                <motion.div key={c.ContactID} 
                                            initial={{ opacity: 0, y: 10 }} 
                                            animate={{ opacity: 1, y: 0 }} 
                                            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.5) }}
                                            layout>
                                    {isApple ? (
                                        <LiquidGlassCard intensity="subtle" className="p-5 h-full transition-all hover:-translate-y-1 hover:shadow-xl">
                                            {innerContent}
                                        </LiquidGlassCard>
                                    ) : (
                                        <OneUICard className="p-5 h-full transition-transform hover:-translate-y-1">
                                            {innerContent}
                                        </OneUICard>
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
                    <LiquidGlassModal isOpen={showModal} onClose={() => setShowModal(false)} title={editContact ? "Edit Contact" : "Add Contact"}>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            {[
                                { label: "Name *",              value: name,               set: setName,               ph: "Contact name", type: "text" },
                                { label: "Relation",            value: relation,           set: setRelation,           ph: "e.g. Friend, Client, Family", type: "text" },
                                { label: "Phone(s)",            value: phones,             set: setPhones,             ph: "Mobile number(s) comma separated", type: "text" },
                                { label: "Email(s)",            value: emails,             set: setEmails,             ph: "Email address(es) comma separated", type: "text" },
                                { label: "Pending Collection ₹",value: pendingCollections, set: setPendingCollections, ph: "0", type: "number" },
                                { label: "Pending Payment ₹",   value: pendingPayments,    set: setPendingPayments,    ph: "0", type: "number" },
                                { label: "Notes",               value: notes,              set: setNotes,              ph: "Optional context...", type: "text" },
                            ].map(({ label, value, set, ph, type: inputType }) => (
                                <div key={label}>
                                    <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: palette.textSecondary }}>{label}</label>
                                    <input
                                        type={inputType} value={value} onChange={e => set(e.target.value)}
                                        placeholder={ph}
                                        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2"
                                        style={{ background: inputBg, border: `1px solid ${borderColor}`, color: palette.textPrimary, "focusRingColor": palette.accent } as any}
                                    />
                                </div>
                            ))}

                            <button onClick={handleSave} disabled={saving || !name.trim()}
                                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-transform active:scale-95"
                                style={{ background: palette.accent, color: palette.textOnAccent || "#fff", opacity: !name.trim() ? 0.5 : 1 }}>
                                <Save fontSize="small" /> {saving ? "Saving..." : editContact ? "Save Changes" : "Create Contact"}
                            </button>
                        </div>
                    </LiquidGlassModal>
                )}
            </AnimatePresence>
        </div>
    );
}
