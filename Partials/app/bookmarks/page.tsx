/**
 * Bookmarks Page - Edge New Tab Style
 * Modern bookmarks manager with folders, quick access, and search
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDesignTheme } from "../../Hooks/useDesignTheme";
import AdvancedNavigation from "../../Components/NewLanding/AdvancedNavigation";
import RedesignedFooter from "../../Components/NewLanding/RedesignedFooter";
import { LiquidGlassCard, LiquidGlassButton } from "../../Components/LiquidGlass";
import { OneUICard, OneUIButton } from "../../Components/OneUI";
import {
    Bookmark,
    BookmarkBorder,
    Folder,
    FolderOpen,
    Add,
    Edit,
    Delete,
    Search,
    Star,
    StarBorder,
    Language,
    Link as LinkIcon,
    Close,
    DragIndicator,
    ViewModule,
    ViewList,
    GridView,
    FilterList,
    Sort
} from "@mui/icons-material";
import { useSession } from "../../Lib/auth-client";
import { useRouter } from "next/navigation";
import { Axios } from "../../Utils/Axios";
import Link from "next/link";

interface BookmarkItem {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    folderId?: string;
    isFavorite: boolean;
    createdAt: string;
    tags: string[];
}

interface FolderItem {
    id: string;
    name: string;
    color: string;
    icon: string;
    bookmarkCount: number;
}

function BookmarksContent() {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";
    const Card = isApple ? LiquidGlassCard : OneUICard;
    const Button = isApple ? LiquidGlassButton : OneUIButton;

    const { data: session, isPending } = useSession();
    const router = useRouter();

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [folders, setFolders] = useState<FolderItem[]>([
        { id: "all", name: "All Bookmarks", color: palette.accent, icon: "bookmark", bookmarkCount: 28 },
        { id: "favorites", name: "Favorites", color: "#FFD700", icon: "star", bookmarkCount: 12 },
        { id: "work", name: "Work", color: "#3B82F6", icon: "work", bookmarkCount: 8 },
        { id: "personal", name: "Personal", color: "#10B981", icon: "person", bookmarkCount: 5 },
        { id: "learning", name: "Learning", color: "#8B5CF6", icon: "school", bookmarkCount: 3 }
    ]);

    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([
        {
            id: "1",
            title: "GitHub Repository",
            url: "https://github.com/username/repo",
            favicon: "https://github.githubassets.com/favicons/favicon.svg",
            folderId: "work",
            isFavorite: true,
            createdAt: "2024-01-15",
            tags: ["development", "github"]
        },
        {
            id: "2",
            title: "MDN Web Docs",
            url: "https://developer.mozilla.org",
            favicon: "https://developer.mozilla.org/favicon-48x48.bc390275e955dacb2e65.png",
            folderId: "learning",
            isFavorite: true,
            createdAt: "2024-01-14",
            tags: ["documentation", "web"]
        },
        {
            id: "3",
            title: "Stack Overflow",
            url: "https://stackoverflow.com",
            favicon: "https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico",
            folderId: "work",
            isFavorite: false,
            createdAt: "2024-01-13",
            tags: ["help", "community"]
        },
        {
            id: "4",
            title: "YouTube",
            url: "https://youtube.com",
            favicon: "https://www.youtube.com/favicon.ico",
            folderId: "personal",
            isFavorite: true,
            createdAt: "2024-01-12",
            tags: ["entertainment", "videos"]
        }
    ]);

    const [newBookmark, setNewBookmark] = useState({
        title: "",
        url: "",
        folderId: "",
        tags: ""
    });

    const [newFolder, setNewFolder] = useState({
        name: "",
        color: palette.accent,
        icon: "folder"
    });

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/signin?callbackUrl=/bookmarks");
        }
    }, [isPending, session, router]);

    const filteredBookmarks = bookmarks.filter(bookmark => {
        const matchesSearch = searchQuery === "" || 
            bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFolder = !selectedFolder || 
            selectedFolder === "all" || 
            (selectedFolder === "favorites" && bookmark.isFavorite) ||
            bookmark.folderId === selectedFolder;

        return matchesSearch && matchesFolder;
    });

    const toggleFavorite = async (bookmarkId: string) => {
        setBookmarks(prev => prev.map(b => 
            b.id === bookmarkId ? { ...b, isFavorite: !b.isFavorite } : b
        ));
    };

    const deleteBookmark = async (bookmarkId: string) => {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    };

    const handleAddBookmark = async () => {
        if (!newBookmark.title || !newBookmark.url) return;

        const bookmark: BookmarkItem = {
            id: Date.now().toString(),
            title: newBookmark.title,
            url: newBookmark.url,
            folderId: newBookmark.folderId || undefined,
            isFavorite: false,
            createdAt: new Date().toISOString(),
            tags: newBookmark.tags.split(",").map(t => t.trim()).filter(Boolean)
        };

        setBookmarks(prev => [bookmark, ...prev]);
        setNewBookmark({ title: "", url: "", folderId: "", tags: "" });
        setShowAddModal(false);
    };

    const handleAddFolder = async () => {
        if (!newFolder.name) return;

        const folder: FolderItem = {
            id: Date.now().toString(),
            name: newFolder.name,
            color: newFolder.color,
            icon: newFolder.icon,
            bookmarkCount: 0
        };

        setFolders(prev => [...prev, folder]);
        setNewFolder({ name: "", color: palette.accent, icon: "folder" });
        setShowFolderModal(false);
    };

    if (isPending) {
        return (
            <div 
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}
            >
                <div 
                    className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <>
            <AdvancedNavigation />

            <main
                className="min-h-screen py-24"
                style={{ background: palette.background }}
            >
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1
                                    className={`${isApple ? "text-4xl font-bold" : "text-5xl font-black"} mb-2`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Bookmarks
                                </h1>
                                <p
                                    className={`${isApple ? "text-base" : "text-lg font-medium"}`}
                                    style={{ color: palette.textSecondary }}
                                >
                                    Manage your saved links and resources
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* View Toggle */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"} transition-all`}
                                        style={{
                                            background: viewMode === "grid" ? palette.accent : palette.surfaceSecondary,
                                            color: viewMode === "grid" ? "#ffffff" : palette.textSecondary
                                        }}
                                    >
                                        <GridView fontSize="small" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`${isApple ? "p-2 rounded-lg" : "p-3 rounded-xl"} transition-all`}
                                        style={{
                                            background: viewMode === "list" ? palette.accent : palette.surfaceSecondary,
                                            color: viewMode === "list" ? "#ffffff" : palette.textSecondary
                                        }}
                                    >
                                        <ViewList fontSize="small" />
                                    </button>
                                </div>

                                <Button
                                    onClick={() => setShowFolderModal(true)}
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                >
                                    <Folder />
                                    <span className="hidden md:inline">New Folder</span>
                                </Button>

                                <Button
                                    onClick={() => setShowAddModal(true)}
                                    variant="primary"
                                    className="flex items-center gap-2"
                                >
                                    <Add />
                                    <span className="hidden md:inline">Add Bookmark</span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
                        {/* Sidebar */}
                        <motion.aside
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <Card
                                className={isApple ? "p-4" : "p-6"}
                                elevated={!isApple}
                            >
                                <h2
                                    className={`${isApple ? "text-lg font-bold" : "text-xl font-black"} mb-4`}
                                    style={{ color: palette.textPrimary }}
                                >
                                    Folders
                                </h2>

                                <div className="space-y-2">
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            onClick={() => setSelectedFolder(folder.id)}
                                            className={`w-full flex items-center justify-between ${isApple ? "p-3 rounded-lg" : "p-4 rounded-xl"} transition-all`}
                                            style={{
                                                background: selectedFolder === folder.id ? `${folder.color}20` : "transparent",
                                                border: `2px solid ${selectedFolder === folder.id ? folder.color : "transparent"}`
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`${isApple ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-xl"} flex items-center justify-center`}
                                                    style={{ background: folder.color }}
                                                >
                                                    {folder.icon === "star" ? (
                                                        <Star style={{ color: "#ffffff", fontSize: "1.2rem" }} />
                                                    ) : (
                                                        <Folder style={{ color: "#ffffff", fontSize: "1.2rem" }} />
                                                    )}
                                                </div>
                                                <span
                                                    className={`${isApple ? "text-sm font-medium" : "text-base font-semibold"}`}
                                                    style={{ color: palette.textPrimary }}
                                                >
                                                    {folder.name}
                                                </span>
                                            </div>
                                            <span
                                                className={`${isApple ? "text-xs" : "text-sm"} font-bold px-2 py-1 rounded-full`}
                                                style={{
                                                    background: palette.surfaceSecondary,
                                                    color: palette.textSecondary
                                                }}
                                            >
                                                {folder.bookmarkCount}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </motion.aside>

                        {/* Main Content */}
                        <div className="space-y-6">
                            {/* Search Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="relative">
                                    <Search
                                        className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{ color: palette.textTertiary }}
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search bookmarks..."
                                        className={`w-full ${isApple ? "pl-12 pr-4 py-3 rounded-xl" : "pl-14 pr-6 py-4 rounded-2xl"} outline-none transition-all`}
                                        style={{
                                            background: palette.surface,
                                            color: palette.textPrimary,
                                            border: `2px solid ${palette.border}`
                                        }}
                                    />
                                </div>
                            </motion.div>

                            {/* Bookmarks Grid/List */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                {filteredBookmarks.length === 0 ? (
                                    <Card
                                        className={`${isApple ? "p-12" : "p-16"} text-center`}
                                        elevated={!isApple}
                                    >
                                        <BookmarkBorder
                                            style={{
                                                fontSize: "4rem",
                                                color: palette.textTertiary,
                                                marginBottom: "1rem"
                                            }}
                                        />
                                        <h3
                                            className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"} mb-2`}
                                            style={{ color: palette.textPrimary }}
                                        >
                                            No bookmarks found
                                        </h3>
                                        <p
                                            className={isApple ? "text-sm" : "text-base"}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            {searchQuery ? "Try adjusting your search" : "Add your first bookmark to get started"}
                                        </p>
                                    </Card>
                                ) : (
                                    <div className={viewMode === "grid" 
                                        ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4"
                                        : "space-y-3"
                                    }>
                                        {filteredBookmarks.map((bookmark, index) => (
                                            <motion.div
                                                key={bookmark.id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                            >
                                                <Card
                                                    className={`${isApple ? "p-4" : "p-5"} group hover:scale-[1.02] transition-all cursor-pointer`}
                                                    elevated={!isApple}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Favicon */}
                                                        <div
                                                            className={`${isApple ? "w-10 h-10 rounded-lg" : "w-12 h-12 rounded-xl"} flex items-center justify-center flex-shrink-0`}
                                                            style={{ background: palette.surfaceSecondary }}
                                                        >
                                                            {bookmark.favicon ? (
                                                                <img
                                                                    src={bookmark.favicon}
                                                                    alt=""
                                                                    className="w-6 h-6"
                                                                />
                                                            ) : (
                                                                <Language style={{ color: palette.textTertiary }} />
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3
                                                                className={`${isApple ? "text-base font-semibold" : "text-lg font-bold"} mb-1 truncate`}
                                                                style={{ color: palette.textPrimary }}
                                                            >
                                                                {bookmark.title}
                                                            </h3>
                                                            <a
                                                                href={bookmark.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`${isApple ? "text-xs" : "text-sm"} truncate block hover:underline`}
                                                                style={{ color: palette.textSecondary }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {bookmark.url}
                                                            </a>
                                                            {bookmark.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {bookmark.tags.map(tag => (
                                                                        <span
                                                                            key={tag}
                                                                            className="text-xs px-2 py-1 rounded-full"
                                                                            style={{
                                                                                background: palette.surfaceSecondary,
                                                                                color: palette.textTertiary
                                                                            }}
                                                                        >
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleFavorite(bookmark.id);
                                                                }}
                                                                className={`${isApple ? "p-2 rounded-lg" : "p-2 rounded-xl"} transition-all hover:scale-110`}
                                                                style={{ background: palette.surfaceSecondary }}
                                                            >
                                                                {bookmark.isFavorite ? (
                                                                    <Star style={{ color: "#FFD700", fontSize: "1.2rem" }} />
                                                                ) : (
                                                                    <StarBorder style={{ color: palette.textTertiary, fontSize: "1.2rem" }} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteBookmark(bookmark.id);
                                                                }}
                                                                className={`${isApple ? "p-2 rounded-lg" : "p-2 rounded-xl"} transition-all hover:scale-110`}
                                                                style={{ background: palette.surfaceSecondary }}
                                                            >
                                                                <Delete style={{ color: "#EF4444", fontSize: "1.2rem" }} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Bookmark Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <Card
                                className={isApple ? "p-6" : "p-8"}
                                intensity={isApple ? "strong" : undefined}
                                elevated={!isApple}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2
                                        className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        Add Bookmark
                                    </h2>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className={`${isApple ? "p-2 rounded-lg" : "p-2 rounded-xl"}`}
                                        style={{ background: palette.surfaceSecondary }}
                                    >
                                        <Close style={{ color: palette.textSecondary }} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm" : "text-base"} font-semibold mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={newBookmark.title}
                                            onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="My Awesome Site"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm" : "text-base"} font-semibold mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            URL
                                        </label>
                                        <input
                                            type="url"
                                            value={newBookmark.url}
                                            onChange={(e) => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="https://example.com"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm" : "text-base"} font-semibold mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Folder
                                        </label>
                                        <select
                                            value={newBookmark.folderId}
                                            onChange={(e) => setNewBookmark(prev => ({ ...prev, folderId: e.target.value }))}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                        >
                                            <option value="">No folder</option>
                                            {folders.filter(f => f.id !== "all" && f.id !== "favorites").map(folder => (
                                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm" : "text-base"} font-semibold mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Tags (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={newBookmark.tags}
                                            onChange={(e) => setNewBookmark(prev => ({ ...prev, tags: e.target.value }))}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="development, resources, tools"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            onClick={() => setShowAddModal(false)}
                                            variant="secondary"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddBookmark}
                                            variant="primary"
                                            className="flex-1"
                                            disabled={!newBookmark.title || !newBookmark.url}
                                        >
                                            Add Bookmark
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Folder Modal */}
            <AnimatePresence>
                {showFolderModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        onClick={() => setShowFolderModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <Card
                                className={isApple ? "p-6" : "p-8"}
                                intensity={isApple ? "strong" : undefined}
                                elevated={!isApple}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2
                                        className={`${isApple ? "text-xl font-bold" : "text-2xl font-black"}`}
                                        style={{ color: palette.textPrimary }}
                                    >
                                        New Folder
                                    </h2>
                                    <button
                                        onClick={() => setShowFolderModal(false)}
                                        className={`${isApple ? "p-2 rounded-lg" : "p-2 rounded-xl"}`}
                                        style={{ background: palette.surfaceSecondary }}
                                    >
                                        <Close style={{ color: palette.textSecondary }} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm" : "text-base"} font-semibold mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Folder Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newFolder.name}
                                            onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                                            className={`w-full ${isApple ? "px-4 py-3 rounded-xl" : "px-5 py-4 rounded-2xl"} outline-none`}
                                            style={{
                                                background: palette.surfaceSecondary,
                                                color: palette.textPrimary,
                                                border: `2px solid ${palette.border}`
                                            }}
                                            placeholder="My Folder"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className={`block ${isApple ? "text-sm" : "text-base"} font-semibold mb-2`}
                                            style={{ color: palette.textSecondary }}
                                        >
                                            Color
                                        </label>
                                        <div className="flex gap-2">
                                            {["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setNewFolder(prev => ({ ...prev, color }))}
                                                    className={`w-10 h-10 rounded-full transition-all ${newFolder.color === color ? "scale-125 ring-2 ring-offset-2" : ""}`}
                                                    style={{
                                                        background: color
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            onClick={() => setShowFolderModal(false)}
                                            variant="secondary"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddFolder}
                                            variant="primary"
                                            className="flex-1"
                                            disabled={!newFolder.name}
                                        >
                                            Create Folder
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <RedesignedFooter />
        </>
    );
}

export default function BookmarksPage() {
    return <BookmarksContent />;
}
