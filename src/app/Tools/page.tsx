/**
 *  @file        app\Tools\page.tsx
 *  @description No description available for app\Tools\page.tsx.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import React from "react";
import { ISearchEngine, ILocale } from "@Types/Tools";
import type { IBookmark, IState } from "@Types/Tools";
import { ToastContainer, toast } from 'react-toastify';
import { BookmarksDB } from "@Data/Tools";
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
    Bookmark
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
} from "@nextui-org/react";
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
import { Config } from "@Config/index";

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

function Tools() {
    // @ States
    const isClient = useWindowCheck();
    const [State, setState] = React.useState<IState>({
        FilterSuggestions: [],
        FilterBookmarks: [],
        Bookmarks: [...BookmarksDB],
        Suggestions: [],
        Query: "",
        Settings: {
            isFirstRun: true,
            isNewTab: true,
            RandomizeLinks: true,
            CloudSync: true,
            SearchEngine: ISearchEngine.GOOGLE,
            Locale: ILocale.EN
        }
    });
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
    }>({
        isSettingsOpen: false,
        isOpen: false,
        isEdit: false,
        BookmarkData: {
            id: "",
            name: "",
            url: "",
            icon: "",
            keywords: [],
        },
    });
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // @ Functions
    const handleKeyPress = (e: KeyboardEvent | React.KeyboardEvent<HTMLDivElement>) => {
        const isAlphaNumericOrSymbol = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]$/.test(e.key);
        if (isAlphaNumericOrSymbol && searchInputRef.current) {
            searchInputRef.current.focus();
        }

        // ? On Escape focus remove
        if (e.key === "Escape" && searchInputRef.current) {
            searchInputRef.current.blur();
        }

        // ? On Enter Open First Link
        if (e.key === "Enter") {
            if (State.FilterBookmarks.length > 0 && State.Query.length > 0) {
                window.open(State.FilterBookmarks[0].url, State.Settings.isNewTab ? "_blank" : "_self");
                setState({
                    ...State,
                    FilterBookmarks: State.Bookmarks,
                    Query: "",
                });
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

    const onQueryChange = (e: any) => {
        const query = e.target.value.toLowerCase();

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
            Query: query,
            FilterBookmarks: filteredBookmarks
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
                icon: "",
                keywords: [],
            },
        });
    }

    function OpenEditModel(ID: string) {
        const bookmark = State.Bookmarks.find((bookmark) => bookmark.id === ID);
        if (bookmark) {
            setModalData({
                ...ModalData,
                isOpen: true,
                isEdit: true,
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
            if (State.Settings.RandomizeLinks) {
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
                    FilterBookmarks: BookmarksDB,
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

        window.addEventListener("keydown", handleKeyPress);
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

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
                RandomizeLinks: State.Settings.RandomizeLinks,
                SearchEngine: State.Settings.SearchEngine,
                Locale: State.Settings.Locale,
                CloudSync: State.Settings.CloudSync,
            },
        }));
    }, [
        State.Bookmarks,
        State.Settings.CloudSync,
        State.Settings.isNewTab,
        State.Settings.RandomizeLinks,
        State.Settings.SearchEngine,
        State.Settings.Locale,
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
                handleKeyPress(e);
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
                <motion.div
                    className="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                    onClick={(e) => {
                        setModalData({
                            ...ModalData,
                            isSettingsOpen: false,
                            isOpen: true,
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
                    value={State.Query}
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
                        setModalData({
                            ...ModalData,
                            isSettingsOpen: true,
                            isOpen: true,
                        });
                    }}
                >
                    <Settings />
                </motion.div>
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

                                    e.currentTarget.style.cursor = "grabbing";
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
                                                src={item.icon}
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
                        <OpenInNew />
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
                        <Edit />
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

            {/* Modal */}
            <Modal
                backdrop="blur"
                isDismissable={
                    ModalData.isSettingsOpen ? true : false
                }
                isKeyboardDismissDisabled={
                    ModalData.isSettingsOpen ? true : false
                }
                isOpen={ModalData.isOpen}
                onClose={CloseModel}
                hideCloseButton={true}
            >
                {
                    ModalData.isSettingsOpen && (
                        <ModalContent>
                            <ModalHeader className="flex flex-col gap-1">
                                Settings
                            </ModalHeader>
                            <ModalBody>

                                {/* 🔍 Search Engine */}
                                <Select
                                    selectedKeys={[State.Settings.SearchEngine]}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                        setState({
                                            ...State,
                                            Settings: {
                                                ...State.Settings,
                                                SearchEngine: e.target.value as ISearchEngine,
                                            },
                                        });
                                    }}
                                    label="🔍 Search Engine"
                                    variant="bordered"
                                    multiple={false}
                                >
                                    {
                                        // ? Enum to Array of Object { Key: Value }
                                        Object.values(ISearchEngine).map((engine) => (
                                            <SelectItem key={engine} value={engine}>
                                                {engine}
                                            </SelectItem>
                                        ))
                                    }
                                </Select>

                                {/* 🌍 Locale */}
                                <Select
                                    className="mt-1"
                                    selectedKeys={[State.Settings.Locale]}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                        if (e.target.value === "") {
                                            return;
                                        }
                                        setState({
                                            ...State,
                                            Settings: {
                                                ...State.Settings,
                                                Locale: e.target.value as ILocale,
                                            },
                                        });
                                    }}
                                    label="🌍 Suggestions Language"
                                    variant="bordered"
                                    multiple={false}
                                >
                                    {
                                        // ? Enum to Array of Object { Key: Value }
                                        Object.values(ILocale).map((locale) => (
                                            <SelectItem key={locale} value={locale}>
                                                {locale}
                                            </SelectItem>
                                        ))
                                    }
                                </Select>

                                {/* NewTab */}
                                <Checkbox
                                    className="mt-1 ml-1"
                                    isSelected={State.Settings.isNewTab}
                                    onValueChange={(value) => {
                                        setState({
                                            ...State,
                                            Settings: {
                                                ...State.Settings,
                                                isNewTab: value
                                            },
                                        });
                                    }}
                                >
                                    Links Open in New Tab
                                </Checkbox>

                                {/* Cloud Sync */}
                                <Checkbox
                                    className="mt-1 ml-1"
                                    isSelected={State.Settings.CloudSync}
                                    onValueChange={(value) => {
                                        setState({
                                            ...State,
                                            Settings: {
                                                ...State.Settings,
                                                CloudSync: value
                                            },
                                        });
                                    }}
                                >
                                    Cloud Sync
                                </Checkbox>

                                {/* Randomize Cloud Import */}
                                <Checkbox
                                    className="mt-1 ml-1"
                                    isSelected={State.Settings.RandomizeLinks}
                                    onValueChange={(value) => {
                                        setState({
                                            ...State,
                                            Settings: {
                                                ...State.Settings,
                                                RandomizeLinks: value
                                            },
                                        });
                                    }}
                                >
                                    Randomize Cloud Links Sync
                                </Checkbox>

                                {/* Sync Global Database */}
                                {
                                    Config.Environment === "development" && (
                                        <div
                                            className="mt-1 ml-3 mr-3 flex flex-row justify-between items-center gap-2"
                                        >
                                            <div>
                                                Global Database
                                            </div>

                                            <Button
                                                color="primary"
                                                variant="light"
                                                onPress={() => {
                                                    Axios.get("/api/bookmarks/sync")
                                                }}
                                            >
                                                Sync
                                            </Button>
                                        </div>
                                    )
                                }

                            </ModalBody>
                            <ModalFooter>
                                <Tooltip content="Reset Bookmarks" placement="top">
                                    <Button isIconOnly color="secondary" variant="light" onPress={() => {
                                        localStorage.removeItem(StorageKey);
                                        setState({
                                            ...State,
                                            FilterBookmarks: BookmarksDB,
                                            Bookmarks: BookmarksDB,
                                        });
                                        setModalData({
                                            ...ModalData,
                                            isSettingsOpen: false,
                                            isOpen: false,
                                        });
                                    }}>
                                        <Restore />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Close" placement="top">
                                    <Button isIconOnly color="danger" variant="light" onPress={CloseModel}>
                                        <Close />
                                    </Button>
                                </Tooltip>
                            </ModalFooter>
                        </ModalContent>
                    )
                }
                {
                    !ModalData.isSettingsOpen && (

                        <ModalContent>
                            <ModalHeader className="flex flex-row gap-2">
                                {
                                    ModalData.isEdit
                                        ? <Bookmark />
                                        : <Book />
                                }
                                {
                                    ModalData.isEdit
                                        ? "Edit Bookmark"
                                        : "New Bookmark"
                                }
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                                    {/* Input Fields */}
                                    <div className="flex flex-col gap-4">
                                        <label className="flex flex-col gap-2">
                                            Name
                                            <Input
                                                type="text"
                                                value={ModalData.BookmarkData.name}
                                                onChange={(e) => {
                                                    setModalData({
                                                        ...ModalData,
                                                        BookmarkData: {
                                                            ...ModalData.BookmarkData,
                                                            name: e.target.value,
                                                        },
                                                    });
                                                }}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            URL
                                            <Input
                                                type="text"
                                                value={ModalData.BookmarkData.url}
                                                onChange={(e) => {
                                                    setModalData({
                                                        ...ModalData,
                                                        BookmarkData: {
                                                            ...ModalData.BookmarkData,
                                                            url: e.target.value,
                                                        },
                                                    });
                                                }}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            Icon
                                            <Input
                                                type="text"
                                                value={ModalData.BookmarkData.icon?.toString() ?? ""}
                                                disabled={typeof ModalData.BookmarkData.icon !== "string"}
                                                onChange={(e) => {
                                                    setModalData({
                                                        ...ModalData,
                                                        BookmarkData: {
                                                            ...ModalData.BookmarkData,
                                                            icon: e.target.value,
                                                        },
                                                    });
                                                }}
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2">
                                            Keywords
                                            <Input
                                                type="text"
                                                value={ModalData.BookmarkData.keywords?.join(", ") ?? ""}
                                                onChange={(e) => {
                                                    setModalData({
                                                        ...ModalData,
                                                        BookmarkData: {
                                                            ...ModalData.BookmarkData,
                                                            keywords: e.target.value.split(","),
                                                        },
                                                    });
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Icon Preview */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24">
                                            {ModalData.BookmarkData.icon ? (
                                                <img
                                                    src={ModalData.BookmarkData.icon.toString()}
                                                    alt="Icon Preview"
                                                    className="w-full h-full rounded object-cover border border-gray-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 rounded">
                                                    No Icon
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">Preview</p>
                                    </div>
                                </div>

                            </ModalBody>
                            <ModalFooter>
                                <Tooltip content={
                                    ModalData.isEdit
                                        ? "Save Changes"
                                        : "Add New Bookmark"
                                } placement="top">
                                    <Button
                                        isIconOnly
                                        color={
                                            ModalData.isEdit
                                                ? "primary"
                                                : "success"
                                        }
                                        onPress={
                                            ModalData.isEdit
                                                ? ConfirmEdit
                                                : ConfirmNewBookmark
                                        }
                                        variant="light"
                                    >
                                        {
                                            ModalData.isEdit
                                                ? <Save />
                                                : <Add />
                                        }
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Close" placement="top">
                                    <Button isIconOnly color="danger" variant="light" onPress={CloseModel}>
                                        <Close />
                                    </Button>
                                </Tooltip>
                            </ModalFooter>
                        </ModalContent>
                    )
                }
            </Modal>
        </div>
    );
}

export default Tools;