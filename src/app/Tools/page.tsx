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
import { ISearchEngine, ILocale, ModelType } from "@Types/Tools";
import type { IBookmark, IState, ISuggestion } from "@Types/Tools";
import { ToastContainer, toast } from 'react-toastify';
import { BookmarksDB, ResolveIcon } from "@Data/Tools";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { v4 as uuidv4 } from 'uuid';
import "@Styles/Tool.sass";
import {
    Add,
    Close,
    Delete,
    Edit,
    Save,
    OpenInNew,
    Settings,
    Cloud,
    Restore,
    Book,
    Bookmark,
    Home,
    Circle,
    ScatterPlot,
    Search,
    AutoFixHigh,
    LocalMall,
    LocalMallOutlined,
    SettingsOutlined,
    AddOutlined,
    HomeOutlined,
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
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Input,
    Select,
    SelectItem,
    Checkbox,
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
// import Link from "next/link";
import { changeCase } from "@Utils/CaseChnage";
import SettingsModel from "./Settings";

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
    // @ States
    const isClient = useWindowCheck();
    const [State, setState] = React.useState<IState>({
        FilterBookmarks: [],
        Bookmarks: [],
        Query: "",
        QueryDisplay: "",
        Settings: {
            isFirstRun: true,
            isNewTab: true,
            CloudSync: false,
            CloudSyncRandomize: true,
            SearchEngine: ISearchEngine.GOOGLE,
            Locale: ILocale.EN,

            isNewWindow: false,
            priorityWindowsApp: false,
            priorityAndroidapp: false,
        }
    });
    const [Index, setIndex] = React.useState<number>(0);
    const [Suggestions, setSuggestions] = React.useState<Array<ISuggestion>>([]);
    const [windowWidth, setWindowWidth] = React.useState<number>(isClient ? window.innerWidth : 0);
    const [contextMenu, setContextMenu] = React.useState<{
        mouseX: number;
        mouseY: number;
        ItemID: string;
    } | null>(null);
    const [ModalData, setModalData] = React.useState<{
        isSettingsOpen: boolean;
        isOpen: boolean;
        isEdit: boolean;
        BookmarkData: IBookmark;
        type: ModelType;
    }>({
        type: ModelType.Settings,
        isOpen: false,
        BookmarkData: {
            id: "",
            name: "",
            description: "",
            url: "",
            icon: "",
            keywords: [],
            androidapp: "",
            windowsapp: "",
            isSVGSrc: false,
            SVGStyles: {
                fill: "",
            },
            size: "128",
        },
        isSettingsOpen: false,
        isEdit: false,
    });
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // @ Functions
    const SwitchModelType = (type: ModelType) => {
        setModalData((ModalData) => {
            return {
                ...ModalData,
                type: type,
            }
        });
    }

    const handleKeyPress = (e: KeyboardEvent | React.KeyboardEvent<HTMLDivElement>, ArrayKeysOnly?: boolean) => {
        if (ArrayKeysOnly && ArrayKeysOnly === true) {
            if (e.key === "ArrowDown") {
                if ((Index + 1) <= (Suggestions.length)) {
                    setIndex((index) => index + 1);
                    setState((State) => {
                        return {
                            ...State,
                            QueryDisplay: Suggestions[Index].Query
                        }
                    })
                } else {
                    setIndex(0);
                    setState((State) => {
                        return {
                            ...State,
                            QueryDisplay: State.Query
                        }
                    })
                }
            }

            if (e.key === "ArrowUp") {
                if ((Index - 1) >= 1) {
                    setIndex((index) => index - 1);
                    setState((State) => {
                        return {
                            ...State,
                            QueryDisplay: Suggestions[Index - 2]?.Query
                        }
                    })
                } else {
                    setIndex(Suggestions.length + 1);
                    setState((State) => {
                        return {
                            ...State,
                            QueryDisplay: State.Query
                        }
                    })
                }
            }

            if (e.key === "Enter") {
                if (Index > 0) {
                    window.open(SearchEngineLinkBuilder(Suggestions[Index - 1].Query), State.Settings.isNewTab ? "_blank" : "_self");
                } else {
                    window.open(SearchEngineLinkBuilder(State.Query), State.Settings.isNewTab ? "_blank" : "_self");
                }

                setState({
                    ...State,
                    FilterBookmarks: State.Bookmarks,
                    Query: "",
                });
                setIndex(0);
                return;
            }

            return;
        }
        const isAlphaNumericOrSymbol = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]$/.test(e.key);
        if (isAlphaNumericOrSymbol && searchInputRef.current) {
            searchInputRef.current.focus();
        }

        // ? On Escape focus remove
        if (e.key === "Escape" && searchInputRef.current) {
            searchInputRef.current.blur();
        }

        // ? On Space Focus on Search
        if (e.key === " " && searchInputRef.current) {
            searchInputRef.current.focus();
        }

        // ? On Enter Open First Link
        if (e.key === "Enter") {
            if (State.FilterBookmarks.length > 0 && State.Query.length > 0) {
                window.open(State.FilterBookmarks[0].url, State.Settings.isNewTab ? "_blank" : "_self");
                setState({
                    ...State,
                    FilterBookmarks: State.Bookmarks,
                    Query: "",
                    QueryDisplay: "",
                });
                setIndex(0);
                return;
            }

            if (State.Query.length === 0 && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }

        // ? Clear Query on Escape or Delete
        if (e.key === "Delete" || e.key === "Escape") {
            if (State.Query.length === 0) {
                setState({
                    ...State,
                    FilterBookmarks: State.Bookmarks,
                });
            }
        }
    }

    function onGridChange(
        sourceId: any,
        sourceIndex: any,
        targetIndex: any,
        targetId: any
    ) {
        const nextState = swap(State.FilterBookmarks, sourceIndex, targetIndex);
        if (State.Query !== "") {
            toast.error("Cannot move bookmarks while searching.");
            return;
        }
        setState({
            ...State,
            FilterBookmarks: nextState,
            Bookmarks: nextState,
        });
    }

    const abortControllerRef = React.useRef<AbortController | null>(null);
    const onQueryChange = async (e: any) => {
        const query = e.target.value.toLowerCase();
        const OriginalQuery = e.target.value;

        const isExactMatch = (name: string, keywords: Array<string> = []): boolean => {
            return name.toLowerCase() === query || keywords.some((keyword) => keyword.toLowerCase() === query);
        };

        const filteredBookmarks = State.Bookmarks.filter((bookmark) => {
            return (
                bookmark.name.toLowerCase().includes(query) ||
                (bookmark.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(query)) ||
                isExactMatch(bookmark.name, bookmark.keywords) ||
                bookmark.url.toLowerCase().includes(query)
            );
        }).sort((a, b) => {
            // ? Exact match comparison
            const aIsExactMatch = isExactMatch(a.name, a.keywords);
            const bIsExactMatch = isExactMatch(b.name, b.keywords);

            if (aIsExactMatch && !bIsExactMatch) return -1;
            if (!aIsExactMatch && bIsExactMatch) return 1;

            // ? Starts with query comparison
            const aStartsWithQuery = a.name.toLowerCase().startsWith(query);
            const bStartsWithQuery = b.name.toLowerCase().startsWith(query);

            if (aStartsWithQuery && !bStartsWithQuery) return -1;
            if (!aStartsWithQuery && bStartsWithQuery) return 1;

            // ? Keyword match comparison
            const aKeywordMatch = a.keywords?.some((keyword) => keyword.toLowerCase().includes(query));
            const bKeywordMatch = b.keywords?.some((keyword) => keyword.toLowerCase().includes(query));

            if (aKeywordMatch && !bKeywordMatch) return -1;
            if (!aKeywordMatch && bKeywordMatch) return 1;

            // ? URL match comparison
            const aUrlMatch = a.url.toLowerCase().includes(query);
            const bUrlMatch = b.url.toLowerCase().includes(query);

            if (aUrlMatch && !bUrlMatch) return -1;
            if (!aUrlMatch && bUrlMatch) return 1;

            // ? Fallback to alphabetical sorting (optional)
            return a.name.localeCompare(b.name);
        });

        setState({
            ...State,
            Query: OriginalQuery,
            QueryDisplay: OriginalQuery,
            FilterBookmarks: filteredBookmarks
        });

        if (query.length > 0) {
            FetchSuggestions();
        } else {
            setSuggestions([]);
        }
    };

    const FetchSuggestions = async () => {
        let ProcessedSuggestions: any[] = [];

        if (State.FilterBookmarks.length === 0) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            let API = "https://api.suggestions.victr.me/";
            let _API = new URL(API);
            _API.searchParams.append("q", State.Query);
            _API.searchParams.append("l", State.Settings.Locale);
            _API.searchParams.append("with", State.Settings.SearchEngine);

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
                    console.warn("Request Aborted");
                }
            }
        }

        setSuggestions(ProcessedSuggestions);
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
        const bookmarkIndex = State.Bookmarks.findIndex((bookmark) => bookmark.id === ID);
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
        setModalData({
            ...ModalData,
            isSettingsOpen: false,
            isOpen: false,
            isEdit: false,
            BookmarkData: {
                id: "",
                name: "",
                url: "",
                description: "",
                icon: "",
                keywords: [],
                androidapp: "",
                windowsapp: "",
                isSVGSrc: false,
                SVGStyles: {
                    fill: "",
                },
                size: "128",
            },
            type: ModelType.Settings,
        });
    }

    function OpenEditModel(ID: string) {
        const bookmark = State.Bookmarks.find((bookmark) => bookmark.id === ID);
        if (bookmark) {
            setModalData({
                ...ModalData,
                type: ModelType.Edit,
                isOpen: true,
                BookmarkData: bookmark,
            });
        }
    }

    async function getServerBookmarks() {
        try {
            const response = await Axios("/api/bookmarks");

            const ServerBookmarks = response.data.data;
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
                return !ProcessedBookmarks.some((serverBookmark: any) => serverBookmark.url === localBookmark.url);
            });

            // ? Randomize Links
            if (State.Settings.CloudSyncRandomize) {
                ProcessedBookmarks = ProcessedBookmarks.sort(() => Math.random() - 0.5);
            }

            setState({
                ...State,
                Bookmarks: Array.from(new Set([...RemoveDublicatesfromLocal, ...ProcessedBookmarks])) as any,
                FilterBookmarks: Array.from(new Set([...RemoveDublicatesfromLocal, ...ProcessedBookmarks])) as any,
            })
        } catch (error: any) {
            toast.error(`Cloud Sync : ${error.Message}`);
        }
    }

    async function ConfirmEdit() {
        const bookmarkIndex = State.Bookmarks.findIndex((bookmark) => bookmark.id === ModalData.BookmarkData.id);
        if (bookmarkIndex === -1) {
            return;
        }

        const newBookmarks = [...State.Bookmarks];
        newBookmarks[bookmarkIndex] = ModalData.BookmarkData;

        await setState({
            ...State,
            Bookmarks: newBookmarks,
            FilterBookmarks: newBookmarks
        });

        await CloseModel();
    }

    async function ConfirmNewBookmark() {
        await setState({
            ...State,
            Bookmarks: [...State.Bookmarks, ModalData.BookmarkData],
            FilterBookmarks: [...State.Bookmarks, ModalData.BookmarkData],
        });

        await CloseModel();
    }

    const handleResize = () => {
        setWindowWidth(window.innerWidth);
    };

    function SearchEngineLinkBuilder(query: string) {
        let SearchEngine = SearchEnginePresets[State.Settings.SearchEngine as ISearchEngine];
        return SearchEngine.replace("@Query", query);
    }

    // @Updates

    // ? Initial Run & Window Resize, Focus on Search Input Listeners
    React.useEffect(() => {

        // ? Only Run at First Load
        if (State.Settings.isFirstRun) {
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
                    Settings: {
                        ...State.Settings,
                        isFirstRun: false
                    },
                    FilterBookmarks: State.Bookmarks,
                });
            } else {
                let StorageData = JSON.parse(data as string);
                setState({
                    ...State,
                    Settings: {
                        ...StorageData.Settings,
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

    React.useEffect(() => {
        if (State.Settings.isFirstRun) {
            window.addEventListener("keydown", handleKeyPress);
        }
    }, [Index])

    // ? Cloud Sync After the First Run
    React.useEffect(() => {
        if (!State.Settings.isFirstRun) {
            if (State.Settings.CloudSync) {
                getServerBookmarks();
            }
        }
    }, [State.Settings.isFirstRun]);

    // ? State Sync with Storage
    React.useEffect(() => {
        localStorage.setItem(StorageKey, JSON.stringify({
            Booksmarks: State.Bookmarks,
            Settings: {
                isNewTab: State.Settings.isNewTab,
                CloudSyncRandomize: State.Settings.CloudSyncRandomize,
                SearchEngine: State.Settings.SearchEngine,
                Locale: State.Settings.Locale,
                CloudSync: State.Settings.CloudSync,
                priorityAndroidapp: State.Settings.priorityAndroidapp,
                priorityWindowsApp: State.Settings.priorityWindowsApp,
            },
        }));
    }, [
        State.Bookmarks,
        State.Settings.CloudSync,
        State.Settings.isNewTab,
        State.Settings.CloudSyncRandomize,
        State.Settings.SearchEngine,
        State.Settings.Locale,
        State.Settings.priorityAndroidapp,
        State.Settings.priorityWindowsApp,
    ]);

    const boxesPerRow = Math.max(Math.floor(windowWidth / 200), 1);
    const rows = Math.ceil(State.FilterBookmarks.length / boxesPerRow);
    const footerHeight = 100;
    const gridHeight = rows * 150 + footerHeight;

    // @Component
    return (
        <div
            key={"Tool"}
            className="Tool"
            onKeyDown={(e) => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }

                handleKeyPress(e, true);
            }}
        >
            <ToastContainer
                autoClose={3000}
                position="bottom-right"
                theme="dark"
                pauseOnHover={false}
                pauseOnFocusLoss={false}
                closeOnClick
                draggable
                draggableDirection="x"
                closeButton={false}
                limit={3}
                hideProgressBar={false}
                stacked
            />

            {/* Search Warp */}
            <div
                className="SearchWarp"
            >
                {/* Suggestions */}
                {
                    State.FilterBookmarks.length === 0 && State.Bookmarks.length <= 0 && (
                        <div className="Suggestions" onClick={() => {
                            setModalData({
                                ...ModalData,
                                isOpen: true,
                                type: ModelType.Marketplace,
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
                                Suggestions.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`Suggestion ${Index === (index + 1) ? "SuggestionActive" : ""}`}
                                        onClick={() => {
                                            window.open(SearchEngineLinkBuilder(item.Query), State.Settings.isNewTab ? "_blank" : "_self");
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

                            {/* ? Defualt Query as Suggestion */}
                            {/* <div className={`Suggestion ${(Index + 1) === 0 ?? "SuggestionActive"}`}
                                onClick={() => {
                                    window.open(SearchEngineLinkBuilder(State.Query), State.Settings.isNewTab ? "_blank" : "_self");
                                }}
                            >
                                <p className="Thumbnail">
                                    <Search />
                                </p>
                                <div className="QueryWarp">
                                    <h2 className="Title">{changeCase.upperFirst(State.Query)}</h2>
                                </div>
                            </div> */}

                            {
                                Suggestions.length === 0 && (
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
                    {/* <motion.div
                        className="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                        onClick={(e) => {
                            setModalData({
                                ...ModalData,
                                isOpen: true,
                                type: ModelType.Create,
                            });
                        }}
                    >
                        <Add />
                    </motion.div> */}
                    <motion.input
                        id="search"
                        type="text"
                        placeholder="🔍 Search"
                        tabIndex={1}
                        value={State.QueryDisplay}
                        onChange={onQueryChange}
                        className="search"
                        ref={searchInputRef}
                        autoComplete="off"
                        onHoverStart={() => {
                            if (searchInputRef.current !== null) {
                                searchInputRef.current.focus();
                            }
                        }}
                        onHoverEnd={() => {
                            if (searchInputRef.current !== null) {
                                searchInputRef.current.blur();
                            }
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
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
                                            QueryDisplay: "",
                                        })
                                        setIndex(0);
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
                            setModalData({
                                ...ModalData,
                                isOpen: true,
                                type: ModelType.Settings,
                            });
                        }}
                    >
                        <Settings />
                    </motion.div>
                    {/* <motion.div
                        className="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                        onClick={(e) => {
                            setModalData({
                                ...ModalData,
                                isOpen: true,
                                type: ModelType.Marketplace,
                            });
                        }}
                    >
                        <LocalMall />
                    </motion.div> */}
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
                        <GridItem key={item.id} style={{
                            zIndex: 0,
                        }}>
                            <div
                                className="bookmark"
                                onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
                                    e.currentTarget.dataset.dragStartX = e.clientX.toString();
                                    e.currentTarget.dataset.dragStartY = e.clientY.toString();

                                    if (State.Query.length > 0) {

                                        e.currentTarget.style.cursor = "not-allowed";
                                    } else {
                                        e.currentTarget.style.cursor = "grabbing";
                                    }
                                }}
                                onMouseUp={(e: React.MouseEvent<HTMLDivElement>) => {

                                    if (e.button === 2) {
                                        return;
                                    }

                                    const dragStartX = parseInt(`${e.currentTarget.dataset.dragStartX}`, 10);
                                    const dragStartY = parseInt(`${e.currentTarget.dataset.dragStartY}`, 10);
                                    const dragDistance = Math.sqrt(
                                        Math.pow(e.clientX - dragStartX, 2) + Math.pow(e.clientY - dragStartY, 2)
                                    );

                                    if (dragDistance < 5) {
                                        window.open(item.url, State.Settings.isNewTab ? "_blank" : "_self");
                                    }

                                    e.currentTarget.style.cursor = "pointer";
                                }}
                                onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => {
                                    e.preventDefault();
                                    handleContextMenu(e, item?.id ?? "");
                                }}
                            >
                                {item.icon && (
                                    <div className="Icon">
                                        {
                                            item.isSVGSrc && (
                                                <SvgComponent
                                                    _class="SVGComponent"
                                                    svgString={item.icon}
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
                                            !item.isSVGSrc && (<Image
                                                src={ResolveIcon(item)}
                                                alt={item.name}
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
                                <h2 className="bookmarkTitle">{item.name}</h2>
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
                open={contextMenu !== null}
                onClose={() => setContextMenu(null)}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                {
                    State.Settings.priorityWindowsApp && (
                        <MenuItem
                            onClick={() => {
                                if (State.Bookmarks.find((bookmark) => bookmark.id === contextMenu?.ItemID)?.windowsapp) {
                                    // ? Open Link in New Windows
                                    window.open(State.Bookmarks.find((bookmark) => bookmark.id === contextMenu?.ItemID)?.windowsapp ?? "", "_blank", `width=${window.innerWidth},height=${window.innerHeight}`);
                                    setContextMenu(null);
                                } else {
                                    setContextMenu(null);
                                    toast.error("No Windows App Found");
                                }
                            }}
                        >
                            <ListItemIcon>
                                <Image
                                    src="https://img.icons8.com/fluency/128/windows-10.png"
                                    alt="Windows"
                                    placeholder="blur"
                                    blurDataURL="https://img.icons8.com/fluency/40/windows-10.png"
                                    width={24}
                                    height={24}
                                />
                            </ListItemIcon>
                            <ListItemText>
                                Open in Windows
                            </ListItemText>
                        </MenuItem>
                    )
                }

                {
                    State.Settings.priorityAndroidapp && (
                        <MenuItem
                            onClick={() => {
                                if (State.Bookmarks.find((bookmark) => bookmark.id === contextMenu?.ItemID)?.androidapp) {
                                    // ? Open Link in New Android
                                    window.open(State.Bookmarks.find((bookmark) => bookmark.id === contextMenu?.ItemID)?.androidapp ?? "", "_blank", `width=${window.innerWidth},height=${window.innerHeight}`);
                                    setContextMenu(null);
                                } else {
                                    setContextMenu(null);
                                    toast.error("No Android App Found");
                                }
                            }}
                        >
                            <ListItemIcon>
                                <Image
                                    src="https://img.icons8.com/fluency/128/android-os.png"
                                    alt="Windows"
                                    placeholder="blur"
                                    blurDataURL="https://img.icons8.com/fluency/40/android-os.png"
                                    width={24}
                                    height={24}
                                />
                            </ListItemIcon>
                            <ListItemText>
                                Open in Android
                            </ListItemText>
                        </MenuItem>
                    )
                }

                <MenuItem
                    onClick={() => {
                        // ? Open Link in New Tab
                        window.open(State.Bookmarks.find((bookmark) => bookmark.id === contextMenu?.ItemID)?.url ?? "", "_blank");
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
                        window.open(State.Bookmarks.find((bookmark) => bookmark.id === contextMenu?.ItemID)?.url ?? "", "_blank", `width=${window.innerWidth},height=${window.innerHeight}`);
                        setContextMenu(null);
                    }}
                >
                    <ListItemIcon>
                        <Image
                            src="https://img.icons8.com/fluency/128/new-window.png"
                            alt="Windows"
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
                        OpenEditModel(contextMenu?.ItemID ?? "");
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
                        DeleteBookmark(contextMenu?.ItemID ?? "");
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
            </StyledMenu>

            <SettingsModel
                State={State}
                Dispatch={setState}
                isOpen={ModalData.isOpen}
                onClose={CloseModel}
                type={ModalData.type}
                SwitchModelType={SwitchModelType}
                EditBookmarkData={ModalData.BookmarkData}
            />
        </div>
    );
}

export default Tools;