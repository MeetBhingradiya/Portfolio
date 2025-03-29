/**
 *  @FileID          app/Tools/page.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


"use client";

import React from "react";
import { toast } from 'react-toastify';
import { ResolveIcon } from "@Data/Tools";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import "@Styles/Tool.sass";
import {
    Add,
    Close,
    Delete,
    OpenInNew,
    Settings,
    Cloud,
    Book,
    Home,
    ScatterPlot,
    Search,
    AutoFixHigh,
    LocalMall,
    Warning
} from "@mui/icons-material";
import {
    Menu,
    MenuItem,
    MenuProps,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Tooltip
} from "@heroui/react";
import { styled, alpha } from '@mui/material/styles';
import {
    GridContextProvider,
    GridDropZone,
    GridItem,
    swap
} from "react-grid-dnd";
import 'react-toastify/dist/ReactToastify.css';
import SvgComponent from "@Components/SVGComponent";
import { useWindowCheck } from "@Hooks/useWindowCheck";
import { Axios } from "@Utils/Axios";
import { Config } from "@Config";
import { changeCase } from "@Utils/CaseChnage";
import SettingsModel from "./Settings";
import { log } from "@Utils";
import {
    DefualtBookmark,
    DefualtToolsState,
    DefualtToolsSuggestionsState,
    DefualtToolsModalData,
    IToolsSettingsTabs,
    DefualtBookmarkContextMenu,
    IBookmarkContextMenu,
    IToolsSuggestionsState,
    ILinkOpenTypes,
    DefualtBookmarkRequest
} from "./Settings/Types"
import type {
    IBookmark,
    IToolsModalData,
    IToolsState,
    IToolsSuggestion
} from "./Settings/Types"

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        padding: theme.spacing(1),
        marginTop: theme.spacing(1),
        minWidth: 150,
        background: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[900],
        color:
            theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0',
        },
        '& .MuiMenuItem-root': {
            borderRadius: 6,
            marginBottom: theme.spacing(1),
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5)
            },
            '&:hover': {
                border: '1px solid #636363',
            },
            '&:active': {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.selectedOpacity,
                ),
            },
            // ? Last Child No Margin at Bottom
            '&:last-child': {
                marginBottom: 0,
            },
        },
    },
}));

const StorageKey = "Tools";

const SearchEnginePresets = {
    google: `https://www.google.com/search?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    bing: `https://www.bing.com/search?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    duckduckgo: `https://duckduckgo.com/?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    brave: `https://search.brave.com/search?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    qwant: `https://www.qwant.com/?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    yahoo: `https://search.yahoo.com/search?p=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
}

function Tools() {
    const isClient = useWindowCheck();
    const longPressDuration = 500;

    // @ States
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [State, setState] = React.useState<IToolsState>(DefualtToolsState);
    const [ModalState, SetModalState] = React.useState<IToolsModalData>(DefualtToolsModalData);
    const [ContextMenu, setContextMenu] = React.useState<IBookmarkContextMenu>(DefualtBookmarkContextMenu);
    const [windowWidth, setWindowWidth] = React.useState<number>(isClient ? window.innerWidth : 0);
    const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);
    const [SuggestionsState, setSuggestionsState] = React.useState<IToolsSuggestionsState>(DefualtToolsSuggestionsState);


    // @ Functions

    const OpenLink = (url: string, OpenMethod?: ILinkOpenTypes) => {
        if (!OpenMethod) {
            OpenMethod = State.Preferences.OpenMethod;
        }

        if (OpenMethod === ILinkOpenTypes.NEW_TAB) {
            window.open(url, "_blank");
        } else if (OpenMethod === ILinkOpenTypes.CURRENT_TAB) {
            window.open(url, "_self");
        } else if (OpenMethod === ILinkOpenTypes.NEW_WINDOW) {
            window.open(url, "_blank", `width=${window.innerWidth},height=${window.innerHeight},resizable=0`);
        } else if (OpenMethod === ILinkOpenTypes.FULL_SCREEN) {
            window.open(url, "_blank", `width=${window.screen.width},height=${window.screen.height}`);
        }
    }

    const handleKeyPress = (e: KeyboardEvent | React.KeyboardEvent<HTMLDivElement>) => {
        log("Key Pressed", e.key);
        if (ModalState.isOpen) {
            return;
        }

        if (e.key === "Escape") {
            if (searchInputRef.current) {
                searchInputRef.current.blur();
            }
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if ((SuggestionsState.Index + 1) <= (SuggestionsState.Suggestions.length)) {
                setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                    return {
                        ...SuggestionsState,
                        Index: SuggestionsState.Index + 1,
                        QueryDisplay: SuggestionsState.Suggestions[SuggestionsState.Index + 1]?.Query ?? State.Query
                    }
                });
            } else {
                setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                    return {
                        ...SuggestionsState,
                        Index: 0,
                        QueryDisplay: State.Query
                    }
                });
            }
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            if ((SuggestionsState.Index - 1) >= 0) {
                setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                    return {
                        ...SuggestionsState,
                        Index: SuggestionsState.Index - 1,
                        QueryDisplay: SuggestionsState.Suggestions[SuggestionsState.Index - 1]?.Query ?? State.Query
                    }
                });
            } else {
                setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                    return {
                        ...SuggestionsState,
                        Index: SuggestionsState.Suggestions.length,
                        QueryDisplay: SuggestionsState.Suggestions[SuggestionsState.Suggestions.length - 1]?.Query ?? State.Query
                    }
                });
            }
        }

        if (e.key === "Escape") {
            if (searchInputRef.current) {
                searchInputRef.current.blur();
            }
        }

        if (e.key === "Backspace") {
            if (State.Query === "" && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }

        if (e.key === "Delete") {
            // ? Reset Query, Bookmarks & Suggestions
            if (State.Query !== "") {
                setState({
                    ...State,
                    FilterBookmarks: State.Bookmarks,
                    Query: ""
                });
                setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                    return {
                        ...SuggestionsState,
                        QueryDisplay: "",
                        Index: 0
                    }
                });
            }
        }

        if (e.key === " " && !ModalState.isOpen) {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }

        if (e.key === "Enter") {
            if (State.FilterBookmarks.length > 0 && State.Query.length > 0) {
                handleBookmarkClick(State.FilterBookmarks[0]);
                setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                    return {
                        ...SuggestionsState,
                        Index: 0,
                        QueryDisplay: State.Query
                    }
                });
                setState((State) => {
                    return {
                        ...State,
                        FilterBookmarks: State.Bookmarks,
                        Query: ""
                    }
                });
                return;
            } else {
                if (SuggestionsState.Index > 0 && SuggestionsState.Suggestions.length > 0) {
                    OpenLink(SearchEngineLinkBuilder(SuggestionsState.Suggestions[SuggestionsState.Index - 1].Query));
                } else if (State.FilterBookmarks.length > 0) {
                    handleBookmarkClick(State.FilterBookmarks[0]);
                } else {
                    OpenLink(SearchEngineLinkBuilder(State.Query));
                }

                setState({
                    ...State,
                    FilterBookmarks: State.Bookmarks,
                    Query: "",
                });
                setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                    return {
                        ...SuggestionsState,
                        Index: 0,
                        QueryDisplay: ""
                    }
                });
                return;
            }
        }

        const isAlphaNumericOrSymbol = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]$/.test(e.key);
        if (isAlphaNumericOrSymbol && !ModalState.isOpen) {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
                // if (State.Query === "") {
                //     setState((State) => {
                //         return {
                //             ...State,
                //             Query: e.key
                //         }
                //     });
                //     setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                //         return {
                //             ...SuggestionsState,
                //             QueryDisplay: e.key
                //         }
                //     });

                //     setTimeout(() => {
                //         if (searchInputRef.current) {
                //             const event = new Event('input', { bubbles: true });
                //             Object.defineProperty(event, 'target', { value: { value: e.key } });
                //             searchInputRef.current.dispatchEvent(event);
                //         }
                //     }, 0);
                // }
            }
        }
    };

    const onQueryChange = async (e: any) => {
        const query = e.target.value.toLowerCase();
        const OriginalQuery = e.target.value;

        const isExactMatch = (name: string, keywords: Array<string> = []): boolean => {
            return name.toLowerCase() === query || keywords.some((keyword) => keyword.toLowerCase() === query);
        };

        const filteredBookmarks = State.Bookmarks.filter((bookmark) => {
            return (
                bookmark.Name.toLowerCase().includes(query) ||
                (bookmark.Keywords ?? []).some((keyword) => keyword.toLowerCase().includes(query)) ||
                isExactMatch(bookmark.Name, bookmark.Keywords) ||
                bookmark.URL.toLowerCase().includes(query)
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
            const aUrlMatch = a.URL.toLowerCase().includes(query);
            const bUrlMatch = b.URL.toLowerCase().includes(query);

            if (aUrlMatch && !bUrlMatch) return -1;
            if (!aUrlMatch && bUrlMatch) return 1;

            // ? Fallback to alphabetical sorting
            return a.Name.localeCompare(b.Name);
        });

        setState({
            ...State,
            Query: OriginalQuery,
            FilterBookmarks: filteredBookmarks
        });

        if (query.length > 0) {
            // ? Make Delay for Debounce
            setTimeout(() => {
                FetchSuggestions();
            }, 1000);
        } else {
            setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
                return {
                    ...SuggestionsState,
                    Suggestions: []
                }
            });
        }
    };

    function onGridChange(
        sourceId: any,
        sourceIndex: any,
        targetIndex: any,
        targetId: any
    ) {
        const nextState = swap(State.FilterBookmarks, sourceIndex, targetIndex);
        if (State.Query !== "") {
            // ? No Future Implementations
            toast.error("Cannot move bookmarks while searching.");


            // ? Future Implementations
            // let LocalBookmarks = State.Bookmarks;

            // ? Add the Bookmarks to the Local Bookmarks
            // LocalBookmarks.push(...nextState);

            // ? Remove the same bookmarks
            // LocalBookmarks = LocalBookmarks.filter((bookmark) => !nextState.some((b) => b.id === bookmark.id));

            // ? Set the Local Bookmarks to the State
            // setState({
            //     ...State,
            //     Bookmarks: nextState,
            //     FilterBookmarks: LocalBookmarks,
            // });

            return;
        }

        setState({
            ...State,
            Bookmarks: nextState,
            FilterBookmarks: nextState,
        });
        return;
    }

    const abortControllerRef = React.useRef<AbortController | null>(null);
    const FetchSuggestions = async () => {
        let ProcessedSuggestions: Array<IToolsSuggestion> = [];

        if (State.FilterBookmarks.length === 0) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            let API = "https://api.suggestions.victr.me/";
            let _API = new URL(API);
            _API.searchParams.append("q", State.Query);
            _API.searchParams.append("l", State.Preferences.Locale);
            _API.searchParams.append("with", State.Preferences.SearchEngine);

            try {
                const response = (await Axios.post(
                    "/api/cors",
                    {
                        body: {
                            endpoint: _API,
                            method: "GET",
                            body: null,
                            headers: {},
                        },
                        method: "POST",
                    },
                    { signal: controller.signal }
                )).data;

                const Suggestions = response.data

                if (!Suggestions) {
                    return;
                }

                ProcessedSuggestions = Suggestions.map((suggestion: any) => {
                    return {
                        Query: suggestion.text,
                        Thumbnail: suggestion.image,
                        Description: suggestion.desc,
                    };
                });
            } catch (error: any) {
                if (error.name === "CanceledError") {
                    log("Request Aborted");
                }
            }
        }

        setSuggestionsState((SuggestionsState: IToolsSuggestionsState | any) => {
            return {
                ...SuggestionsState,
                Suggestions: ProcessedSuggestions,
                QueryDisplay: State.Query
            }
        });
    };

    function handleContextMenu(e: React.MouseEvent<HTMLDivElement>, ID: string) {
        e.preventDefault();
        setContextMenu({
            mouseX: e.clientX + 2,
            mouseY: e.clientY - 6,
            ItemID: ID
        });
    }

    function DeleteBookmark(ID: string) {
        const bookmarkIndex = State.Bookmarks.findIndex((bookmark) => bookmark.BookmarkID === ID);
        if (bookmarkIndex === -1) {
            return;
        }

        const newBookmarks = [...State.Bookmarks];
        newBookmarks.splice(bookmarkIndex, 1);

        setState({
            ...State,
            Bookmarks: newBookmarks,
            FilterBookmarks: newBookmarks,
        });
    }

    function CloseModel() {
        SetModalState({
            ...ModalState,
            isOpen: false,
            type: IToolsSettingsTabs.Preferences,
            bookmark: DefualtBookmark,
            adminBookmark: DefualtBookmark,
            bookmarkRequest: DefualtBookmarkRequest,
        });
    }

    function OpenEditModel(ID: string) {
        const bookmark = State.Bookmarks.find((bookmark) => bookmark.BookmarkID === ID);
        if (bookmark) {
            SetModalState({
                ...ModalState,
                type: IToolsSettingsTabs.Edit,
                isOpen: true,
                bookmark: bookmark,
            });
        }
    }

    async function getServerBookmarks() {
        try {
            const response = await Axios("/api/bookmarks");

            const ServerBookmarks = response.data.Data;
            if (!ServerBookmarks) {
                return;
            }

            let ProcessedBookmarks = ServerBookmarks.map((bookmark: any) => {
                return {
                    id: bookmark.BookmarkID,
                    name: bookmark.name,
                    url: bookmark.url,
                    icon: bookmark.icon,
                    keywords: bookmark.keywords,
                    isSVGSrc: bookmark.isSVGSrc,
                    SVGStyles: bookmark.SVGStyles,
                    description: bookmark.description,
                    size: bookmark.size,
                    isServer: true,
                }
            })

            let RemoveDublicatesfromLocal = State.Bookmarks.filter((localBookmark) => {
                return !ProcessedBookmarks.some((serverBookmark: any) => serverBookmark.URL === localBookmark.URL);
            });

            ProcessedBookmarks = ProcessedBookmarks.sort(() => Math.random() - 0.5);


            setState({
                ...State,
                Bookmarks: Array.from(new Set([...RemoveDublicatesfromLocal, ...ProcessedBookmarks])) as any,
                FilterBookmarks: Array.from(new Set([...RemoveDublicatesfromLocal, ...ProcessedBookmarks])) as any,
            })
        } catch (error: any) {
            toast.error(`Cloud Sync : ${error.Message}`);
        }
    }

    const handleResize = () => {
        setWindowWidth(window.innerWidth);
    };

    function SearchEngineLinkBuilder(query: string) {
        type SearchEngineKey = keyof typeof SearchEnginePresets;

        const engineKey = (State.Preferences.SearchEngine as string) as SearchEngineKey;
        let SearchEngine = SearchEnginePresets[engineKey] ?? SearchEnginePresets.google;

        return SearchEngine.replace("@Query", query);
    }

    const isMobileDevice = () => {
        if (typeof navigator === 'undefined') return false;
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    const canOpenWindowsApp = (windowsAppLink: string | undefined) => {
        if (!windowsAppLink) return false;
        return windowsAppLink.trim() !== "" &&
            navigator.userAgent.indexOf("Windows") !== -1 &&
            State.Preferences.priorityWindowsApp;
    };

    const canOpenAndroidApp = (androidAppLink: string | undefined) => {
        if (!androidAppLink) return false;
        return androidAppLink.trim() !== "" &&
            /Android/i.test(navigator.userAgent) &&
            State.Preferences.priorityAndroidapp;
    };

    const openAppLink = (appLink: string | undefined, isWindowsApp: boolean = false) => {
        if (!appLink || appLink.trim() === "") return;

        try {
            window.location.href = appLink;
        } catch (error) {
            log("Failed to open app:", error);
            const bookmark = State.Bookmarks.find((b) =>
                isWindowsApp ? b.Windows === appLink : b.Android === appLink
            );
            if (bookmark) {
                window.location.href = bookmark.URL;
            }
        }
    };

    const handleBookmarkClick = (bookmark: IBookmark) => {
        if (canOpenWindowsApp(bookmark.Windows)) {
            openAppLink(bookmark.Windows, true);
            return;
        }

        if (canOpenAndroidApp(bookmark.Android)) {
            openAppLink(bookmark.Android);
            return;
        }

        OpenLink(bookmark.URL);
    };

    // @Updates
    React.useEffect(() => {
        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, [
        SuggestionsState.Index,
        ModalState.isOpen,
        // State.Query,
        // State.FilterBookmarks,
        // SuggestionsState.Suggestions
    ]);

    // ? Initial Run & Window Resize, Focus on Search Input Listeners
    React.useEffect(() => {

        // ? Only Run at First Load
        if (State.isFirstRun) {
            handleResize();

            // ? Focus on Search Input
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }

            // ? get Settings & Bookmarks from Local Storage
            const data = localStorage.getItem(StorageKey);

            // ? Step 1 if No Data Found
            if (data === null) {
                setState({
                    ...State,
                    Preferences: {
                        ...State.Preferences,
                    },
                    isFirstRun: false,
                    FilterBookmarks: State.Bookmarks,
                });
            } else {
                let StorageData = JSON.parse(data as string);
                setState({
                    ...State,
                    Preferences: {
                        ...StorageData.Preferences,
                        isFirstRun: false
                    },
                    Bookmarks: StorageData.Booksmarks.map((bookmark: any) => {
                        return {
                            ...bookmark,
                            isServer: false,
                        }
                    }),
                    FilterBookmarks: StorageData.Booksmarks.map((bookmark: any) => {
                        return {
                            ...bookmark,
                            isServer: false,
                        }
                    })
                })
            }
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // ? Cloud Sync After the First Run
    React.useEffect(() => {
        if (!State.isFirstRun) {
            if (State.Preferences.CloudSync) {
                getServerBookmarks();
            }
        }
    }, [State.isFirstRun]);

    React.useEffect(() => {
        localStorage.setItem(StorageKey, JSON.stringify({
            Booksmarks: State.Bookmarks,
            Preferences: {
                OpenMethod: State.Preferences.OpenMethod,
                SearchEngine: State.Preferences.SearchEngine,
                CloudSync: State.Preferences.CloudSync,
                Locale: State.Preferences.Locale,
                priorityAndroidapp: State.Preferences.priorityAndroidapp,
                priorityWindowsApp: State.Preferences.priorityWindowsApp,
            },
        }));
    }, [
        State.Bookmarks,
        State.Preferences.CloudSync,
        State.Preferences.OpenMethod,
        State.Preferences.SearchEngine,
        State.Preferences.Locale,
        State.Preferences.priorityAndroidapp,
        State.Preferences.priorityWindowsApp,
    ]);

    const boxesPerRow = Math.max(Math.floor(windowWidth / 200), 1);
    const rows = Math.ceil(State.FilterBookmarks.length / boxesPerRow);
    const footerHeight = 100;
    const gridHeight = rows * 150 + footerHeight;

    // @Component
    return (
        <div
            className="Tool"
        >

            {/* Search Warp */}
            <div
                className="SearchWarp"
            >
                {/* Suggestions */}
                {
                    State.FilterBookmarks.length === 0 && State.Bookmarks.length <= 0 && (
                        <div className="Suggestions" onClick={() => {
                            SetModalState({
                                ...ModalState,
                                isOpen: true,
                                type: IToolsSettingsTabs.Marketplace,
                            });
                        }}>
                            <div className={`Suggestion`}>
                                <p className="Thumbnail">
                                    <Warning />
                                </p>
                                <div className="QueryWarp">
                                    <h2 className="Title">{changeCase.upperFirst("Add Bookmarks from Marketplace to Enable Query Suggestions")}</h2>
                                </div>
                            </div>
                        </div>
                    )
                }
                {
                    (State.FilterBookmarks.length === 0 && State.Bookmarks.length >= 1) && (
                        <div className="Suggestions">
                            {
                                SuggestionsState.Suggestions.map((item: IToolsSuggestion, index: number) => (
                                    <div
                                        key={index}
                                        className={`Suggestion ${SuggestionsState.Index === (index + 1) ? "SuggestionActive" : ""}`}
                                        onClick={() => {
                                            OpenLink(SearchEngineLinkBuilder(item.Query));
                                        }}
                                    >
                                        {
                                            item?.Thumbnail && (
                                                <Image
                                                    className="Thumbnail"
                                                    width={64}
                                                    height={64}
                                                    src={item?.Thumbnail}
                                                    alt="Thumbnail"
                                                />
                                            )
                                        }
                                        {
                                            !item?.Thumbnail && (
                                                <p className="Thumbnail">
                                                    <Search />
                                                </p>
                                            )
                                        }
                                        <div className="QueryWarp">
                                            <h2 className="Title">{changeCase.upperFirst(item?.Query)}</h2>
                                            <p className="Description">{item?.Description}</p>
                                        </div>
                                    </div>
                                ))
                            }

                            {
                                SuggestionsState.Suggestions.length === 0 && (
                                    <div
                                        className="Suggestion"
                                    >
                                        <p className="Thumbnail Loading">
                                            <ScatterPlot />
                                        </p>
                                        <h2 className="Title">Loading...</h2>
                                    </div>)
                            }
                        </div>
                    )
                }
                <div className="flex flex-row gap-2 CommandRow">
                    <Tooltip content="Go Home" placement="top">
                        <motion.div
                            className="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                            onClick={() => {
                                window.location.href = "/Home";
                            }}
                        >
                            <Home />
                        </motion.div>
                    </Tooltip>
                    <motion.div
                        className="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                        onClick={(e) => {
                            SetModalState({
                                ...ModalState,
                                isOpen: true,
                                type: IToolsSettingsTabs.Create,
                            });
                        }}
                    >
                        <Add />
                    </motion.div>
                    <motion.input
                        id="search"
                        type="text"
                        placeholder="🔍 Search"
                        tabIndex={1}
                        value={SuggestionsState.QueryDisplay}
                        onChange={onQueryChange}
                        className="search"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                        ref={searchInputRef}
                        autoComplete="off"
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                            window.removeEventListener("keydown", handleKeyPress);
                            if (searchInputRef.current) {
                                searchInputRef.current.style.width = "55%";
                            }
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            window.addEventListener("keydown", handleKeyPress);
                            if (searchInputRef.current) {
                                searchInputRef.current.style.width = "15%";
                            }
                        }}
                        onMouseEnter={() => {
                            if (searchInputRef.current) {
                                searchInputRef.current.focus();
                            }
                        }}
                        onMouseLeave={() => {
                            if (searchInputRef.current) {
                                searchInputRef.current.blur();
                            }
                        }}
                    />
                    <AnimatePresence>
                        {
                            State.Query !== "" && (
                                <motion.div
                                    className="button"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: 0.2, duration: 0.2, ease: "easeInOut" }}
                                    onClick={(e) => {
                                        setState({
                                            ...State,
                                            FilterBookmarks: State.Bookmarks,
                                            Query: "",
                                        })
                                        setSuggestionsState({
                                            ...SuggestionsState,
                                            QueryDisplay: "",
                                            Index: 0,
                                        })
                                    }}
                                >
                                    <Close />
                                </motion.div>
                            )
                        }
                    </AnimatePresence>
                    <motion.div
                        className="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                        onClick={(e) => {
                            SetModalState({
                                ...ModalState,
                                isOpen: true,
                                type: IToolsSettingsTabs.Preferences,
                            });
                        }}
                    >
                        <Settings />
                    </motion.div>
                    <motion.div
                        className="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                        onClick={(e) => {
                            SetModalState({
                                ...ModalState,
                                isOpen: true,
                                type: IToolsSettingsTabs.Marketplace,
                            });
                        }}
                    >
                        <LocalMall />
                    </motion.div>
                </div>
            </div>

            <GridContextProvider onChange={onGridChange}>
                <GridDropZone
                    id="items"
                    boxesPerRow={boxesPerRow}
                    rowHeight={150}
                    style={{
                        height: `${gridHeight}px`,
                        overflow: 'visible',
                    }}
                >
                    {State.FilterBookmarks.map((item, index) => (
                        <GridItem key={item.BookmarkID} style={{
                            zIndex: 0,
                        }}>
                            <div
                                className="bookmark"
                                onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                                    if (isMobileDevice()) return;

                                    e.currentTarget.dataset.dragStartX = e.clientX.toString();
                                    e.currentTarget.dataset.dragStartY = e.clientY.toString();

                                    if (State.Query.length > 0) {
                                        e.currentTarget.style.cursor = "not-allowed";
                                    } else {
                                        e.currentTarget.style.cursor = "grabbing";
                                    }
                                }}
                                onMouseUp={(e: React.MouseEvent<HTMLDivElement>) => {
                                    if (isMobileDevice()) return;

                                    if (e.button === 2) {
                                        return;
                                    }

                                    const dragStartX = parseInt(`${e.currentTarget.dataset.dragStartX}`, 10);
                                    const dragStartY = parseInt(`${e.currentTarget.dataset.dragStartY}`, 10);
                                    const dragDistance = Math.sqrt(
                                        Math.pow(e.clientX - dragStartX, 2) + Math.pow(e.clientY - dragStartY, 2)
                                    );

                                    if (dragDistance < 5) {
                                        handleBookmarkClick(item);
                                    }

                                    e.currentTarget.style.cursor = "pointer";
                                }}
                                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                                    if (isMobileDevice()) {
                                        e.preventDefault();
                                        return;
                                    }

                                    handleContextMenu(e, item?.BookmarkID ?? "");
                                }}
                                onTouchStart={(e) => {
                                    if (!isMobileDevice()) return;

                                    const timer = setTimeout(() => {
                                        const touch = e.touches[0];
                                        handleContextMenu(
                                            {
                                                clientX: touch.clientX,
                                                clientY: touch.clientY,
                                                preventDefault: () => { }
                                            } as React.MouseEvent<HTMLDivElement>,
                                            item?.BookmarkID ?? ""
                                        );
                                    }, longPressDuration);

                                    setLongPressTimer(timer);
                                }}
                                onTouchEnd={() => {
                                    if (!isMobileDevice()) return;

                                    if (longPressTimer) {
                                        clearTimeout(longPressTimer);
                                        setLongPressTimer(null);
                                    }

                                    if (!ContextMenu) {
                                        handleBookmarkClick(item);
                                    }
                                }}
                                onTouchMove={() => {
                                    if (!isMobileDevice()) return;

                                    if (longPressTimer) {
                                        clearTimeout(longPressTimer);
                                        setLongPressTimer(null);
                                    }
                                }}
                            >
                                {item.Icon && (
                                    <div className="Icon">
                                        {
                                            item.isSVG && (
                                                <SvgComponent
                                                    _class="SVGComponent"
                                                    svgString={item.Icon}
                                                    style={{
                                                        borderRadius: "15px",
                                                        userSelect: "none",
                                                        MozWindowDragging: "no-drag",
                                                        width: "64px",
                                                        height: "64px",
                                                        color: item.SVGStyles?.fill ?? "black",
                                                    }} />
                                            )
                                        }
                                        {
                                            !item.isSVG && (<Image
                                                src={ResolveIcon(item)}
                                                alt={item.Name}
                                                width={64}
                                                height={64}
                                                priority
                                                style={{
                                                    borderRadius: "15px",
                                                    userSelect: "none",
                                                    MozWindowDragging: "no-drag",
                                                }}
                                                onDragStart={(e) => e.preventDefault()}
                                            />)
                                        }
                                    </div>
                                )}
                                <h2 className="bookmarkTitle">{item.Name}</h2>
                                {
                                    item.isServer && (
                                        <div className="ServerIcon">
                                            <Cloud />
                                        </div>
                                    )
                                }
                            </div>
                        </GridItem>
                    ))}

                    {
                        (State.FilterBookmarks.length === 0 && State.Bookmarks.length > 0) && (
                            <GridItem className="absolute top-0 bottom-0 left-0 right-0 w-full h-full flex flex-row gap-1 select-none cursor-not-allowed">
                                <Book />
                                <h2>Bookmarks not Found</h2>
                            </GridItem>
                        )
                    }

                </GridDropZone>
            </GridContextProvider>

            {/* Context Menu */}
            <StyledMenu
                open={ContextMenu !== null}
                onClose={() => setContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={
                    ContextMenu !== null
                        ? { top: ContextMenu.mouseY, left: ContextMenu.mouseX }
                        : undefined
                }
            >
                {
                    ContextMenu && (() => {
                        const bookmark = State.Bookmarks.find((b) => b.BookmarkID === ContextMenu?.ItemID);
                        return (
                            <div>
                                {bookmark?.Windows && bookmark.Windows.trim() !== "" && navigator.userAgent.indexOf("Windows") !== -1 && (
                                    <MenuItem
                                        onClick={() => {
                                            openAppLink(bookmark.Windows || "", true);
                                            setContextMenu(null);
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Image
                                                src="https://img.icons8.com/fluency/128/windows-10.png"
                                                alt="Windows"
                                                width={24}
                                                height={24}
                                            />
                                        </ListItemIcon>
                                        <ListItemText>
                                            Open in Windows
                                        </ListItemText>
                                    </MenuItem>
                                )}

                                {bookmark?.Android && bookmark.Android.trim() !== "" && /Android/i.test(navigator.userAgent) && (
                                    <MenuItem
                                        onClick={() => {
                                            openAppLink(bookmark.Android || "");
                                            setContextMenu(null);
                                        }}
                                    >
                                        <ListItemIcon>
                                            <Image
                                                src="https://img.icons8.com/fluency/128/android-os.png"
                                                alt="Android"
                                                width={24}
                                                height={24}
                                            />
                                        </ListItemIcon>
                                        <ListItemText>
                                            Open in Android
                                        </ListItemText>
                                    </MenuItem>
                                )}

                                <MenuItem
                                    onClick={() => {
                                        OpenLink(bookmark?.URL ?? "");
                                        setContextMenu(null);
                                    }}
                                >
                                    <ListItemIcon>
                                        <OpenInNew />
                                    </ListItemIcon>
                                    <ListItemText>
                                        Open in New Tab
                                    </ListItemText>
                                </MenuItem>

                                <MenuItem
                                    onClick={() => {
                                        OpenLink(bookmark?.URL ?? "");
                                        setContextMenu(null);
                                    }}
                                >
                                    <ListItemIcon>
                                        <Image
                                            src="https://img.icons8.com/fluency/128/new-window.png"
                                            alt="New Window"
                                            width={24}
                                            height={24}
                                        />
                                    </ListItemIcon>
                                    <ListItemText>
                                        Open in New Window
                                    </ListItemText>
                                </MenuItem>

                                <MenuItem
                                    onClick={() => {
                                        setContextMenu(null);
                                        OpenEditModel(ContextMenu?.ItemID ?? "");
                                    }}
                                >
                                    <ListItemIcon>
                                        <AutoFixHigh />
                                    </ListItemIcon>
                                    <ListItemText>
                                        Edit
                                    </ListItemText>
                                </MenuItem>

                                <MenuItem
                                    onClick={() => {
                                        setContextMenu(null);
                                        DeleteBookmark(ContextMenu?.ItemID ?? "");
                                    }}
                                    style={{ color: "red" }}
                                >
                                    <ListItemIcon color='error'>
                                        <Delete style={{ color: "red" }} />
                                    </ListItemIcon>
                                    <ListItemText>
                                        Delete
                                    </ListItemText>
                                </MenuItem>
                            </div>
                        );
                    })()
                }
            </StyledMenu>

            <SettingsModel
                State={State}
                Dispatch={setState}
                ModalState={ModalState}
                SetModalState={SetModalState}
            />
        </div>
    );
}

export default Tools;