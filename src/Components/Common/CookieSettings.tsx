"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { Cookie, Close } from "@mui/icons-material";

interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
}

export default function CookieSettings() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [cookies, setCookies] = React.useState<CookiePreferences>({
        essential: true, // Always true, non-changeable
        analytics: true,
        marketing: false,
        preferences: true
    });

    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    // Load saved preferences
    React.useEffect(() => {
        const savedPreferences = localStorage.getItem("cookiePreferences");
        if (savedPreferences) {
            const parsed = JSON.parse(savedPreferences);
            setCookies({ ...parsed, essential: true }); // Ensure essential is always true
        }
    }, []);

    const updateCookie = React.useCallback(
        (key: keyof CookiePreferences, value: boolean) => {
            if (key === "essential") return; // Prevent changing essential cookies
            const updated = { ...cookies, [key]: value };
            setCookies(updated);
            localStorage.setItem("cookiePreferences", JSON.stringify(updated));
        },
        [cookies]
    );

    const acceptAll = React.useCallback(() => {
        const allAccepted = {
            essential: true,
            analytics: true,
            marketing: true,
            preferences: true
        };
        setCookies(allAccepted);
        localStorage.setItem("cookiePreferences", JSON.stringify(allAccepted));
        setIsOpen(false);
    }, []);

    const rejectAll = React.useCallback(() => {
        const onlyEssential = {
            essential: true,
            analytics: false,
            marketing: false,
            preferences: false
        };
        setCookies(onlyEssential);
        localStorage.setItem("cookiePreferences", JSON.stringify(onlyEssential));
        setIsOpen(false);
    }, []);

    // Memoize styles
    const buttonStyles = React.useMemo(
        () => ({
            background: isApple
                ? isDark
                    ? "linear-gradient(180deg, rgba(58, 58, 60, 0.72) 0%, rgba(44, 44, 46, 0.68) 50%, rgba(28, 28, 30, 0.72) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(250, 250, 250, 0.6) 50%, rgba(255, 255, 255, 0.7) 100%)"
                : palette.backgroundSecondary,
            backdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
            WebkitBackdropFilter: isApple ? "blur(30px) saturate(200%)" : "none",
            border: isApple
                ? isDark
                    ? "0.5px solid rgba(255, 255, 255, 0.18)"
                    : "0.5px solid rgba(255, 255, 255, 0.8)"
                : `1px solid ${palette.border}`,
            boxShadow: isApple
                ? isDark
                    ? "0 8px 32px rgba(0, 0, 0, 0.48), 0 0 0 0.5px rgba(255, 255, 255, 0.1) inset, 0 1px 0 0 rgba(255, 255, 255, 0.15) inset, 0 -1px 0 0 rgba(0, 0, 0, 0.3) inset"
                    : "0 4px 24px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 1) inset, 0 1px 2px 0 rgba(255, 255, 255, 1) inset, 0 -1px 1px 0 rgba(0, 0, 0, 0.04) inset"
                : "none",
            color: palette.textPrimary
        }),
        [isApple, isDark, palette]
    );

    const panelStyles = React.useMemo(
        () => ({
            width: "320px",
            maxWidth: "90vw",
            backdropFilter: isApple ? "blur(60px) saturate(200%) brightness(1.05)" : "none",
            WebkitBackdropFilter: isApple ? "blur(60px) saturate(200%) brightness(1.05)" : "none",
            background: isApple
                ? isDark
                    ? "linear-gradient(180deg, rgba(44, 44, 46, 0.78) 0%, rgba(36, 36, 38, 0.72) 40%, rgba(28, 28, 30, 0.78) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(252, 252, 252, 0.65) 40%, rgba(250, 250, 250, 0.72) 100%)"
                : palette.surfaceElevated,
            border: isApple
                ? isDark
                    ? "0.5px solid rgba(255, 255, 255, 0.18)"
                    : "0.5px solid rgba(255, 255, 255, 0.9)"
                : `1px solid ${palette.border}`,
            borderRadius: isApple ? "20px" : "28px",
            boxShadow: isApple
                ? isDark
                    ? "0 24px 72px rgba(0, 0, 0, 0.64), 0 0 0 0.5px rgba(255, 255, 255, 0.08) inset, 0 1px 2px 0 rgba(255, 255, 255, 0.15) inset, 0 -1px 2px 0 rgba(0, 0, 0, 0.4) inset"
                    : "0 12px 48px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 1) inset, 0 2px 4px 0 rgba(255, 255, 255, 1) inset, 0 -1px 2px 0 rgba(0, 0, 0, 0.05) inset"
                : palette.shadowLg,
            overflow: "hidden"
        }),
        [isApple, isDark, palette]
    );

    return (
        <div className="relative">
            {/* Toggle Button */}
            <motion.button
                className={`${isApple ? "p-3" : "p-4"} rounded-full flex items-center gap-2 relative overflow-hidden`}
                style={buttonStyles}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                {isApple && (
                    <>
                        {/* Glass refraction - top highlight */}
                        <div
                            className="absolute inset-x-0 top-0 pointer-events-none"
                            style={{
                                height: "45%",
                                background: isDark
                                    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, rgba(255, 255, 255, 0.02) 60%, transparent 100%)"
                                    : "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.6) 30%, rgba(255, 255, 255, 0.2) 60%, transparent 100%)",
                                borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
                                mixBlendMode: isDark ? "screen" : "overlay"
                            }}
                        />
                        {/* Specular highlight */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                top: "15%",
                                left: "25%",
                                width: "50%",
                                height: "30%",
                                background: isDark
                                    ? "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 40%, transparent 70%)"
                                    : "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 70%)",
                                borderRadius: "50%",
                                filter: "blur(4px)"
                            }}
                        />
                        {/* Bottom shadow */}
                        <div
                            className="absolute inset-x-0 bottom-0 pointer-events-none"
                            style={{
                                height: "35%",
                                background: isDark
                                    ? "linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%)"
                                    : "linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 50%, transparent 100%)",
                                borderRadius: "0 0 50% 50% / 0 0 100% 100%"
                            }}
                        />
                    </>
                )}
                <Cookie className="relative z-10" />
            </motion.button>

            {/* Cookie Settings Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            className="absolute bottom-full right-0 mb-4 z-50"
                            style={panelStyles}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}>
                            {isApple && (
                                <>
                                    {/* Top curved glass reflection */}
                                    <div
                                        className="absolute inset-x-0 top-0 pointer-events-none"
                                        style={{
                                            height: "40%",
                                            background: isDark
                                                ? "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)"
                                                : "linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                                            borderRadius: "20px 20px 60% 60% / 20px 20px 15% 15%",
                                            mixBlendMode: isDark ? "screen" : "overlay"
                                        }}
                                    />
                                    {/* Specular highlight */}
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            top: "8%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            width: "60%",
                                            height: "25%",
                                            background: isDark
                                                ? "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%)"
                                                : "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 40%, transparent 70%)",
                                            borderRadius: "50%",
                                            filter: "blur(8px)"
                                        }}
                                    />
                                    {/* Top edge highlight */}
                                    <div
                                        className="absolute inset-x-0 top-0 pointer-events-none"
                                        style={{
                                            height: "1px",
                                            background: isDark
                                                ? "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 50%, transparent 100%)"
                                                : "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 1) 50%, transparent 100%)",
                                            borderRadius: "20px 20px 0 0"
                                        }}
                                    />
                                    {/* Bottom depth shadow */}
                                    <div
                                        className="absolute inset-x-0 bottom-0 pointer-events-none"
                                        style={{
                                            height: "30%",
                                            background: isDark
                                                ? "linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.06) 50%, transparent 100%)"
                                                : "linear-gradient(0deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 50%, transparent 100%)",
                                            borderRadius: "0 0 20px 20px"
                                        }}
                                    />
                                </>
                            )}

                            <div className={isApple ? "p-4" : "p-6"}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3
                                        className={`${isApple ? "text-lg font-bold" : "text-xl font-black"}`}
                                        style={{ color: palette.textPrimary }}>
                                        Cookie Preferences
                                    </h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 rounded-lg"
                                        style={{
                                            color: palette.textSecondary
                                        }}>
                                        <Close />
                                    </button>
                                </div>

                                {/* Cookie Options */}
                                <div className="space-y-3 mb-5">
                                    {/* Essential - Non-changeable */}
                                    <div
                                        className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex items-center justify-between`}
                                        style={{
                                            background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"}`
                                        }}>
                                        <div>
                                            <div
                                                className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                Essential
                                            </div>
                                            <div
                                                className={`${isApple ? "text-xs" : "text-sm"} mt-0.5`}
                                                style={{
                                                    color: palette.textTertiary
                                                }}>
                                                Required (Always Active)
                                            </div>
                                        </div>
                                        <div
                                            className={`${isApple ? "px-3 py-1.5 rounded-lg" : "px-4 py-2 rounded-xl"}`}
                                            style={{
                                                background: `${palette.accent}20`,
                                                color: palette.accent
                                            }}>
                                            <span className={`${isApple ? "text-xs font-bold" : "text-sm font-black"}`}>ON</span>
                                        </div>
                                    </div>

                                    {/* Analytics, Marketing, Preferences */}
                                    {(["analytics", "marketing", "preferences"] as const).map((type) => (
                                        <motion.button
                                            key={type}
                                            onClick={() => updateCookie(type, !cookies[type])}
                                            className={`${isApple ? "p-3 rounded-xl" : "p-4 rounded-2xl"} flex items-center justify-between w-full`}
                                            style={{
                                                background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                                                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)"}`
                                            }}
                                            whileHover={{
                                                background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"
                                            }}
                                            whileTap={{ scale: 0.98 }}>
                                            <div className="text-left">
                                                <div
                                                    className={`${isApple ? "text-sm font-semibold" : "text-base font-bold"}`}
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </div>
                                                <div
                                                    className={`${isApple ? "text-xs" : "text-sm"} mt-0.5`}
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    {type === "analytics" && "Help us improve"}
                                                    {type === "marketing" && "Personalized content"}
                                                    {type === "preferences" && "Remember your choices"}
                                                </div>
                                            </div>
                                            <div
                                                className={`${isApple ? "w-11 h-6 rounded-full" : "w-14 h-7 rounded-full"} relative`}
                                                style={{
                                                    background: cookies[type]
                                                        ? palette.accent
                                                        : isDark
                                                          ? "rgba(255, 255, 255, 0.1)"
                                                          : "rgba(0, 0, 0, 0.1)"
                                                }}>
                                                <motion.div
                                                    className={`${isApple ? "w-5 h-5" : "w-6 h-6"} rounded-full bg-white absolute top-0.5`}
                                                    animate={{
                                                        x: cookies[type] ? (isApple ? 20 : 28) : 2
                                                    }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 30
                                                    }}
                                                    style={{
                                                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                                                    }}
                                                />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={rejectAll}
                                        className={`${isApple ? "px-4 py-2.5 rounded-xl text-sm font-semibold" : "px-5 py-3 rounded-2xl text-base font-black"} flex-1`}
                                        style={{
                                            background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                                            color: palette.textPrimary,
                                            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}>
                                        Do Not Track me
                                    </motion.button>
                                    <motion.button
                                        onClick={acceptAll}
                                        className={`${isApple ? "px-4 py-2.5 rounded-xl text-sm font-semibold" : "px-5 py-3 rounded-2xl text-base font-black"} flex-1`}
                                        style={{
                                            background: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accentDark || palette.accent} 100%)`,
                                            color: palette.textOnAccent,
                                            border: "none"
                                        }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}>
                                        Accept It
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
