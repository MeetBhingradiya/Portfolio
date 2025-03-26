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
    Divider,
    Button,
    Skeleton
} from "@heroui/react";
import {
    Box,
    CardContent,
    Typography,
    Grid2 as Grid
} from "@mui/material";
import { motion } from "framer-motion";
import {
    Search,
    AddCircleOutline,
    WarningAmber,
    CloudDownload,
    CheckCircleOutline,
    BookmarkOutlined,
    CheckBox,
    CheckBoxOutlineBlank,
    LocalMall
} from "@mui/icons-material";
import { Axios } from "@Utils/Axios";
import { useInView } from "react-intersection-observer";
import { FixedSizeList as List } from "react-window";
import { toast } from "react-toastify";

const MotionCard = motion.create(Card);
interface MarketplaceProps {
    ModalState: IToolsModalData;
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>;
    State: IToolsState;
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>;
}

function Marketplace({ ModalState, SetModalState, State, Dispatch }: MarketplaceProps) {
    // ? Optional
    // const prefersReducedMotion = useReducedMotion();
    const { ref: endRef, inView: endIsVisible } = useInView({ threshold: 0.1, rootMargin: "300px" });

    const [filteredBookmarks, setFilteredBookmarks] = React.useState<IBookmark[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [page, setPage] = React.useState(1);
    const [selectedBookmarks, setSelectedBookmarks] = React.useState<Set<string>>(new Set());
    const [loadingTriggered, setLoadingTriggered] = React.useState(false);

    const existingBookmarkIds = React.useMemo(() => {
        return new Set(State.Bookmarks.map(bookmark => bookmark.BookmarkID));
    }, [State.Bookmarks]);

    function setRemoteBookmarks(bookmarks: IBookmark[]) {
        SetModalState(prev => ({
            ...prev,
            RemoteBookmarks: bookmarks
        }));
    }


    const fetchBookmarks = React.useCallback(async (pageNum: number = 1, isNewSearch: boolean = false) => {
        try {
            if (isLoading) return;

            setIsLoading(true);

            const existingIds = State.Bookmarks.map(bookmark => bookmark.BookmarkID);

            const requestBody = {
                page: pageNum.toString(),
                limit: '10',
                existingIds: existingIds,
                adminSignature: ModalState.isAdmin ? ModalState.AdminSignature : undefined
            };

            const response = await Axios.post('/api/bookmarks', requestBody);
            const data = response.data;

            if (data.Status === 1) {
                let newBookmarks = data.Data || [];

                if (newBookmarks.length === 0) {
                    SetModalState(prev => ({
                        ...prev,
                        hasMore: false
                    }));
                    setIsLoading(false);
                    return;
                }

                let newUniqueBookmarksAdded = 0;

                if (isNewSearch) {
                    setRemoteBookmarks(newBookmarks);
                    setFilteredBookmarks(newBookmarks);
                    newUniqueBookmarksAdded = newBookmarks.length;
                } else {
                    const existingIds = new Set(ModalState.RemoteBookmarks.map(b => b.BookmarkID));
                    const uniqueNewBookmarks = newBookmarks.filter((b: IBookmark) => !existingIds.has(b.BookmarkID));

                    newUniqueBookmarksAdded = uniqueNewBookmarks.length;
                    console.log(`Received ${newBookmarks.length} bookmarks, ${uniqueNewBookmarks.length} are unique`);

                    if (uniqueNewBookmarks.length > 0) {
                        const updatedBookmarks = [...ModalState.RemoteBookmarks, ...uniqueNewBookmarks];
                        setRemoteBookmarks(updatedBookmarks);

                        if (ModalState.MarketPlaceQuery.trim()) {
                            const query = ModalState.MarketPlaceQuery.toLowerCase();
                            const filtered = updatedBookmarks.filter(bookmark => {
                                return (
                                    bookmark.Name.toLowerCase().includes(query) ||
                                    bookmark.URL.toLowerCase().includes(query) ||
                                    bookmark.Description?.toLowerCase().includes(query) ||
                                    bookmark.Keywords?.some((keyword: string) =>
                                        keyword.toLowerCase().includes(query)
                                    )
                                );
                            });
                            setFilteredBookmarks(filtered);
                        } else {
                            setFilteredBookmarks(updatedBookmarks);
                        }
                    }
                }

                const shouldContinuePagination =
                    data.Pagination?.hasMore === true &&
                    newUniqueBookmarksAdded > 0 &&
                    pageNum < 100;

                console.log(`Setting hasMore to ${shouldContinuePagination}, pageNum: ${pageNum}`);
                SetModalState(prev => ({
                    ...prev,
                    hasMore: shouldContinuePagination
                }));

                if (isNewSearch || newUniqueBookmarksAdded > 0) {
                    SetModalState(prev => ({
                        ...prev,
                        RemoteBookmarks: isNewSearch ? data.Data : [
                            ...prev.RemoteBookmarks.filter(b =>
                                !newBookmarks.some((nb: IBookmark) => nb.BookmarkID === b.BookmarkID)
                            ),
                            ...newBookmarks
                        ]
                    }));
                }
            } else {
                console.log('API returned Status 0, no bookmarks found');
                setFilteredBookmarks([]);

                SetModalState(prev => ({
                    ...prev,
                    isMarketPlaceFetched: true,
                    RemoteBookmarks: [],
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
    }, [
        State.Bookmarks,
        ModalState.isAdmin,
        ModalState.AdminSignature,
        isLoading,
        ModalState.MarketPlaceQuery,
        ModalState.RemoteBookmarks,
        SetModalState,
        ModalState.hasMore,
        page
    ]);

    const loadMoreBookmarks = React.useCallback(() => {
        if (!isLoading && ModalState.hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchBookmarks(nextPage);
        }
    }, [isLoading, ModalState.hasMore, page, fetchBookmarks]);

    React.useEffect(() => {
        if (endIsVisible && ModalState.hasMore && !isLoading && !loadingTriggered) {
            console.log("End is visible, triggering load more");
            setLoadingTriggered(true);
            loadMoreBookmarks();
        }

        if (!endIsVisible) {
            setLoadingTriggered(false);
        }
    }, [
        endIsVisible,
        ModalState.hasMore,
        isLoading,
        loadMoreBookmarks
    ]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {

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

        const query = Query.toLowerCase();
        const filtered = ModalState.RemoteBookmarks.filter(bookmark => {
            return (
                bookmark.Name.toLowerCase().includes(query) ||
                bookmark.URL.toLowerCase().includes(query) ||
                bookmark.Description?.toLowerCase().includes(query) ||
                bookmark.Keywords?.some(keyword =>
                    keyword.toLowerCase().includes(query)
                )
            );
        });

        setFilteredBookmarks(filtered);
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
                        bookmark.URL.toLowerCase().includes(query) ||
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
        if (ModalState.type === IToolsSettingsTabs.Marketplace && !ModalState.isMarketPlaceFetched) {
            setError(null);
            setPage(1);
            fetchBookmarks(1, true);
        }
    }, [
        ModalState.type,
        ModalState.isMarketPlaceFetched
    ]);

    const renderBookmarkCard = (bookmark: IBookmark, index: number = 0, style?: React.CSSProperties) => {
        const isSelected = bookmark.BookmarkID ? selectedBookmarks.has(bookmark.BookmarkID) : false;
        const isAlreadyAdded = bookmark.BookmarkID ? existingBookmarkIds.has(bookmark.BookmarkID) : false;

        return (
            <div
                key={bookmark.BookmarkID}
                className="w-full h-full"
                style={style}
            >
                <MotionCard
                    className={`w-full h-full shadow-sm ${isSelected ? 'border-primary-500 border-2' : 'border border-gray-200 dark:border-gray-700'}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.05,
                        ease: "easeOut"
                    }}
                    whileHover={{
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        outline: "2px solid var(--accent-color)"
                    }}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {bookmark.Icon && bookmark.isSVG ? (
                                        <div
                                            className="w-6 h-6"
                                            dangerouslySetInnerHTML={{
                                                __html: bookmark.Icon
                                            }}
                                            style={{
                                                color: bookmark.SVGStyles?.fill || '#000000',
                                                fill: bookmark.SVGStyles?.fill || '#000000'
                                            }}
                                        />
                                    ) : bookmark.Icon ? (
                                        <img
                                            src={bookmark.Icon}
                                            alt={bookmark.Name}
                                            className="w-6 h-6 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://img.icons8.com/fluency/48/bookmark-ribbon.png";
                                            }}
                                        />
                                    ) : (
                                        <BookmarkOutlined className="w-6 h-6 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <Typography variant="h6" className="font-semibold text-base">
                                        {bookmark.Name || "Unnamed Bookmark"}
                                    </Typography>
                                    <Typography variant="body2" className="text-gray-500 text-xs truncate max-w-[200px]">
                                        {bookmark.URL || "No URL provided"}
                                    </Typography>
                                </div>
                            </div>

                            <div>
                                {isAlreadyAdded ? (
                                    <Button
                                        variant="light"
                                        color="success"
                                        isDisabled
                                        startContent={<CheckCircleOutline />}
                                        size="sm"
                                    >
                                        Added
                                    </Button>
                                ) : (
                                    <Button
                                        variant={isSelected ? "solid" : "light"}
                                        color="primary"
                                        isIconOnly
                                        size="sm"
                                        onPress={() => toggleSelectBookmark(bookmark.BookmarkID)}
                                    >
                                        {isSelected ? <CheckBox /> : <CheckBoxOutlineBlank />}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {bookmark.Description && (
                            <Typography variant="body2" className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {bookmark.Description}
                            </Typography>
                        )}

                        {bookmark.Keywords && bookmark.Keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {bookmark.Keywords.slice(0, 3).map((keyword, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                                {bookmark.Keywords.length > 3 && (
                                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                                        +{bookmark.Keywords.length - 3}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                            <div className="flex gap-2">
                                {bookmark.Android && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-gray-600 dark:text-gray-300">Android</span>
                                )}
                                {bookmark.Windows && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 text-gray-600 dark:text-gray-300">Windows</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </MotionCard>
            </div>
        );
    };

    const renderSkeletonCard = (index: number) => (
        <MotionCard
            className="w-full h-full border border-gray-200 dark:border-gray-700 shadow-sm"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.2,
                delay: Math.min(index * 0.03, 0.2),
                ease: "easeOut"
            }}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-md" />
                        <div className="flex flex-col gap-1">
                            <Skeleton className="w-32 h-5 rounded-md" />
                            <Skeleton className="w-40 h-3 rounded-md" />
                        </div>
                    </div>
                    <Skeleton className="w-10 h-8 rounded-md" />
                </div>
                <Skeleton className="w-full h-10 mt-3 rounded-md" />
                <div className="flex gap-2 mt-3">
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                </div>
            </CardContent>
        </MotionCard>
    );

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
                                    setError(null);
                                    setPage(1);
                                    fetchBookmarks(1, true);
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
                    <Button
                        variant="light"
                        color="primary"
                        className="mt-4"
                        onPress={() => {
                            setError(null);
                            setPage(1);
                            fetchBookmarks(1, true);
                        }}
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <div
                    className="grid grid-cols-1 gap-2 lg:grid-cols-2"
                >
                    {filteredBookmarks.map((bookmark, index) => (
                        <Grid component="div" size={{ xs: 12, sm: 6, md: 6, lg: 4 }} key={bookmark.BookmarkID}>
                            {renderBookmarkCard(
                                bookmark,
                                index
                            )}
                        </Grid>
                    ))}

                    {isLoading && (
                        <React.Fragment>
                            {[...Array(6)].map((_, i) => (
                                <Grid component="div" size={{ xs: 12, sm: 6, md: 6, lg: 4 }} key={`skeleton-${i}`}>
                                    {renderSkeletonCard(i)}
                                </Grid>
                            ))}
                        </React.Fragment>
                    )}

                </div>
            )}

            {ModalState.hasMore && !isLoading && !error && filteredBookmarks.length === 0 && (
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
            )}

        </div>
    );
}

export default Marketplace;

