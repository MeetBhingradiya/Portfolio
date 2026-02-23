"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Close, Check, Person, Add, DeleteOutline } from "@mui/icons-material";
import { useDesignTheme } from "@Hooks";
import { useSession, authClient } from "@Library/auth-client";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./UserAvatar";

interface SwitchAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface DeviceSession {
    id: string;
    token: string;
    userId: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        email: string;
        name?: string;
        image?: string;
    };
}

export default function SwitchAccountModal({ isOpen, onClose }: SwitchAccountModalProps) {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";
    const router = useRouter();

    const session = useSession();
    const [accounts, setAccounts] = useState<DeviceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadAccounts();
        }
    }, [isOpen]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const { data, error } = await authClient.multiSession.listDeviceSessions();
            if (error) {
                console.error("Failed to load sessions:", error);
                setAccounts([]);
            } else {
                // data is array of { user, session } objects
                const formatted = (data || []).map((item: any) => ({
                    id: item.session.id,
                    token: item.session.token,
                    userId: item.user.id,
                    userAgent: item.session.userAgent,
                    createdAt: item.session.createdAt,
                    updatedAt: item.session.updatedAt,
                    user: item.user,
                }));
                setAccounts(formatted);
            }
        } catch (error) {
            console.error("Failed to load accounts:", error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchAccount = async (sessionToken: string) => {
        if (switching) return;

        setSwitching(true);
        try {
            const { error } = await authClient.multiSession.setActive({
                sessionToken,
            });

            if (error) {
                console.error("Failed to switch account:", error);
                alert("Failed to switch account. Please try again.");
            } else {
                onClose();
                router.refresh();
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to switch account:", error);
            alert("Failed to switch account. Please try again.");
        } finally {
            setSwitching(false);
        }
    };

    const handleRemoveAccount = async (sessionToken: string, userId: string) => {
        if (!confirm("Remove this account from the list? You'll need to sign in again to add it back.")) {
            return;
        }

        try {
            const { error } = await authClient.multiSession.revoke({
                sessionToken,
            });

            if (error) {
                console.error("Failed to revoke session:", error);
                alert("Failed to remove account. Please try again.");
                return;
            }

            await loadAccounts();

            // If removing current account, sign out
            const currentUserId = session.data?.user?.id;
            if (currentUserId === userId) {
                await authClient.signOut();
                router.push("/auth/signin");
            }
        } catch (error) {
            console.error("Failed to remove account:", error);
            alert("Failed to remove account. Please try again.");
        }
    };

    const handleAddAccount = () => {
        onClose();
        router.push("/auth/signin?addAccount=true");
    };

    if (!isOpen) return null;

    const currentUserId = session.data?.user?.id;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        backgroundColor: isDark ? palette.surface : palette.background,
                        border: `1px solid ${palette.border}`,
                    }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-6 border-b"
                        style={{ borderColor: palette.border }}
                    >
                        <h2
                            className="text-xl font-semibold"
                            style={{ color: palette.textPrimary }}
                        >
                            Switch Account
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg transition-colors hover:bg-opacity-10"
                            style={{
                                color: palette.textSecondary,
                                backgroundColor: `${palette.textSecondary}10`,
                            }}
                        >
                            <Close />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
                                    style={{ borderColor: palette.accent }}
                                />
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="text-center py-8">
                                <Person
                                    style={{
                                        fontSize: 64,
                                        color: palette.textSecondary,
                                        opacity: 0.5,
                                    }}
                                />
                                <p
                                    className="mt-4 text-base"
                                    style={{ color: palette.textSecondary }}
                                >
                                    No saved accounts. Sign in to add one.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {accounts.map((account) => {
                                    const isActive = account.userId === currentUserId;

                                    return (
                                        <motion.div
                                            key={account.id}
                                            className="flex items-center justify-between p-4 rounded-xl border transition-all"
                                            style={{
                                                borderColor: isActive
                                                    ? palette.accent
                                                    : palette.border,
                                                backgroundColor: isActive
                                                    ? palette.accentSubtle
                                                    : "transparent",
                                            }}
                                            whileHover={{ scale: 1.02 }}
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                {/* Avatar */}
                                                <UserAvatar
                                                    userId={account.userId}
                                                    name={account.user.name}
                                                    email={account.user.email}
                                                    image={account.user.image}
                                                    size={40}
                                                />

                                                {/* Account Info */}
                                                <div className="flex-1">
                                                    <p
                                                        className="font-medium text-sm"
                                                        style={{ color: palette.textPrimary }}
                                                    >
                                                        {account.user.name || account.user.email}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{ color: palette.textSecondary }}
                                                    >
                                                        {account.user.email}
                                                    </p>
                                                </div>

                                                {isActive && (
                                                    <div
                                                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                                                        style={{
                                                            backgroundColor: palette.accent,
                                                            color: "#fff",
                                                        }}
                                                    >
                                                        <Check fontSize="small" />
                                                        Active
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 ml-3">
                                                {!isActive && (
                                                    <button
                                                        onClick={() => handleSwitchAccount(account.token)}
                                                        disabled={switching}
                                                        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                        style={{
                                                            backgroundColor: palette.accent,
                                                            color: "#fff",
                                                            opacity: switching ? 0.5 : 1,
                                                        }}
                                                    >
                                                        Switch
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveAccount(account.token, account.userId)}
                                                    className="p-2 rounded-lg transition-colors"
                                                    style={{
                                                        color: "#ef4444",
                                                        backgroundColor: "#ef444410",
                                                    }}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="p-6 border-t"
                        style={{ borderColor: palette.border }}
                    >
                        <button
                            onClick={handleAddAccount}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all"
                            style={{
                                backgroundColor: palette.accentSubtle,
                                color: palette.accent,
                            }}
                        >
                            <Add />
                            Add Another Account
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
