"use client";
import React, { useEffect, useRef } from "react";
import {
    OpenInNew,
    Star,
    StarBorder,
    Bookmark,
    BookmarkBorder
} from "@mui/icons-material";

interface ToolContextMenuProps {
    x: number;
    y: number;
    toolName: string;
    toolQuery: string;
    onClose: () => void;
    onOpenInNewTab: () => void;
    onAddToFavorites: () => void;
    onAddToBookmarks: () => void;
    isFavorite: boolean;
    isBookmarked: boolean;
}

const ToolContextMenu: React.FC<ToolContextMenuProps> = ({
    x,
    y,
    toolName,
    toolQuery,
    onClose,
    onOpenInNewTab,
    onAddToFavorites,
    onAddToBookmarks,
    isFavorite,
    isBookmarked
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close the menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // Adjust position if menu would go off screen
    const adjustedX = x + 200 > window.innerWidth ? x - 200 : x;
    const adjustedY = y + 200 > window.innerHeight ? y - 200 : y;

    return (
        <div
            ref={menuRef}
            className="tool-context-menu"
            style={{
                position: "fixed",
                top: adjustedY,
                left: adjustedX,
                zIndex: 1100
            }}>
            <div className="context-menu-header">
                <span className="context-menu-title">{toolName}</span>
            </div>
            <div className="context-menu-items">
                <div
                    className="context-menu-item"
                    onClick={onOpenInNewTab}>
                    <OpenInNew className="context-menu-icon" />
                    <span>Open in new tab</span>
                </div>
                <div
                    className="context-menu-item"
                    onClick={onAddToFavorites}>
                    {isFavorite ? (
                        <>
                            <Star className="context-menu-icon favorite" />
                            <span>Remove from favorites</span>
                        </>
                    ) : (
                        <>
                            <StarBorder className="context-menu-icon" />
                            <span>Add to favorites</span>
                        </>
                    )}
                </div>
                <div
                    className="context-menu-item"
                    onClick={onAddToBookmarks}>
                    {isBookmarked ? (
                        <>
                            <Bookmark className="context-menu-icon bookmarked" />
                            <span>Remove from bookmarks</span>
                        </>
                    ) : (
                        <>
                            <BookmarkBorder className="context-menu-icon" />
                            <span>Add to bookmarks</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToolContextMenu;
