/**
 * CDN Access Request Page
 * /developer/cdn
 *
 * Public-facing page where anyone can apply for an API key to use
 * the private GitHub CDN system. Also shows application status by email.
 */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    CloudUpload,
    CheckCircle,
    Schedule,
    Cancel,
    Block,
    Search,
    Send,
    ArrowBack,
    Speed,
    Storage,
    Security,
    Api,
    ExpandMore,
    ExpandLess,
    ContentCopy,
    OpenInNew,
} from "@mui/icons-material";

// ── Types ─────────────────────────────────────────────────────────────────────

type Plan = "free" | "basic" | "pro" | "enterprise";
type AppStatus = "pending" | "approved" | "rejected" | "suspended";

interface ApplicationStatus {
    _id: string;
    appName: string;
    status: AppStatus;
    requestedPlan: Plan;
    createdAt: string;
    rejectionReason?: string;
}

// ── Plan info ─────────────────────────────────────────────────────────────────

const PLANS: { key: Plan; label: string; rpm: number; rpd: string; size: string; price: string; highlight?: boolean }[] = [
    { key: "free",       label: "Free",       rpm: 10,  rpd: "1,000",   size: "5 MB",   price: "Free" },
    { key: "basic",      label: "Basic",      rpm: 30,  rpd: "10,000",  size: "20 MB",  price: "By request", highlight: true },
    { key: "pro",        label: "Pro",        rpm: 120, rpd: "50,000",  size: "49 MB",  price: "By request" },
    { key: "enterprise", label: "Enterprise", rpm: 600, rpd: "200,000", size: "49 MB",  price: "Contact us" },
];

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending:   { label: "Under Review",  color: "#f59e0b", icon: <Schedule fontSize="small" /> },
    approved:  { label: "Approved",      color: "#22c55e", icon: <CheckCircle fontSize="small" /> },
    rejected:  { label: "Rejected",      color: "#ef4444", icon: <Cancel fontSize="small" /> },
    suspended: { label: "Suspended",     color: "#8b5cf6", icon: <Block fontSize="small" /> },
};

// ── Main component ────────────────────────────────────────────────────────────

export default function CDNAccessPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark   = actualColorMode === "dark";

    const cardBg   = isApple
        ? isDark ? "rgba(28,28,32,0.82)" : "rgba(255,255,255,0.82)"
        : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border   = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;
    const br       = isApple ? 20 : 24;
    const blur     = isApple ? "blur(20px) saturate(160%)" : "none";

    // ── Form state ────────────────────────────────────────────────────────
    const [step, setStep] = useState<"form" | "success">("form");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const [form, setForm] = useState({
        applicantName: "",
        applicantEmail: "",
        appName: "",
        appDescription: "",
        useCaseDetails: "",
        requestedPlan: "free" as Plan,
        appWebsite: "",
        appGithub: "",
        appOrganisation: "",
        expectedMonthlyRequests: "",
    });

    const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);
        try {
            const res = await fetch("/api/cdn/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    expectedMonthlyRequests: form.expectedMonthlyRequests ? Number(form.expectedMonthlyRequests) : undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) { setFormError(json.error || "Submission failed."); return; }
            setStep("success");
        } catch {
            setFormError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Status checker ────────────────────────────────────────────────────
    const [checkEmail, setCheckEmail] = useState("");
    const [checking, setChecking] = useState(false);
    const [applications, setApplications] = useState<ApplicationStatus[] | null>(null);
    const [checkError, setCheckError] = useState("");

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setCheckError("");
        setChecking(true);
        try {
            const res = await fetch(`/api/cdn/applications?email=${encodeURIComponent(checkEmail)}`);
            const json = await res.json();
            if (!res.ok) { setCheckError(json.error || "Query failed."); return; }
            setApplications(json.applications);
        } catch {
            setCheckError("Network error.");
        } finally {
            setChecking(false);
        }
    };

    // ── FAQ ───────────────────────────────────────────────────────────────
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const faqs = [
        { q: "How long does approval take?", a: "Applications are reviewed manually. Most are processed within 1–3 business days. You'll receive an email once reviewed." },
        { q: "Where is my API key sent?", a: "Once your application is approved, the admin will issue a key and send it to your contact email. For security reasons the key is only shown once and never stored in plain text." },
        { q: "Can I upgrade my plan later?", a: "Yes. Submit a new application describing your needs and request an upgrade. The admin can update your key's rate-limit policy at any time." },
        { q: "Is uploaded data private?", a: "Yes. All files are stored in a private GitHub repository and served exclusively through our proxied API. No raw GitHub URLs are exposed." },
        { q: "What file types are supported?", a: "Any file type up to your plan's per-file size cap. The admin can further restrict MIME types for specific keys if required." },
        { q: "What happens if my key is rate-limited?", a: "You'll receive a 429 response with a Retry-After header indicating how many seconds to wait. Rate windows reset automatically." },
    ];

    // ── Shared input style ────────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: isApple ? 12 : 14,
        border,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        color: palette.textPrimary,
        fontSize: 15,
        outline: "none",
        fontFamily: "inherit",
    };
    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: 13,
        fontWeight: isApple ? 500 : 700,
        color: palette.textSecondary,
        marginBottom: 6,
    };

    return (
        <div className="min-h-screen py-12 px-4 md:px-8" style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto space-y-16">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2 mb-8 text-sm" style={{ color: palette.accent }}>
                        <ArrowBack fontSize="small" /> Back to Portfolio
                    </Link>
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                        style={{ background: `${palette.accent}18`, color: palette.accent }}
                    >
                        <CloudUpload fontSize="small" /> CDN External API Access
                    </div>
                    <h1
                        className={`${isApple ? "text-4xl font-semibold" : "text-5xl font-black"} mb-4`}
                        style={{ color: palette.textPrimary }}
                    >
                        Use our CDN in your app
                    </h1>
                    <p className="text-lg max-w-2xl mx-auto" style={{ color: palette.textSecondary }}>
                        Store and serve files through a private GitHub‑backed CDN with per‑key rate limiting.
                        Apply below — a human reviews every request before an API key is issued.
                    </p>
                </motion.div>

                {/* ── Feature callouts ─────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {[
                        { icon: <Security />, title: "Private & Secure", desc: "Files in private repos, served via authenticated proxy. Raw GitHub URLs never exposed." },
                        { icon: <Speed />,    title: "Per-key Rate Limits", desc: "Every API key has its own minute / hour / day limits enforced server-side." },
                        { icon: <Storage />,  title: "Auto-scaling Storage", desc: "New repos are provisioned automatically when storage fills — no action needed." },
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                            className="p-6 flex flex-col gap-3"
                            style={{ background: cardBg, backdropFilter: blur, WebkitBackdropFilter: blur, border, borderRadius: br }}
                        >
                            <div style={{ color: palette.accent }}>{f.icon}</div>
                            <div className={`${isApple ? "text-base font-semibold" : "text-lg font-black"}`} style={{ color: palette.textPrimary }}>{f.title}</div>
                            <div className="text-sm" style={{ color: palette.textSecondary }}>{f.desc}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── Plans ────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <h2 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"} mb-6 text-center`} style={{ color: palette.textPrimary }}>Plans & Rate Limits</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {PLANS.map((plan) => (
                            <div
                                key={plan.key}
                                className="p-5 relative"
                                style={{
                                    background: plan.highlight ? `${palette.accent}12` : cardBg,
                                    backdropFilter: blur, WebkitBackdropFilter: blur,
                                    border: plan.highlight ? `2px solid ${palette.accent}50` : border,
                                    borderRadius: br,
                                }}
                            >
                                {plan.highlight && (
                                    <div
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold"
                                        style={{ background: palette.accent, color: "#fff" }}
                                    >
                                        Popular
                                    </div>
                                )}
                                <div className={`${isApple ? "text-base font-semibold" : "text-lg font-black"} mb-3`} style={{ color: palette.textPrimary }}>{plan.label}</div>
                                <div className="space-y-1.5 text-sm" style={{ color: palette.textSecondary }}>
                                    <div className="flex justify-between"><span>req / min</span><strong style={{ color: palette.textPrimary }}>{plan.rpm}</strong></div>
                                    <div className="flex justify-between"><span>req / day</span><strong style={{ color: palette.textPrimary }}>{plan.rpd}</strong></div>
                                    <div className="flex justify-between"><span>max file</span><strong style={{ color: palette.textPrimary }}>{plan.size}</strong></div>
                                </div>
                                <div className="mt-3 text-xs font-semibold" style={{ color: palette.accent }}>{plan.price}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Application form / success ────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <AnimatePresence mode="wait">
                        {step === "success" ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="p-10 flex flex-col items-center text-center gap-4"
                                style={{ background: cardBg, backdropFilter: blur, WebkitBackdropFilter: blur, border, borderRadius: br }}
                            >
                                <CheckCircle style={{ fontSize: 56, color: "#22c55e" }} />
                                <h2 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"}`} style={{ color: palette.textPrimary }}>Application submitted!</h2>
                                <p style={{ color: palette.textSecondary }}>
                                    Your application is now under review. Check the status below using your email address.
                                    You'll hear back within 1–3 business days.
                                </p>
                                <button
                                    onClick={() => { setStep("form"); setForm({ applicantName: "", applicantEmail: "", appName: "", appDescription: "", useCaseDetails: "", requestedPlan: "free", appWebsite: "", appGithub: "", appOrganisation: "", expectedMonthlyRequests: "" }); }}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-sm"
                                    style={{ background: `${palette.accent}18`, color: palette.accent, border: "none", cursor: "pointer" }}
                                >
                                    Submit another application
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="p-8 md:p-10"
                                style={{ background: cardBg, backdropFilter: blur, WebkitBackdropFilter: blur, border, borderRadius: br }}
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 rounded-xl" style={{ background: `${palette.accent}18` }}>
                                        <Api style={{ color: palette.accent }} />
                                    </div>
                                    <div>
                                        <h2 className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"}`} style={{ color: palette.textPrimary }}>Request Access</h2>
                                        <p className="text-sm" style={{ color: palette.textSecondary }}>All fields marked * are required</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Row 1 — personal */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label style={labelStyle}>Your Name *</label>
                                            <input required value={form.applicantName} onChange={setField("applicantName")} placeholder="Jane Smith" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Contact Email *</label>
                                            <input required type="email" value={form.applicantEmail} onChange={setField("applicantEmail")} placeholder="jane@example.com" style={inputStyle} />
                                        </div>
                                    </div>

                                    {/* Row 2 — app */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label style={labelStyle}>Application Name *</label>
                                            <input required value={form.appName} onChange={setField("appName")} placeholder="Acme Dashboard" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Organisation (optional)</label>
                                            <input value={form.appOrganisation} onChange={setField("appOrganisation")} placeholder="Acme Inc." style={inputStyle} />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label style={labelStyle}>App Description *</label>
                                        <textarea required rows={3} value={form.appDescription} onChange={setField("appDescription") as any} placeholder="Briefly describe what your application does…" style={{ ...inputStyle, resize: "vertical" }} />
                                    </div>

                                    {/* Use case */}
                                    <div>
                                        <label style={labelStyle}>How will you use the CDN? *</label>
                                        <textarea required rows={4} value={form.useCaseDetails} onChange={setField("useCaseDetails") as any}
                                            placeholder="E.g. We'll upload ~50 user avatars (PNG/JPEG ≤ 2 MB) per month and serve them via our backend. We will NOT expose raw links publicly."
                                            style={{ ...inputStyle, resize: "vertical" }}
                                        />
                                    </div>

                                    {/* Row 3 — links + plan */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label style={labelStyle}>App Website</label>
                                            <input type="url" value={form.appWebsite} onChange={setField("appWebsite")} placeholder="https://example.com" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>GitHub Repo</label>
                                            <input type="url" value={form.appGithub} onChange={setField("appGithub")} placeholder="https://github.com/you/repo" style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Est. Requests / Month</label>
                                            <input type="number" min={0} value={form.expectedMonthlyRequests} onChange={setField("expectedMonthlyRequests")} placeholder="5000" style={inputStyle} />
                                        </div>
                                    </div>

                                    {/* Plan selector */}
                                    <div>
                                        <label style={labelStyle}>Requested Plan *</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {PLANS.map((plan) => (
                                                <button
                                                    key={plan.key}
                                                    type="button"
                                                    onClick={() => setForm(p => ({ ...p, requestedPlan: plan.key }))}
                                                    className="p-3 rounded-xl text-left text-sm transition-all"
                                                    style={{
                                                        border: form.requestedPlan === plan.key
                                                            ? `2px solid ${palette.accent}`
                                                            : border,
                                                        background: form.requestedPlan === plan.key ? `${palette.accent}12` : "transparent",
                                                        color: form.requestedPlan === plan.key ? palette.accent : palette.textPrimary,
                                                        fontWeight: form.requestedPlan === plan.key ? 700 : 400,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <div className="font-bold mb-1">{plan.label}</div>
                                                    <div style={{ color: palette.textSecondary, fontSize: 11 }}>{plan.rpm} req/min · {plan.size}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Error */}
                                    <AnimatePresence>
                                        {formError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="px-4 py-3 rounded-xl text-sm"
                                                style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}
                                            >
                                                {formError}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Submit */}
                                    <motion.button
                                        type="submit"
                                        disabled={submitting}
                                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-base"
                                        style={{
                                            background: palette.accent, color: "#fff",
                                            border: "none", cursor: submitting ? "not-allowed" : "pointer",
                                            opacity: submitting ? 0.7 : 1,
                                        }}
                                    >
                                        {submitting ? "Submitting…" : <><Send fontSize="small" /> Submit Application</>}
                                    </motion.button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Status checker ────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="p-8"
                    style={{ background: cardBg, backdropFilter: blur, WebkitBackdropFilter: blur, border, borderRadius: br }}
                >
                    <h2 className={`${isApple ? "text-xl font-semibold" : "text-2xl font-black"} mb-2`} style={{ color: palette.textPrimary }}>Check Application Status</h2>
                    <p className="text-sm mb-6" style={{ color: palette.textSecondary }}>Enter the email you used when applying.</p>
                    <form onSubmit={handleCheck} className="flex gap-3 flex-wrap">
                        <input
                            type="email" required value={checkEmail} onChange={e => setCheckEmail(e.target.value)}
                            placeholder="jane@example.com"
                            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                        />
                        <motion.button
                            type="submit" disabled={checking}
                            whileTap={{ scale: 0.97 }}
                            className="px-5 py-3 rounded-xl font-semibold flex items-center gap-2 text-sm"
                            style={{ background: palette.accent, color: "#fff", border: "none", cursor: "pointer", opacity: checking ? 0.7 : 1, flexShrink: 0 }}
                        >
                            <Search fontSize="small" /> {checking ? "Checking…" : "Check Status"}
                        </motion.button>
                    </form>

                    <AnimatePresence>
                        {checkError && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="mt-4 px-4 py-3 rounded-xl text-sm"
                                style={{ background: "#ef444420", color: "#ef4444" }}
                            >
                                {checkError}
                            </motion.div>
                        )}
                        {applications && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 space-y-3">
                                {applications.length === 0 ? (
                                    <p className="text-sm" style={{ color: palette.textSecondary }}>No applications found for this email.</p>
                                ) : (
                                    applications.map((app) => {
                                        const cfg = STATUS_CONFIG[app.status as AppStatus];
                                        return (
                                            <div
                                                key={app._id}
                                                className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl flex-wrap"
                                                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border }}
                                            >
                                                <div>
                                                    <div className="font-semibold" style={{ color: palette.textPrimary }}>{app.appName}</div>
                                                    <div className="text-xs mt-0.5" style={{ color: palette.textTertiary }}>
                                                        Plan: {app.requestedPlan} · Applied {new Date(app.createdAt).toLocaleDateString()}
                                                    </div>
                                                    {app.rejectionReason && (
                                                        <div className="text-xs mt-1" style={{ color: "#ef4444" }}>Reason: {app.rejectionReason}</div>
                                                    )}
                                                </div>
                                                <div
                                                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                                                    style={{ background: `${cfg.color}18`, color: cfg.color }}
                                                >
                                                    {cfg.icon} {cfg.label}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Quick-start snippet ───────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h2 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"} mb-6 text-center`} style={{ color: palette.textPrimary }}>Quick Start</h2>
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{ background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.04)", border }}
                    >
                        <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                            <div className="text-xs font-mono font-semibold" style={{ color: palette.textSecondary }}>upload.ts</div>
                            <Link href="/docs/CDN_EXTERNAL_API.md" className="ml-auto text-xs flex items-center gap-1" style={{ color: palette.accent }}>
                                Full docs <OpenInNew fontSize="inherit" />
                            </Link>
                        </div>
                        <pre className="p-5 text-sm overflow-x-auto" style={{ color: palette.textPrimary, fontFamily: "monospace", lineHeight: 1.6 }}>
{`const form = new FormData();
form.append("file", file);
form.append("type", "avatar");
form.append("context", \`user:\${userId}\`);

const res = await fetch(
  "https://meetbhingradiya.vercel.app/api/cdn/external/upload",
  {
    method: "POST",
    headers: { "Authorization": \`Bearer \${CDN_API_KEY}\` },
    body: form,
  }
);

const { assetId, cdnUrl } = await res.json();
// cdnUrl → https://meetbhingradiya.vercel.app/api/cdn/<assetId>`}
                        </pre>
                    </div>
                </motion.div>

                {/* ── FAQ ───────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <h2 className={`${isApple ? "text-2xl font-semibold" : "text-3xl font-black"} mb-6 text-center`} style={{ color: palette.textPrimary }}>FAQ</h2>
                    <div className="space-y-2">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="rounded-xl overflow-hidden"
                                style={{ border, background: cardBg, backdropFilter: blur, WebkitBackdropFilter: blur }}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                                    style={{ background: "transparent", border: "none", cursor: "pointer", color: palette.textPrimary, fontWeight: isApple ? 500 : 700 }}
                                >
                                    {faq.q}
                                    {openFaq === i ? <ExpandLess fontSize="small" style={{ color: palette.accent }} /> : <ExpandMore fontSize="small" style={{ color: palette.textTertiary }} />}
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="px-5 pb-4 text-sm" style={{ color: palette.textSecondary }}>{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
