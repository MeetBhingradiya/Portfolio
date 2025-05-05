/**
 *  @FileID          app/Tools/Settings/Cloud.tsx
 *  @Description     Cloud bookmark management component for syncing, editing, and deleting bookmarks across devices
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 01/05/25 1:00 PM IST (Kolkata +5:30 UTC)
 *  @modified 01/05/25 1:00 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import React from "react";
import {
    IToolsModalData,
    IBookmark,
    IToolsState,
    IToolsSettingsTabs,
    DefualtBookmark
} from "./Types";
import {
    Card,
    Input,
    Button,
    Chip,
    Tooltip
} from "@heroui/react";
import {
    Typography,
    Grid,
    Divider
} from "@mui/material";
import { motion } from "framer-motion";
import {
    Search,
    CloudSync,
    CloudOff,
    Delete,
    Edit,
    CheckCircleOutline,
    CheckBoxOutlineBlank,
    Warning,
    WarningAmber
} from "@mui/icons-material";
import BookmarkItemMarketPlace from "./BookmarkItemMarketPlace";
import BookmarkItemSkeleton from "./BookmarkItemSkeleton";
import { log, Sleep } from "@/Utils";
import { toast } from "react-toastify";

interface CloudProps {
    ModalState: IToolsModalData;
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>;
    State: IToolsState;
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>;
}

function Cloud({ ModalState, SetModalState, State, Dispatch }: CloudProps) {

    const [cloudBookmarks, setCloudBookmarks] = React.useState<IBookmark[]>([]);
    const [filteredBookmarks, setFilteredBookmarks] = React.useState<IBookmark[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedBookmarks, setSelectedBookmarks] = React.useState<Set<string>>(new Set());
    const [query, setQuery] = React.useState("");
    const [isMultiSelect, setIsMultiSelect] = React.useState(false);
    const [isUnsavedChanges, setIsUnsavedChanges] = React.useState(false);

    // Get cloud bookmarks from state
    React.useEffect(() => {
        const bookmarksWithCloudSync = State.Bookmarks.filter(bookmark => bookmark.isCloudSync);
        setCloudBookmarks(bookmarksWithCloudSync);
        setFilteredBookmarks(bookmarksWithCloudSync);
    }, [State.Bookmarks]);

    // Load cloud bookmarks from server
    const fetchCloudBookmarks = async () => {
        if (!State.Preferences.CloudSync) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const result:any = await Sleep(2000)
            
            if (result.success && result.data && Array.isArray(result.data.bookmarks)) {
                // Merge server bookmarks with local ones
                const serverBookmarks = result.data.bookmarks;
                const localBookmarkIds = new Set(State.Bookmarks.map(b => b.BookmarkID));
                
                // Find bookmarks that exist on server but not locally
                const newServerBookmarks = serverBookmarks.filter(
                    (serverBook:any) => !localBookmarkIds.has(serverBook.BookmarkID)
                );
                
                if (newServerBookmarks.length > 0) {
                    // Add new bookmarks to local state
                    const updatedBookmarks = [...State.Bookmarks, ...newServerBookmarks];
                    
                    Dispatch({
                        ...State,
                        Bookmarks: updatedBookmarks,
                        FilterBookmarks: updatedBookmarks
                    });
                    
                    setCloudBookmarks(updatedBookmarks.filter(bookmark => bookmark.isCloudSync));
                    setFilteredBookmarks(updatedBookmarks.filter(bookmark => bookmark.isCloudSync));
                    
                    toast.info(`Found ${newServerBookmarks.length} new cloud bookmark${newServerBookmarks.length !== 1 ? 's' : ''}`);
                }
            }
        } catch (err) {
            console.error("Error fetching cloud bookmarks:", err);
            setError("Failed to fetch cloud bookmarks. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch cloud bookmarks on component mount
    React.useEffect(() => {
        if (State.Preferences.CloudSync) {
            fetchCloudBookmarks();
        }
    }, [State.Preferences.CloudSync]);

    // Handle search
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchQuery = e.target.value.trim().toLowerCase();
        setQuery(searchQuery);

        if (!searchQuery) {
            setFilteredBookmarks(cloudBookmarks);
            return;
        }

        const filtered = cloudBookmarks.filter(bookmark => {
            return (
                bookmark.Name.toLowerCase().includes(searchQuery) ||
                bookmark.WebLink.toLowerCase().includes(searchQuery) ||
                bookmark.Description?.toLowerCase().includes(searchQuery) ||
                (bookmark.Keywords ?? []).some(keyword => keyword.toLowerCase().includes(searchQuery))
            );
        });

        setFilteredBookmarks(filtered);
    };

    // Toggle selection of bookmarks for multi-selection mode
    const toggleSelectBookmark = (bookmarkId: string | undefined) => {
        if (!bookmarkId) return;

        setSelectedBookmarks(prev => {
            const newSelected = new Set(prev);
            
            if (newSelected.has(bookmarkId)) {
                newSelected.delete(bookmarkId);
            } else {
                // If not in multi-select mode and selecting a bookmark, clear previous selections
                if (!isMultiSelect && newSelected.size > 0) {
                    newSelected.clear();
                }
                newSelected.add(bookmarkId);
            }
            
            return newSelected;
        });
    };

    // Handle edit bookmark (single selection)
    const handleEditBookmark = () => {
        if (selectedBookmarks.size !== 1) {
            toast.error("Please select exactly one bookmark to edit");
            return;
        }

        const bookmarkId = Array.from(selectedBookmarks)[0];
        const bookmark = State.Bookmarks.find(b => b.BookmarkID === bookmarkId);
        
        if (bookmark) {
            SetModalState({
                ...ModalState,
                type: IToolsSettingsTabs.Edit,
                bookmark: bookmark
            });
        }
    };

    // Handle delete bookmarks (works with multi-selection)
    const handleDeleteBookmarks = async () => {
        if (selectedBookmarks.size === 0) {
            toast.error("Please select at least one bookmark to delete");
            return;
        }

        setIsLoading(true);
        const bookmarkIds = Array.from(selectedBookmarks);

        try {
            // First update the local state to maintain UI responsiveness
            const updatedBookmarks = State.Bookmarks.filter(
                bookmark => !bookmarkIds.includes(bookmark.BookmarkID)
            );

            // Update filteredBookmarks for the UI
            const updatedFilterBookmarks = State.FilterBookmarks.filter(
                bookmark => !bookmarkIds.includes(bookmark.BookmarkID)
            );

            // Update Redux state
            Dispatch({
                ...State,
                Bookmarks: updatedBookmarks,
                FilterBookmarks: updatedFilterBookmarks
            });

            // Now handle cloud deletion if cloud sync is enabled
            if (State.Preferences.CloudSync) {
                // Delete from cloud
                const result:any = await Sleep(2000); // Simulate cloud deletion operation
                
                if (!result.success) {
                    // If cloud deletion fails, show error but don't revert UI changes
                    toast.warning("Bookmarks removed locally but cloud sync failed");
                }
            }

            // Clear selections
            setSelectedBookmarks(new Set());
            
            // Update cloud bookmarks local state
            setCloudBookmarks(updatedBookmarks.filter(bookmark => bookmark.isCloudSync));
            
            // Show success message
            toast.success(`${bookmarkIds.length} bookmark${bookmarkIds.length > 1 ? 's' : ''} deleted successfully`);
            
        } catch (error) {
            console.error("Error deleting bookmarks:", error);
            toast.error("An error occurred while deleting bookmarks");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle cloud sync
    const handleCloudSync = async () => {
        setIsLoading(true);
        
        try {
            // Filter out bookmarks that are marked for cloud sync
            const bookmarksToSync = State.Bookmarks.filter(bookmark => bookmark.isCloudSync);
            
            // Use the service to sync bookmarks with cloud
            const result:any = await Sleep(2000); // Simulate cloud sync operation
            
            if (result.success) {
                toast.success("Bookmarks synced with cloud successfully");
                setIsUnsavedChanges(false);
            } else {
                toast.error(result.message || "Failed to sync bookmarks with cloud");
            }
        } catch (err) {
            console.error("Error syncing bookmarks with cloud:", err);
            toast.error("Failed to sync bookmarks with cloud");
        } finally {
            setIsLoading(false);
        }
    };

    // Create a new bookmark
    const handleCreateBookmark = () => {
        SetModalState({
            ...ModalState,
            type: IToolsSettingsTabs.Create,
            bookmark: {
                ...DefualtBookmark,
                isCloudSync: true // Enable cloud sync by default for new bookmarks
            }
        });
    };

    // Toggle between single and multi-selection modes
    const toggleMultiSelect = () => {
        setIsMultiSelect(!isMultiSelect);
        setSelectedBookmarks(new Set()); // Clear selections when toggling modes
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2 justify-center items-center">
                <Typography variant="h1" className="font-bold text-6xl">
                    <CloudSync fontSize="inherit" />
                </Typography>
                <Typography variant="h4" className="font-bold text-lg">
                    Cloud Bookmarks
                </Typography>
                <Typography variant="body1" className="text-gray-500 text-sm">
                    Manage your cloud-synced bookmarks and keep them updated across all your devices.
                </Typography>
            </div>

            {/* Search and action buttons */}
            <div className="sticky top-0 z-10 py-2 px-2 rounded-md border-2 border-gray-200 dark:border-gray-800 backdrop-blur-md flex flex-col" 
                style={{ background: "var(--background)" }}>
                <div className="flex flex-col md:flex-row gap-3 items-center mb-4">
                    <Input
                        fullWidth
                        placeholder="Search your cloud bookmarks..."
                        startContent={<Search className="text-gray-500" />}
                        value={query}
                        onChange={handleSearchChange}
                        className="flex-1"
                    />
                    
                    <div className="flex gap-2 justify-end">
                        <Button
                            color="primary"
                            onPress={handleCreateBookmark}
                            className="whitespace-nowrap"
                        >
                            Create Bookmark
                        </Button>
                        
                        <Button
                            color="secondary"
                            onPress={toggleMultiSelect}
                            className="whitespace-nowrap"
                        >
                            {isMultiSelect ? "Single Select" : "Multi Select"}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-2">
                    <Typography variant="body2" className="text-gray-500">
                        {filteredBookmarks.length} cloud bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
                    </Typography>

                    <div className="flex gap-2">
                        {selectedBookmarks.size > 0 && (
                            <>
                                {selectedBookmarks.size === 1 && (
                                    <Button
                                        color="warning"
                                        variant="flat"
                                        onPress={handleEditBookmark}
                                        startContent={<Edit />}
                                    >
                                        Edit
                                    </Button>
                                )}
                                
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={handleDeleteBookmarks}
                                    startContent={<Delete />}
                                >
                                    Delete {selectedBookmarks.size > 1 ? `(${selectedBookmarks.size})` : ''}
                                </Button>
                            </>
                        )}

                        {isUnsavedChanges && (
                            <Button
                                color="success"
                                variant="shadow"
                                onPress={handleCloudSync}
                                startContent={<CloudSync />}
                                isLoading={isLoading}
                            >
                                Sync Changes
                            </Button>
                        )}
                    </div>
                </div>
                
                {isMultiSelect && (
                    <Chip color="warning" className="self-start mb-2">
                        Multi-select mode active
                    </Chip>
                )}
            </div>

            {/* Status messages */}
            {cloudBookmarks.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <CloudOff className="text-gray-400 mb-2" sx={{ fontSize: 48 }} />
                    <Typography variant="h6" className="text-gray-700 dark:text-gray-300">
                        No Cloud Bookmarks Found
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mt-1 mb-3">
                        You don&apos;t have any bookmarks configured to sync with the cloud
                    </Typography>
                    <Button
                        color="primary"
                        onPress={handleCreateBookmark}
                    >
                        Create Your First Cloud Bookmark
                    </Button>
                </div>
            )}

            {!State.Preferences.CloudSync && cloudBookmarks.length > 0 && (
                <div className="flex items-center gap-3 p-4 mb-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <Warning className="text-yellow-500" />
                    <div>
                        <Typography variant="body1" className="font-medium">
                            Cloud Sync is Disabled
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                            Enable Cloud Sync in Preferences to automatically update bookmarks across your devices
                        </Typography>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                    <WarningAmber className="text-warning mb-2" sx={{ fontSize: 48 }} />
                    <Typography variant="h6">{error}</Typography>
                    <Button
                        variant="light"
                        color="primary"
                        className="mt-4"
                        onPress={() => {
                            setError(null);
                            const bookmarksWithCloudSync = State.Bookmarks.filter(bookmark => bookmark.isCloudSync);
                            setCloudBookmarks(bookmarksWithCloudSync);
                            setFilteredBookmarks(bookmarksWithCloudSync);
                        }}
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {/* Bookmark grid */}
            {filteredBookmarks.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                    {filteredBookmarks.map((bookmark) => (
                        <Grid component="div" key={bookmark.BookmarkID}>
                            <BookmarkItemMarketPlace
                                Data={bookmark}
                                isSelected={selectedBookmarks.has(bookmark.BookmarkID)}
                                isAdmin={ModalState.isAdmin}
                                toggleSelectBookmark={() => toggleSelectBookmark(bookmark.BookmarkID)}
                                style={{ padding: "10px" }}
                            />
                        </Grid>
                    ))}
                </div>
            )}

            {/* Loading skeletons */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <Grid component="div" key={`skeleton-${i}`}>
                            <BookmarkItemSkeleton index={i} />
                        </Grid>
                    ))}
                </div>
            )}

            {/* Footer actions */}
            {filteredBookmarks.length > 0 && (
                <div className="mt-4">
                    <Divider className="my-4" />
                    <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-gray-500">
                            {selectedBookmarks.size} bookmark{selectedBookmarks.size !== 1 ? 's' : ''} selected
                        </Typography>
                        
                        <div className="flex gap-2">
                            {selectedBookmarks.size > 0 && (
                                <Button
                                    color="secondary"
                                    variant="light"
                                    onPress={() => setSelectedBookmarks(new Set())}
                                >
                                    Clear Selection
                                </Button>
                            )}
                            
                            {isMultiSelect && filteredBookmarks.length > 0 && (
                                <Button
                                    color="primary"
                                    variant="light"
                                    onPress={() => {
                                        const allIds = new Set(filteredBookmarks.map(b => b.BookmarkID));
                                        setSelectedBookmarks(allIds);
                                    }}
                                >
                                    Select All
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cloud;