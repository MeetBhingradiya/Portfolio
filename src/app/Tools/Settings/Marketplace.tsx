"use client";

import React from "react";
import {
    IToolsModalData,
    IBookmark,
    IToolsState,
    IToolsSettingsTabs
} from "./Types";
import {
    Card,
    Input,
    Button,
} from "@heroui/react";
import {
    Typography,
    Grid
} from "@mui/material";
import { motion } from "framer-motion";
import {
    Search,
    AddCircleOutline,
    WarningAmber,
    CloudDownload,
    LocalMall
} from "@mui/icons-material";
import { Axios } from "@Utils/Axios";
import { useInView } from "react-intersection-observer";
import BookmarkItemMarketPlace from "./BookmarkItemMarketPlace";
import BookmarkItemSkeleton from "./BookmarkItemSkeleton";
import { log } from "@/Utils";
interface MarketplaceProps {
    ModalState: IToolsModalData;
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>;
    State: IToolsState;
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>;
}

function Marketplace({ ModalState, SetModalState, State, Dispatch }: MarketplaceProps) {

    const [filteredBookmarks, setFilteredBookmarks] = React.useState<IBookmark[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedBookmarks, setSelectedBookmarks] = React.useState<Set<string>>(new Set());

    function setRemoteBookmarks(bookmarks: IBookmark[]) {
        SetModalState(prev => ({
            ...prev,
            RemoteBookmarks: bookmarks
        }));
    }

    const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

        SetModalState(prev => ({
            ...prev,
            MarketPlaceQuery: e.target.value
        }));

        // ? Chacks for Space
        let Query = e.target.value.trim();

        if (!Query) {
            setFilteredBookmarks(ModalState.RemoteBookmarks);
            return;
        }

        const query = Query?.toLowerCase();

        const isExactMatch = (name: string, keywords: Array<string> = []): boolean => {
            return name.toLowerCase() === query || keywords.some((keyword) => keyword.toLowerCase() === query);
        };
        
        // ? Filter From Remote Bookmarks
        const filteredBookmarks = ModalState.RemoteBookmarks.filter(bookmark => {
            return (
                bookmark.Name.toLowerCase().includes(query) ||
                (bookmark.Keywords ?? []).some((keyword) => keyword.toLowerCase().includes(query)) ||
                isExactMatch(bookmark.Name, bookmark.Keywords) ||
                bookmark.WebLink.toLowerCase().includes(query)
            );
        }).sort((a, b) => {
            // ? Exact match comparison
            const aIsExactMatch = isExactMatch(a.Name, a.Keywords);
            const bIsExactMatch = isExactMatch(b.Name, b.Keywords);

            if (aIsExactMatch && !bIsExactMatch) return -1;
            if (!aIsExactMatch && bIsExactMatch) return 1;

            // ? Starts with query comparison
            const aStartsWithQuery = a.Name.toLowerCase().startsWith(query);
            const bStartsWithQuery = b.Name.toLowerCase().startsWith(query);

            if (aStartsWithQuery && !bStartsWithQuery) return -1;
            if (!aStartsWithQuery && bStartsWithQuery) return 1;

            // ? Keyword match comparison
            const aKeywordMatch = a.Keywords?.some((keyword) => keyword.toLowerCase().includes(query));
            const bKeywordMatch = b.Keywords?.some((keyword) => keyword.toLowerCase().includes(query));

            if (aKeywordMatch && !bKeywordMatch) return -1;
            if (!aKeywordMatch && bKeywordMatch) return 1;

            // ? URL match comparison
            const aUrlMatch = a.WebLink.toLowerCase().includes(query);
            const bUrlMatch = b.WebLink.toLowerCase().includes(query);

            if (aUrlMatch && !bUrlMatch) return -1;
            if (!aUrlMatch && bUrlMatch) return 1;

            // ? Fallback to alphabetical sorting
            return a.Name.localeCompare(b.Name);
        });

        if (filteredBookmarks.length > 0) {
            setFilteredBookmarks(filteredBookmarks);
            return;
        }

        try {
            if (isLoading) return;
            setIsLoading(true);

            const existingIds = State.Bookmarks.map(bookmark => bookmark.BookmarkID);

            log("Admin Signatures from Marketplace", {
                isAdmin: ModalState.isAdmin,
                AdminSignature: ModalState.AdminSignature,
            })

            const requestBody = {
                _page: 1,
                _limit: '20',
                excludeID: existingIds,
                adminSignature: ModalState.isAdmin ? ModalState.AdminSignature : "undefined",
                query: query
            };

            const response = await Axios.post('/api/bookmarks', requestBody);
            const data = response.data.Data;

            if (response.data.Status === 1) {
                setError(null);

                setFilteredBookmarks(data.Bookmarks || []);

                // ? If not Avilable in Remote Bookmarks then Add it
                const newBookmarks = data.Bookmarks.filter((bookmark:any) => !ModalState.RemoteBookmarks.some(b => b.BookmarkID === bookmark.BookmarkID));

                if (newBookmarks.length > 0) {
                    setRemoteBookmarks([...ModalState.RemoteBookmarks, ...newBookmarks]);
                }
            } else {
                SetModalState(prev => ({
                    ...prev,
                    isMarketPlaceFetched: true,
                    hasMore: false
                }));
            }
        } catch (err) {
            console.error("Error fetching bookmarks:", err);
            setFilteredBookmarks([]);
            setError("Failed to fetch bookmarks");

            SetModalState(prev => ({
                ...prev,
                RemoteBookmarks: [],
                hasMore: false
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectBookmark = (bookmarkId: string | undefined) => {
        if (!bookmarkId) return;

        setSelectedBookmarks(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(bookmarkId)) {
                newSelected.delete(bookmarkId);
            } else {
                newSelected.add(bookmarkId);
            }
            return newSelected;
        });
    };

    const addSelectedBookmarks = () => {
        const bookmarksToAdd = ModalState.RemoteBookmarks.filter(
            bookmark => bookmark.BookmarkID && selectedBookmarks.has(bookmark.BookmarkID)
        );

        if (bookmarksToAdd.length > 0) {
            const updatedBookmarks = [...State.Bookmarks, ...bookmarksToAdd];

            const updatedFilteredBookmarks = [
                ...State.FilterBookmarks,
                ...bookmarksToAdd.filter(bookmark => {
                    const query = State.Query.toLowerCase();
                    if (!query) return true;

                    return (
                        bookmark.Name.toLowerCase().includes(query) ||
                        bookmark.WebLink.toLowerCase().includes(query) ||
                        bookmark.Description?.toLowerCase().includes(query) ||
                        bookmark.Keywords?.some(k => k.toLowerCase().includes(query))
                    );
                })
            ];

            Dispatch(prevState => ({
                ...prevState,
                Bookmarks: updatedBookmarks,
                FilterBookmarks: updatedFilteredBookmarks
            }));

            SetModalState(prev => ({
                ...prev,
                RemoteBookmarks: prev.RemoteBookmarks.filter(
                    b => !bookmarksToAdd.some(
                        added => added.BookmarkID === b.BookmarkID
                    )
                )
            }));

            setRemoteBookmarks(
                ModalState.RemoteBookmarks.filter(b => !bookmarksToAdd.some(
                    added => added.BookmarkID === b.BookmarkID
                ))
            );

            setSelectedBookmarks(new Set());
        }
    };

    React.useEffect(() => {
        if (!ModalState.isMarketPlaceFetched) {
            if (!ModalState.RemoteBookmarks.length) {
                setFilteredBookmarks([]);
                return;
            }
            setFilteredBookmarks(ModalState.RemoteBookmarks);
        }
    }, [
        ModalState.RemoteBookmarks
    ]);

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-2 justify-center items-center">
                <Typography variant="h1" className="font-bold text-6xl">
                    <LocalMall fontSize="inherit" />
                </Typography>
                <Typography variant="h4" className="font-bold text-lg">
                    Bookmark Marketplace
                </Typography>
                <Typography variant="body1" className="text-gray-500 text-sm">
                    Discover and add new bookmarks to your collection from our curated marketplace.
                </Typography>
            </div>

            <div className="sticky top-0 z-10 py-2 px-2 rounded-md border-2 border-gray-200 dark:border-gray-800 backdrop-blur-md flex flex-col" style={{
                background: "var(--background)",
            }}>
                <Input
                    fullWidth
                    placeholder="Search bookmarks by name, URL or keywords..."
                    startContent={<Search className="text-gray-500" />}
                    value={ModalState.MarketPlaceQuery}
                    onChange={handleSearchChange}
                    className="mb-4"
                />

                <div className="flex justify-between items-end mb-2">
                    <Typography variant="body2" className="text-gray-500">
                        {filteredBookmarks.length} bookmarks found
                    </Typography>

                    <Button
                        color="secondary"
                        variant={selectedBookmarks.size === 0 ? "light" : "shadow"}
                        startContent={<AddCircleOutline />}
                        disabled={selectedBookmarks.size === 0}
                        onPress={addSelectedBookmarks}
                    >
                        Add {selectedBookmarks.size}
                    </Button>
                </div>
            </div>

            {
                !isLoading && filteredBookmarks.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                        <CloudDownload className="text-gray-400 mb-2" sx={{ fontSize: 48 }} />
                        <Typography variant="h6" className="text-gray-700 dark:text-gray-300">
                            No bookmarks found
                            {
                                ModalState.isMarketPlaceFetched ?? "on Your Device"
                            }
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 mt-1">
                            {ModalState.MarketPlaceQuery ? "Try different search terms" : "Check back later or Type to Search"}
                        </Typography>
                        {/* {!ModalState.MarketPlaceQuery && (
                            <Button
                                variant="light"
                                color="primary"
                                className="mt-4"
                                onPress={() => {
                                    // setError(null);
                                    // setPage(1);
                                    // fetchBookmarks(1, true);
                                }}
                            >
                                Refresh
                            </Button>
                        )} */}
                    </div>
                )
            }

            {error ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                    <WarningAmber className="text-warning mb-2" sx={{ fontSize: 48 }} />
                    <Typography variant="h6">{error}</Typography>
                    {/* <Button
                        variant="light"
                        color="primary"
                        className="mt-4"
                        onPress={() => {
                            // setError(null);
                            // setPage(1);
                            // fetchBookmarks(1, true);
                        }}
                    >
                        Try Again
                    </Button> */}
                </div>
            ) : (
                <div
                    className="grid grid-cols-1 gap-2 lg:grid-cols-2"
                >
                    {filteredBookmarks.map((bookmark, index) => (
                        <Grid component="div" size={{ xs: 12, sm: 6, md: 6, lg: 4 }} key={bookmark.BookmarkID}>

                            <BookmarkItemMarketPlace
                                Data={bookmark}
                                isSelected={selectedBookmarks.has(bookmark.BookmarkID)}
                                isAdmin={ModalState.isAdmin}
                                toggleSelectBookmark={() => toggleSelectBookmark(bookmark.BookmarkID)}
                                style={{
                                    padding: "10px"
                                }}
                            />
                        </Grid>
                    ))}

                    {isLoading && (
                        <React.Fragment>
                            {[...Array(6)].map((_, i) => (
                                <Grid component="div" size={{ xs: 12, sm: 6, md: 6, lg: 4 }} key={`skeleton-${i}`}>
                                    <BookmarkItemSkeleton index={i} />
                                </Grid>
                            ))}
                        </React.Fragment>
                    )}

                </div>
            )}

            {/* {ModalState.hasMore && !isLoading && !error && filteredBookmarks.length === 0 && (
                <div
                    ref={endRef}
                    className="flex justify-center my-6 pb-4"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            )} */}

        </div>
    );
}

export default Marketplace;

