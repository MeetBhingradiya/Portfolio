"use client";

/**
 * CookieWarning
 *
 * Shows a dismissible banner when the browser may be blocking cookies.
 * Without cookies, Better Auth sessions cannot be persisted and OAuth
 * sign-in will silently fail or redirect-loop.
 *
 * Detection strategy (in order):
 *  1. navigator.cookieEnabled === false  → definitely blocked
 *  2. Write + read a test cookie         → blocked if it doesn't survive
 *  3. document.cookie check              → may reveal Strict tracking prevention
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Close, Cookie, Warning } from "@mui/icons-material";

function areCookiesBlocked(): boolean {
    // Fast path
    if (typeof navigator !== "undefined" && !navigator.cookieEnabled) return true;

    // Write / read test
    try {
        const key = "__cookie_test__";
        document.cookie = `${key}=1; path=/; SameSite=Lax`;
        const ok = document.cookie.includes(key);
        // Clean up
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        return !ok;
    } catch {
        return true;
    }
}

export function CookieWarning() {
    const [blocked, setBlocked] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check once per session — if the user dismissed earlier, don't re-show
        const wasDismissed = sessionStorage.getItem("cookie_warning_dismissed") === "1";
        if (wasDismissed) return;

        if (areCookiesBlocked()) {
            setBlocked(true);
        }
    }, []);

    const dismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("cookie_warning_dismissed", "1");
    };

    return (
        <AnimatePresence>
            {blocked && !dismissed && (
                <motion.div
                    key="cookie-warning"
                    initial={{ opacity: 0, y: -16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.97 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-full rounded-2xl overflow-hidden mb-4"
                    style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.12) 100%)",
                        border: "1px solid rgba(245,158,11,0.4)",
                    }}
                >
                    <div className="flex items-start gap-3 p-4 pr-3">
                        <Warning
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: "#f59e0b", fontSize: 20 }}
                        />

                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: "#f59e0b" }}>
                                Cookies are blocked
                            </p>
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#fcd34d" }}>
                                Your browser is blocking cookies. Sign-in sessions and OAuth
                                (Google&nbsp;/&nbsp;GitHub&nbsp;/&nbsp;Microsoft) won't work without them.
                                Please allow cookies for this site in your browser settings or
                                disable your tracking-prevention extension.
                            </p>

                            {/* Browser-specific quick tips */}
                            <details className="mt-2">
                                <summary
                                    className="text-xs cursor-pointer select-none"
                                    style={{ color: "#fbbf24" }}
                                >
                                    How to fix this ▸
                                </summary>
                                <ul className="mt-1.5 space-y-1 text-xs pl-3" style={{ color: "#fcd34d" }}>
                                    <li>
                                        <strong>Chrome / Edge:</strong> Settings → Privacy and security →
                                        Cookies → Allow all cookies (or add this site as an exception)
                                    </li>
                                    <li>
                                        <strong>Firefox:</strong> Settings → Privacy &amp; Security →
                                        Custom → uncheck Cookies, or add an exception for this site
                                    </li>
                                    <li>
                                        <strong>Safari:</strong> Settings → Privacy → uncheck "Prevent
                                        cross-site tracking" and "Block all cookies"
                                    </li>
                                    <li>
                                        <strong>Brave:</strong> Click the Shields icon in the address bar
                                        → set Cookies to "Allow all cookies"
                                    </li>
                                </ul>
                            </details>
                        </div>

                        <button
                            onClick={dismiss}
                            aria-label="Dismiss cookie warning"
                            className="flex-shrink-0 p-1 rounded-lg transition-opacity hover:opacity-70"
                            style={{ color: "#f59e0b" }}
                        >
                            <Close fontSize="small" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
