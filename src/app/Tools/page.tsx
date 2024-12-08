"use client";

import React from "react";
import { ISearchEngine, ILocale } from "@Types/Tools";
import type { IBookmark, IState } from "@Types/Tools";
import { ToastContainer, toast } from 'react-toastify';
import { BookmarksDB } from "@Data/Tools";
import Image from "next/image";
import { v4 as uuidv4 } from 'uuid';
import "@Styles/Tool.sass";
import {
    Add,
    Close,
    Delete,
    Edit,
    Save,
    Settings,
} from "@mui/icons-material";
import {
    Slide,
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
    Checkbox
} from "@nextui-org/react";
import { styled, alpha } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import {
    GridContextProvider,
    GridDropZone,
    GridItem,
    swap
} from "react-grid-dnd";
import 'react-toastify/dist/ReactToastify.css';

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
    const [State, setState] = React.useState<IState>({
        FilterSuggestions: [],
        FilterBookmarks: [],
        Bookmarks: BookmarksDB,
        Suggestions: [],
        Query: "",
        Settings: {
            isFirstRun: true,
            isNewTab: false,
            RandomizeLinks: false,
            SearchEngine: ISearchEngine.GOOGLE,
            Locale: ILocale.EN,
        },
    });
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
    const handleKeyPress = (e: KeyboardEvent) => {
        const isAlphaNumericOrSymbol = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]$/.test(e.key);
        if (isAlphaNumericOrSymbol && searchInputRef.current) {
            searchInputRef.current.focus();
        }

        // ? On Escape focus remove
        if (e.key === "Escape" && searchInputRef.current) {
            searchInputRef.current.blur();
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

        if (query === "") {
            setState({
                ...State,
                Query: query,
                FilterBookmarks: State.Bookmarks
            });
        } else {
            const exactMatch = (name: string, keywords: Array<string> = []): boolean => {
                return name.toLowerCase() === query || keywords.some((keyword) => keyword.toLowerCase() === query);
            };

            const filteredBookmarks = State.Bookmarks.filter((bookmark) => {
                return (
                    bookmark.name.toLowerCase().includes(query) ||
                    (bookmark?.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(query))
                );
            }).sort((a, b) => {
                const aIsExactMatch = exactMatch(a.name, a.keywords);
                const bIsExactMatch = exactMatch(b.name, b.keywords);

                if (aIsExactMatch && !bIsExactMatch) {
                    return -1;
                } else if (!aIsExactMatch && bIsExactMatch) {
                    return 1;
                } else {
                    const aStartsWithQuery = a.name.toLowerCase().startsWith(query);
                    const bStartsWithQuery = b.name.toLowerCase().startsWith(query);
                    if (aStartsWithQuery && !bStartsWithQuery) {
                        return -1;
                    } else if (!aStartsWithQuery && bStartsWithQuery) {
                        return 1;
                    } else {
                        const aKeywordMatch = a.keywords?.find((keyword) => keyword.toLowerCase().includes(query));
                        const bKeywordMatch = b.keywords?.find((keyword) => keyword.toLowerCase().includes(query));

                        if (aKeywordMatch && !bKeywordMatch) {
                            return -1;
                        } else if (!aKeywordMatch && bKeywordMatch) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                }
            });

            setState({
                ...State,
                Query: query,
                FilterBookmarks: filteredBookmarks
            });
        }
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
            FilterBookmarks: newBookmarks,
        });

        await CloseModel();
    }

    function OpenNewBookmarkModel() {
        setModalData({
            ...ModalData,
            isOpen: true,
            isEdit: false,
            BookmarkData: {
                id: uuidv4(),
                name: "",
                url: "",
                icon: "",
                keywords: [],
            },
        });
    }

    async function ConfirmNewBookmark() {
        await setState({
            ...State,
            Bookmarks: [...State.Bookmarks, ModalData.BookmarkData],
            FilterBookmarks: [...State.Bookmarks, ModalData.BookmarkData],
        });

        await CloseModel();
    }


    // @Updates
    React.useEffect(() => {
        // ? Auto Focus on Page Load
        if (searchInputRef.current && State.Settings.isFirstRun) {
            searchInputRef.current.focus();
        }

        window.addEventListener("keydown", handleKeyPress);

        // ? Local Storage Checks
        const data = localStorage.getItem(StorageKey);
        if (data !== null) {
            setState({
                ...State,
                FilterBookmarks: JSON.parse(data).Booksmarks,
                Bookmarks: JSON.parse(data).Booksmarks,
                Settings: {
                    ...State.Settings,
                    ...JSON.parse(data).Settings,
                    isFirstRun: false,
                },
            });
        } else {
            setState({
                ...State,
                FilterBookmarks: BookmarksDB,
                Bookmarks: BookmarksDB,
                Settings: {
                    ...State.Settings,
                    isFirstRun: false,
                },
            });
        }

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, []);

    React.useEffect(() => {
        localStorage.setItem(StorageKey, JSON.stringify({
            Booksmarks: State.Bookmarks,
            Settings: {
                isNewTab: State.Settings.isNewTab,
                RandomizeLinks: State.Settings.RandomizeLinks,
                SearchEngine: State.Settings.SearchEngine,
                Locale: State.Settings.Locale,
            },
        }));
    }, [
        State.Bookmarks,
        State.Settings.isNewTab,
        State.Settings.RandomizeLinks,
        State.Settings.SearchEngine,
        State.Settings.Locale,
    ]);

    // @Component
    return (
        <div className="Tool"
            onKeyDown={(e) => {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
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
            <input
                id="search"
                type="text"
                placeholder="🔍 Search"
                value={State.Query}
                onChange={onQueryChange}
                className="search"
                ref={searchInputRef}
            />

            <GridContextProvider onChange={onGridChange}>
                <GridDropZone
                    id="items"
                    boxesPerRow={
                        typeof window !== "undefined"
                            ? Math.floor(window.innerWidth / 200)
                            : 5
                    }
                    rowHeight={
                        150
                    }
                    style={{
                        height: `${Math.ceil(State.FilterBookmarks.length / 5) * 200}px`
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
                                        <Image
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
                                        />
                                    </div>
                                )}
                                <h2 className="bookmarkTitle">{item.name}</h2>
                            </div>
                        </GridItem>
                    ))}

                    {/* Add */}
                    <GridItem key="add">
                        <div className="bookmark item" onClick={(e) => {
                            OpenNewBookmarkModel();
                        }}>
                            <div className="Icon">
                                <Add
                                    width={64}
                                    height={64}
                                    sx={{
                                        color: "#6e6e6e"
                                    }}
                                />
                            </div>
                            <h2 className="bookmarkTitle">
                                Add Bookmark
                            </h2>
                        </div>
                    </GridItem>

                    {/* Delete Mode */}
                    {/* <GridItem key="delete">
                        <div className="bookmark item delete">
                            <div className="Icon">
                                <Deletethfhyhhtjftttffygfjfgutf
                                    width={64}
                                    height={64}
                                    sx={{
                                        color: "#ff0000",
                                    }}
                                />
                            </div>
                            <h2 className="bookmarkTitle">
                                Bulk Delete
                            </h2>
                        </div>
                    </GridItem> */}

                    {/* Settings */}
                    <GridItem key="settings">
                        <div className="bookmark item" onClick={(e) => {
                            setModalData({
                                ...ModalData,
                                isSettingsOpen: true,
                                isOpen: true,
                            });
                        }}>
                            <div className="Icon">
                                <Settings
                                    width={64}
                                    height={64}
                                    sx={{
                                        color: "#6e6e6e"
                                    }}
                                />
                            </div>
                            <h2 className="bookmarkTitle">
                                Settings
                            </h2>
                        </div>
                    </GridItem>

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
                                    label="🔍 Engine"
                                    variant="faded"
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
                                    label="🌍 Locale"
                                    variant="faded"
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

                                {/* Reset Database */}
                                <Button
                                    color="danger"
                                    variant="light"
                                    className="mt-4"
                                    onPress={() => {
                                        localStorage.removeItem(StorageKey);
                                        setState({
                                            ...State,
                                            FilterBookmarks: BookmarksDB,
                                            Bookmarks: BookmarksDB,
                                        });
                                    }}
                                >
                                    Reset Database
                                </Button>

                            </ModalBody>
                            <ModalFooter>
                                <Button isIconOnly color="danger" variant="light" onPress={CloseModel}>
                                    <Close />
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    )
                }
                {
                    !ModalData.isSettingsOpen && (

                        <ModalContent>
                            <ModalHeader className="flex flex-col gap-1">
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
                                        <label className="flex flex-col">
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
                                        <label className="flex flex-col">
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
                                        <label className="flex flex-col">
                                            Icon
                                            <Input
                                                type="text"
                                                value={ModalData.BookmarkData.icon}
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
                                        <label className="flex flex-col">
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
                                                    src={ModalData.BookmarkData.icon}
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
                                <Button isIconOnly color="danger" variant="light" onPress={CloseModel}>
                                    <Close />
                                </Button>
                                <Button
                                    isIconOnly
                                    color={
                                        ModalData.isEdit
                                            ? "success"
                                            : "primary"
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
                                            : "Add"
                                    }
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    )
                }
            </Modal>
        </div>
    );
}

export default Tools;