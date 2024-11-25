"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ISearchEngine, ILocale } from "@Types/Newtab";
import type { IBookmark, IState } from "@Types/Newtab";
import { BookmarksDB } from "@Data/Newtab";
import { Input } from "@nextui-org/react";
import Link from "next/link";
import Image from "next/image";
import "@Styles/Tool-NewTab.sass";
import { Add } from "@mui/icons-material";
import {
    Slide,
    Menu,
    MenuProps,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { TransitionProps } from '@mui/material/transitions';
import { Query } from "mongoose";

// const Transition = React.forwardRef(function Transition(
//     props: TransitionProps & {
//         children: React.ReactElement<any, any>;
//     },
//     ref: React.Ref<unknown>,
// ) {
//     return <Slide direction="up" ref={ref} {...props} />;
// });

// const StyledMenu = styled((props: MenuProps) => (
//     <Menu
//         elevation={0}
//         anchorOrigin={{
//             vertical: 'bottom',
//             horizontal: 'left',
//         }}
//         transformOrigin={{
//             vertical: 'top',
//             horizontal: 'left',
//         }}
//         {...props}
//     />
// ))(({ theme }) => ({
//     '& .MuiPaper-root': {
//         borderRadius: 6,
//         marginTop: theme.spacing(1),
//         minWidth: 300,
//         color:
//             theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
//         boxShadow:
//             'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
//         '& .MuiMenu-list': {
//             padding: '4px 0',
//         },
//         '& .MuiMenuItem-root': {
//             '& .MuiSvgIcon-root': {
//                 fontSize: 18,
//                 color: theme.palette.text.secondary,
//                 marginRight: theme.spacing(1.5),
//             },
//             '&:active': {
//                 backgroundColor: alpha(
//                     theme.palette.primary.main,
//                     theme.palette.action.selectedOpacity,
//                 ),
//             },
//         },
//     },
// }));

const StorageKey = "Tools/Newtab";

function Newtab() {
    const [State, setState] = React.useState<IState>({
        FilterSuggestions: [],
        FilterBookmarks: [],
        Bookmarks: BookmarksDB,
        Suggestions: [],
        Query: "",
        Settings: {
            isFirstRun: true,
            isNewTab: false,
            isNewWindow: false,
            RandomizeLinks: false,
            SearchEngine: ISearchEngine.GOOGLE,
            Locale: ILocale.EN,
        },
    });
    const RefState = React.useRef<{
        DragIndex: number | null
    }>({
        DragIndex: null,
    });

    React.useEffect(() => {
        const data = localStorage.getItem(StorageKey);
        if (data !== null) {
            setState({
                ...State,
                FilterBookmarks: JSON.parse(data).Booksmarks,
                Bookmarks: JSON.parse(data).Booksmarks,
                Settings: {
                    ...State.Settings,
                    ...JSON.parse(data).Settings,
                },
            });
        } else {
            setState({
                ...State,
                FilterBookmarks: BookmarksDB,
                Bookmarks: BookmarksDB,
            });
        }
    }, []);

    React.useEffect(() => {
        localStorage.setItem(StorageKey, JSON.stringify({
            Booksmarks: State.Bookmarks,
            Settings: {
                isNewTab: State.Settings.isNewTab,
                isNewWindow: State.Settings.isNewWindow,
                RandomizeLinks: State.Settings.RandomizeLinks,
                SearchEngine: State.Settings.SearchEngine,
                Locale: State.Settings.Locale,
            },
        }));
    }, [
        State.Bookmarks,
        State.Settings.isNewTab,
        State.Settings.isNewWindow,
        State.Settings.RandomizeLinks,
        State.Settings.SearchEngine,
        State.Settings.Locale,
    ]);

    const MoveBookmark = (from: number, to: number) => {
        const newBookmarks = [...State.Bookmarks];
        const [moved] = newBookmarks.splice(from, 1);
        newBookmarks.splice(to, 0, moved);
        setState({
            ...State,
            Bookmarks: newBookmarks,
            FilterBookmarks: newBookmarks,
            Query: State.Query,
        });
        RefState.current.DragIndex = null;
    };

    const onDragStart = (e: any, index: number) => {
        e.dataTransfer.setData("index", index.toString());
    };

    const onDragOver = (e: any, index: number) => {
        e.preventDefault();
        RefState.current.DragIndex = index;
    };

    const onDrop = (e: any, index: number) => {
        const draggedIndex = parseInt(e.dataTransfer.getData("index"));
        MoveBookmark(draggedIndex, index);
    };

    const onDragEnd = () => {
        RefState.current.DragIndex = null;
    };

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

    return (
        <div className="Tool_NewTab">
            <input
                type="text"
                placeholder="🔍 Search"
                value={State.Query}
                onChange={onQueryChange}
                className="search"
            />

            <div className="grid">
                    {State.FilterBookmarks.map((bookmark, index) => {
                        console.log("Rendering bookmark", bookmark.name);
                        return (
                            <motion.div
                                key={bookmark.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragOver={(e) => onDragOver(e, index)}
                                onDrop={(e) => onDrop(e, index)}
                                onDragEnd={onDragEnd}
                                className={`bookmark ${RefState.current.DragIndex === index ? "drag-over" : ""}`}
                            >
                                {RefState.current.DragIndex === index && <div className="dropIndicator"></div>}
                                <Link href={bookmark.url} className="link">
                                    {bookmark.icon && (
                                        <div className="Icon">
                                            <Image
                                                src={bookmark.icon}
                                                alt={bookmark.name}
                                                width={64}
                                                height={64}
                                                priority
                                            />
                                        </div>
                                    )}
                                    <h2 className="bookmarkTitle">{bookmark.name}</h2>
                                </Link>
                            </motion.div>
                        )
                    })}

                    {/* Add */}
                    <motion.div
                        key="add"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bookmark add"
                    >
                        <motion.div className="link">
                            <div className="Icon">
                                <Add width={64} sx={{
                                    color: "#6e6e6e"
                                }} />
                            </div>
                        </motion.div>
                    </motion.div>
            </div>

            {/* Context Menu */}
            {/* <StyledMenu
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
                            UpdateLinkDialog(contextMenu?.ItemIndex);
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
                            RemoveLink(contextMenu?.ItemIndex);
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
                </StyledMenu> */}

            {/* Add Bookmark Model */}
        </div>
    );
}

export default Newtab;