"use client";

import React from "react";
import { Person } from "@mui/icons-material";
import { generateAvatarGradient, getInitials } from "@/Utils/AvatarUtils";

interface UserAvatarProps {
    userId: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    size?: number;
    className?: string;
    showBorder?: boolean;
    borderColor?: string;
}

/**
 * Universal avatar component that handles:
 * - OAuth profile images
 * - Consistent gradient backgrounds based on user ID
 * - Initials from name or email
 */
export function UserAvatar({
    userId,
    name,
    email,
    image,
    size = 40,
    className = "",
    showBorder = false,
    borderColor = "#fff"
}: UserAvatarProps) {
    const initials = getInitials(name, email);
    const gradient = generateAvatarGradient(userId);

    if (image) {
        return (
            <div
                className={`rounded-full flex items-center justify-center overflow-hidden ${className}`}
                style={{
                    width: size,
                    height: size,
                    border: showBorder ? `2px solid ${borderColor}` : "none"
                }}>
                <img
                    src={image}
                    alt={name || email || "User avatar"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to gradient on image load error
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.nextSibling) {
                            (target.nextSibling as HTMLElement).style.display = "flex";
                        }
                    }}
                />
                {/* Fallback gradient (hidden by default) */}
                <div
                    style={{
                        display: "none",
                        width: size,
                        height: size,
                        background: gradient,
                        color: "#fff",
                        fontSize: size * 0.4,
                        fontWeight: 600
                    }}
                    className="rounded-full flex items-center justify-center">
                    {initials}
                </div>
            </div>
        );
    }

    // No image - show gradient with initials
    return (
        <div
            className={`rounded-full flex items-center justify-center ${className}`}
            style={{
                width: size,
                height: size,
                background: gradient,
                color: "#fff",
                fontSize: size * 0.4,
                fontWeight: 600,
                border: showBorder ? `2px solid ${borderColor}` : "none"
            }}>
            {initials}
        </div>
    );
}
