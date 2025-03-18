/**
 *  @FileID          app/Tools/Settings.tsx
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
 *  @created 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


"use client";

import React from "react";
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
    Tooltip,
    Switch,
    cn,
    Card,
    Skeleton,
    Chip,
    Textarea
} from "@heroui/react";
import {
    Add,
    Close,
    Delete,
    Edit,
    Save,
    OpenInNew,
    Settings as SettingsIcon,
    Cloud,
    Restore,
    Book,
    Bookmark,
    Home,
    Circle,
    ScatterPlot,
    Search,
    LocalMall,
    Info,
    SettingsOutlined,
    LocalMallOutlined,
    InfoOutlined,
    BookOutlined,
    BookmarkOutlined,
    DragIndicator,
    Label,
    AddCircle,
    RequestPage,
    AdminPanelSettings,
    BookmarkAdd,
    VerifiedUser,
    VerifiedUserOutlined
} from "@mui/icons-material";
import { Axios, windowchek } from "@Utils";
import { Config } from "@/Config";
import SvgComponent from "@/Components/SVGComponent";
import { ResolveIcon } from "@/Data/Tools";
import Image from "next/image";
import { v4 } from "uuid";
import {
    GridContextProvider,
    GridDropZone,
    GridItem,
    swap
} from "react-grid-dnd";
import { Tabs, Tab } from "@heroui/react";
import { toast } from "react-hot-toast";
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
    DefualtServerBookmarks,
    DefualtBookmarkRequest
} from "./Settings/Types"
import type {
    IToolsModalData,
    IBookmark,
    IToolsState,
    IBookmarkRequest,
} from "./Settings/Types"
import Header from "./Settings/Header";
import Sidebar from "./Settings/Sidebar";

const StorageKey = "Tools";
const AdminOptionVisibleKey = "AdminOptionVisible";

const BodyStyles: {
    Marketplace: React.CSSProperties
} = {
    Marketplace: {
        // display: "grid",
        // gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
        // gap: "0.5rem",
        // justifyContent: "center",
        // alignItems: "center",
        overflow: "auto",
        // padding: "1rem",
        margin: "0",
    }
}

function Settings({
    State,
    Dispatch,
    ModalState,
    SetModalState,
}: {
    State: IToolsState,
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>,

    ModalState: IToolsModalData,
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>,
}) {
    // Safe localStorage access using useEffect
    // React.useEffect(() => {
    //     if (typeof window !== 'undefined') {
    //         const storedAdminKey = localStorage.getItem("adminKey") || "";
    //         SetSettingsState(prev => ({
    //             ...prev,
    //             adminKey: storedAdminKey,
    //             isAdmin: storedAdminKey === "admin123" // Replace with your actual secret key
    //         }));
    //     }
    // }, []);

    // React.useEffect(() => {
    //     if (type === ModelType.Edit && EditBookmarkData) {
    //         const keywords = Array.isArray(EditBookmarkData.keywords)
    //             ? EditBookmarkData.keywords
    //             : [];

    //         SetSettingsState(prev => ({
    //             ...prev,
    //             New_Bookmark: {
    //                 ...EditBookmarkData,
    //                 keywords: keywords
    //             }
    //         }));
    //     }
    // }, [type, EditBookmarkData]);

    // Function to validate URL
    function isValidUrl(url: string) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Verify admin with safe localStorage access
    const verifyAdmin = () => {
        if (windowchek()) {
            // const isAdmin = SettingsState.adminKey === "admin123"; // Replace with your actual secret key

            // if (isAdmin) {
            //     localStorage.setItem("adminKey", SettingsState.adminKey);
            // }

            // SetSettingsState({
            //     ...SettingsState,
            //     isAdmin
            // });

            // return isAdmin;
        }
        return false;
    };

    function LoadBodyStyles() {
        // if (type === ModelType.Marketplace) {
        //     return BodyStyles.Marketplace;
        // }

        return {};
    }

    async function FetchMarketPlaceBookmarks() {
        try {
            const response = (await Axios("/api/bookmarks")).data;

            const ServerBookmarks = response.Data;
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
                    androidapp: bookmark.androidapp,
                    windowsapp: bookmark.windowsapp
                }
            })

            ProcessedBookmarks = ProcessedBookmarks.filter((bookmark: IBookmark) => {
                return !State.Bookmarks.find((b) => b.url === bookmark.url);
            })

            ProcessedBookmarks = ProcessedBookmarks.sort(() => Math.random() - 0.5);

            // SetSettingsState({
            //     ...SettingsState,
            //     MarketPlace: {
            //         ...SettingsState.MarketPlace,
            //         Remote_Bookmarks: ProcessedBookmarks,
            //         isFetched: true
            //     }
            // })
        } catch (error) {
            console.error("Error Fetching Marketplace Bookmarks", error);
        }
    }

    // React.useEffect(() => {
        // if (type === ModelType.Marketplace && !SettingsState.MarketPlace.isFetched) {
        //     FetchMarketPlaceBookmarks();
        // }

        // if (type === ModelType.Create) {
        //     SetSettingsState({
        //         ...SettingsState,
        //         New_Bookmark: {
        //             id: v4(),
        //             name: "",
        //             url: "",
        //             icon: "",
        //             androidapp: "",
        //             windowsapp: "",
        //             description: "",
        //             keywords: [],
        //             SVGStyles: {
        //                 fill: "#000000",
        //             },
        //             isSVGSrc: false,
        //             size: "128",
        //         }
        //     })
        // }
    // }, [
        // type,
    // ])

    // Handle keyword input change
    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // SetSettingsState({
        //     ...SettingsState,
        //     newKeyword: e.target.value
        // });
    };

    // Add a keyword
    const addKeyword = () => {
        // const currentKeyword = SettingsState.newKeyword || "";
        // if (currentKeyword.trim() === "") return;

        // Ensure keywords is an array before checking includes
        // const currentKeywords = Array.isArray(SettingsState.New_Bookmark.keywords)
        //     ? SettingsState.New_Bookmark.keywords
        //     : [];

        // Check if keyword already exists
        // if (currentKeywords.includes(currentKeyword.trim())) {
        //     return;
        // }

        // SetSettingsState({
        //     ...SettingsState,
        //     New_Bookmark: {
        //         ...SettingsState.New_Bookmark,
        //         keywords: [...currentKeywords, currentKeyword.trim()]
        //     },
        //     newKeyword: ""
        // });
    };

    const removeKeyword = (index: number) => {
        // const currentKeywords = Array.isArray(SettingsState.New_Bookmark.keywords)
        //     ? SettingsState.New_Bookmark.keywords
        //     : [];

        // SetSettingsState({
        //     ...SettingsState,
        //     New_Bookmark: {
        //         ...SettingsState.New_Bookmark,
        //         keywords: currentKeywords.filter((_, i) => i !== index)
        //     }
        // });
    };

    function setIsMaximized(isMaximized: boolean) {
        SetModalState({
            ...ModalState,
            isMaximized: isMaximized
        })
    }

    const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addKeyword();
        }
    };

    const SwitchTab = (type: IToolsSettingsTabs) => {
        SetModalState((ModalData) => {
            return {
                ...ModalData,
                type: type,
            }
        });
    }

    return (
        <>
            {/* Settings Model */}
            <Modal
                backdrop="opaque"
                isDismissable={
                    ModalState.type === IToolsSettingsTabs.Edit 
                        || ModalState.type === IToolsSettingsTabs.Create
                        || ModalState.type === IToolsSettingsTabs.AdminCreate
                        || ModalState.type === IToolsSettingsTabs.AdminEdit
                        ? false : true
                }
                isKeyboardDismissDisabled={
                    ModalState.type === IToolsSettingsTabs.Edit
                        || ModalState.type === IToolsSettingsTabs.Create
                        || ModalState.type === IToolsSettingsTabs.AdminCreate
                        || ModalState.type === IToolsSettingsTabs.AdminEdit
                        ? false : true
                }
                isOpen={ModalState.isOpen}
                onClose={() => {
                    SetModalState({
                        ...ModalState,
                        isOpen: false
                    })
                }}  
                hideCloseButton={true}
                size={ModalState.isMaximized ? "full" : "4xl"}
                scrollBehavior="inside"
            >
                <ModalContent
                    className="backdrop-blur-md"
                    style={{
                        height: ModalState.isMaximized ? "95vh" : "70vh",
                        padding: "0",
                        transition: "all 0.3s ease",
                    }}
                >
                    <Header
                        type={ModalState.type}
                        isMaximized={ModalState.isMaximized}
                        onClose={() => {
                            SetModalState({ ...ModalState, isOpen: false })
                        }}
                        setIsMaximized={setIsMaximized}
                    />
                    
                    <ModalBody
                        className="flex flex-row gap-2"
                        style={{
                            overflow: "hidden"
                        }}
                    >

                        {/* Sidebar Menu */}
                        <Sidebar
                            SwitchTab={SwitchTab}
                            type={ModalState.type}
                        />

                        {/* Main Content */}
                        <div
                            className={
                                cn(
                                    type === IToolsSettingsTabs.Marketplace ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-2 py-16 HideScrollbars" : "",
                                    type === IToolsSettingsTabs.Preferences ? "flex flex-col gap-3 px-2 py-16 HideScrollbars" : "",
                                    type === IToolsSettingsTabs.About ? "flex flex-col gap-3 px-2 py-16 HideScrollbars" : "",
                                    type === IToolsSettingsTabs.Edit ? "flex flex-col md:flex-row gap-1 px-2 py-16 HideScrollbars" : "",
                                    type === IToolsSettingsTabs.Create ? "flex flex-col md:flex-row gap-1 px-2 py-16 HideScrollbars" : "",
                                    type === IToolsSettingsTabs.RequestBookmark ? "flex flex-col gap-3 px-2 py-16 HideScrollbars" : "",
                                    type === IToolsSettingsTabs.Requests ? "flex flex-col gap-3 px-2 py-16 HideScrollbars" : "",
                                    type === IToolsSettingsTabs.Bookmarks ? "flex flex-col gap-3 px-2 py-16 HideScrollbars" : "",
                                )
                            }

                            style={{
                                width: "100%",
                                overflow: "auto",
                                height: "100%",
                                ...LoadBodyStyles()
                            }}
                        >

                            {
                                (type === ModelType.Create || type === ModelType.Edit) && (
                                    <>
                                        <div className="flex flex-col gap-3 h-full w-full overflow-y-auto md:w-3/4 sm:w-full">

                                            {/* Create & Edit Menus Here */}
                                            <Input
                                                label="Name"
                                                placeholder="Name of Bookmark"
                                                value={SettingsState.New_Bookmark.name}
                                                isRequired
                                                isInvalid={SettingsState.New_Bookmark.name === ""}
                                                errorMessage={SettingsState.New_Bookmark.name === "" ? "Bookmark name is required" : ""}
                                                onChange={(e) => {
                                                    SetSettingsState({
                                                        ...SettingsState,
                                                        New_Bookmark: {
                                                            ...SettingsState.New_Bookmark,
                                                            name: e.target.value
                                                        }
                                                    });
                                                }}
                                            />

                                            <Input
                                                label="URL"
                                                placeholder="URL of Bookmark"
                                                value={SettingsState.New_Bookmark.url}
                                                isRequired
                                                isInvalid={SettingsState.New_Bookmark.url !== "" && !isValidUrl(SettingsState.New_Bookmark.url)}
                                                errorMessage={SettingsState.New_Bookmark.url !== "" && !isValidUrl(SettingsState.New_Bookmark.url) ? "Please enter a valid URL" : ""}
                                                onChange={(e) => {
                                                    SetSettingsState({
                                                        ...SettingsState,
                                                        New_Bookmark: {
                                                            ...SettingsState.New_Bookmark,
                                                            url: e.target.value
                                                        }
                                                    });
                                                }}
                                            />

                                            <Input
                                                label="Icon"
                                                placeholder="Icon URL"
                                                value={SettingsState.New_Bookmark.icon}
                                                onChange={(e) => {
                                                    SetSettingsState({
                                                        ...SettingsState,
                                                        New_Bookmark: {
                                                            ...SettingsState.New_Bookmark,
                                                            icon: e.target.value
                                                        }
                                                    });
                                                }}
                                            />

                                            <Input
                                                label="Android App"
                                                placeholder="Android App URL"
                                                value={SettingsState.New_Bookmark.androidapp ?? ""}
                                                onChange={(e) => {
                                                    SetSettingsState({
                                                        ...SettingsState,
                                                        New_Bookmark: {
                                                            ...SettingsState.New_Bookmark,
                                                            androidapp: e.target.value
                                                        }
                                                    });
                                                }}
                                            />

                                            <Input
                                                label="Windows App"
                                                placeholder="Windows App URL"
                                                value={SettingsState.New_Bookmark.windowsapp ?? ""}
                                                onChange={(e) => {
                                                    SetSettingsState({
                                                        ...SettingsState,
                                                        New_Bookmark: {
                                                            ...SettingsState.New_Bookmark,
                                                            windowsapp: e.target.value
                                                        }
                                                    });
                                                }}
                                            />

                                            <Input
                                                label="Note"
                                                placeholder="Description of Bookmark"
                                                value={SettingsState.New_Bookmark.description ?? ""}
                                                onChange={(e) => {
                                                    SetSettingsState({
                                                        ...SettingsState,
                                                        New_Bookmark: {
                                                            ...SettingsState.New_Bookmark,
                                                            description: e.target.value
                                                        }
                                                    });
                                                }}
                                            />

                                            {/* Toggle for SVG Source */}
                                            <div className="flex items-center justify-between mt-4 mx-2">
                                                <span className="text-sm">Is SVG Source</span>
                                                <Switch
                                                    size="sm"
                                                    isSelected={SettingsState.New_Bookmark.isSVGSrc}
                                                    onValueChange={(value) => {
                                                        SetSettingsState({
                                                            ...SettingsState,
                                                            New_Bookmark: {
                                                                ...SettingsState.New_Bookmark,
                                                                isSVGSrc: value
                                                            }
                                                        });
                                                    }}
                                                />
                                            </div>

                                            {/* SVG Settings if it's an SVG */}
                                            {SettingsState.New_Bookmark.isSVGSrc && (
                                                <div className="flex flex-col gap-2 mt-4">
                                                    <h3 className="text-sm font-medium">SVG Settings</h3>
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs">Fill Color:</label>
                                                        <input
                                                            type="color"
                                                            value={SettingsState.New_Bookmark.SVGStyles?.fill || "#000000"}
                                                            onChange={(e) => {
                                                                SetSettingsState({
                                                                    ...SettingsState,
                                                                    New_Bookmark: {
                                                                        ...SettingsState.New_Bookmark,
                                                                        SVGStyles: {
                                                                            ...SettingsState.New_Bookmark.SVGStyles,
                                                                            fill: e.target.value
                                                                        }
                                                                    }
                                                                });
                                                            }}
                                                            className="w-8 h-8 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <Input
                                                label="Keywords"
                                                placeholder="Add keyword"
                                                value={SettingsState.newKeyword}
                                                onChange={handleKeywordChange}
                                                endContent={
                                                    <Button
                                                        isIconOnly
                                                        color="primary"
                                                        variant="flat"
                                                        size="sm"
                                                        onPress={addKeyword}
                                                    >
                                                        <AddCircle />
                                                    </Button>
                                                }
                                            />

                                            {/* Draggable Keywords List using react-grid-dnd */}
                                            <GridContextProvider onChange={(
                                                sourceId,
                                                sourceIndex,
                                                targetIndex,
                                                targetId
                                            ) => {
                                                // ? Update the keywords array based on the sourceId, sourceIndex, targetIndex, targetId
                                                SetSettingsState({
                                                    ...SettingsState,
                                                    New_Bookmark: {
                                                        ...SettingsState.New_Bookmark,
                                                        keywords: [
                                                            ...(SettingsState.New_Bookmark?.keywords?.filter((_, i) => i !== sourceIndex) || []),
                                                            ...(SettingsState.New_Bookmark?.keywords?.filter((_, i) => i === targetIndex) || [])
                                                        ]
                                                    }
                                                });
                                            }}>
                                                <GridDropZone
                                                    id="keywords"
                                                    boxesPerRow={1}
                                                    rowHeight={50}
                                                    style={{ minHeight: "50px" }}
                                                >
                                                    {(Array.isArray(SettingsState.New_Bookmark.keywords)
                                                        ? SettingsState.New_Bookmark.keywords
                                                        : []).map((keyword, index) => (
                                                            <GridItem key={index} className="flex items-center gap-2 p-2 bg-content1 rounded-md border border-content2">
                                                                <span className="flex-grow text-sm truncate">{keyword}</span>
                                                                <Button
                                                                    isIconOnly
                                                                    color="danger"
                                                                    variant="light"
                                                                    size="sm"
                                                                    onPress={() => removeKeyword(index)}
                                                                >
                                                                    <Delete style={{ fontSize: '16px' }} />
                                                                </Button>
                                                            </GridItem>
                                                        ))}
                                                    {(!SettingsState.New_Bookmark.keywords ||
                                                        !Array.isArray(SettingsState.New_Bookmark.keywords) ||
                                                        SettingsState.New_Bookmark.keywords.length === 0) && (
                                                            <div className="text-center p-2 text-gray-400 text-sm">
                                                                No keywords added
                                                            </div>
                                                        )}
                                                </GridDropZone>
                                            </GridContextProvider>
                                        </div>

                                        <div className="flex flex-col gap-3 h-full md:block" style={{ width: "28%" }}>
                                            {/* ? Preview of Icon Image */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-32 h-32">
                                                    {
                                                        SettingsState.New_Bookmark.icon && (
                                                            SettingsState.New_Bookmark.isSVGSrc ? (
                                                                <SvgComponent
                                                                    _class="w-full h-full rounded object-cover border border-gray-300 dark:border-gray-700"
                                                                    svgString={SettingsState.New_Bookmark.icon}
                                                                    style={{
                                                                        borderRadius: "15px",
                                                                        userSelect: "none",
                                                                        MozWindowDragging: "no-drag",
                                                                        color: SettingsState.New_Bookmark.SVGStyles?.fill ?? "black",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={SettingsState.New_Bookmark.icon}
                                                                    className="w-full h-full rounded object-cover border border-gray-300 dark:border-gray-700"
                                                                    alt={SettingsState.New_Bookmark.name}
                                                                    style={{
                                                                        borderRadius: "15px",
                                                                        userSelect: "none",
                                                                        MozWindowDragging: "no-drag",
                                                                    }}
                                                                    onDragStart={(e) => e.preventDefault()}
                                                                />
                                                            )
                                                        )
                                                    }

                                                    {
                                                        !SettingsState.New_Bookmark.icon && (
                                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 rounded dark:bg-zinc-800 dark:text-zinc-500">
                                                                No Icon
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">Preview</p>
                                            </div>
                                        </div>
                                    </>
                                )
                            }
                            {
                                type === ModelType.Marketplace && (
                                    <>
                                        <div className="w-full mb-4 px-2">
                                            <Input
                                                placeholder="Search bookmarks..."
                                                value={SettingsState.MarketPlace.Serch_Bookmarks_Query}
                                                onChange={(e) => {
                                                    SetSettingsState({
                                                        ...SettingsState,
                                                        MarketPlace: {
                                                            ...SettingsState.MarketPlace,
                                                            Serch_Bookmarks_Query: e.target.value
                                                        }
                                                    });
                                                }}
                                                startContent={<Search />}
                                                isClearable
                                            />
                                        </div>

                                        {/* Filter bookmarks based on search query */}
                                        {
                                            SettingsState.MarketPlace.Remote_Bookmarks
                                                .filter(bookmark =>
                                                    SettingsState.MarketPlace.Serch_Bookmarks_Query === "" ||
                                                    bookmark.name.toLowerCase().includes(SettingsState.MarketPlace.Serch_Bookmarks_Query.toLowerCase()) ||
                                                    (bookmark.keywords || []).some(keyword =>
                                                        keyword.toLowerCase().includes(SettingsState.MarketPlace.Serch_Bookmarks_Query.toLowerCase())
                                                    )
                                                )
                                                .map((bookmark) => (
                                                    <div key={bookmark.id} style={{
                                                        zIndex: 0,
                                                    }}>
                                                        <div
                                                            style={{
                                                                margin: "7px",
                                                                padding: "10px",
                                                                position: "relative",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                backgroundColor: "var(--bookmark)",
                                                                textAlign: "center",
                                                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                                                                border: "1px solid var(--bookmark-border)",
                                                                borderRadius: "8px",
                                                                transition: "transform 0.2s ease",
                                                                cursor: "pointer",
                                                                wordWrap: "normal",
                                                                userSelect: "none"
                                                            }}
                                                            onClick={() => {
                                                                if (State.Bookmarks.find((b) => b.url === bookmark.url)) {
                                                                    SetSettingsState({
                                                                        ...SettingsState,
                                                                        MarketPlace: {
                                                                            ...SettingsState.MarketPlace,
                                                                            Remote_Bookmarks: SettingsState.MarketPlace.Remote_Bookmarks.filter((b) => b.id !== bookmark.id)
                                                                        }
                                                                    });
                                                                    return;
                                                                }

                                                                Dispatch({
                                                                    ...State,
                                                                    Bookmarks: [
                                                                        ...State.Bookmarks,
                                                                        bookmark
                                                                    ],
                                                                    FilterBookmarks: [
                                                                        ...State.FilterBookmarks,
                                                                        bookmark
                                                                    ],
                                                                    Query: "",
                                                                    QueryDisplay: "",
                                                                })
                                                                SetSettingsState({
                                                                    ...SettingsState,
                                                                    MarketPlace: {
                                                                        ...SettingsState.MarketPlace,
                                                                        Remote_Bookmarks: SettingsState.MarketPlace.Remote_Bookmarks.filter((b) => b.id !== bookmark.id)
                                                                    }
                                                                });
                                                            }}
                                                        >
                                                            {bookmark.icon && (
                                                                <div className="Icon">
                                                                    {
                                                                        bookmark.isSVGSrc && (
                                                                            <SvgComponent
                                                                                _class="SVGComponent"
                                                                                svgString={bookmark.icon}
                                                                                style={{
                                                                                    borderRadius: "15px",
                                                                                    userSelect: "none",
                                                                                    MozWindowDragging: "no-drag",
                                                                                    width: "64px",
                                                                                    height: "64px",
                                                                                    color: bookmark.SVGStyles?.fill ?? "black",
                                                                                }} />
                                                                        )
                                                                    }
                                                                    {
                                                                        !bookmark.isSVGSrc && (<Image
                                                                            src={ResolveIcon(bookmark)}
                                                                            alt={bookmark.name}
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
                                                            <h2 className="bookmarkTitle">{bookmark.name}</h2>
                                                        </div>
                                                    </div>
                                                ))
                                        }

                                        {
                                            (SettingsState.MarketPlace.isFetched && SettingsState.MarketPlace.Remote_Bookmarks.length) === 0 && (
                                                <div className="flex flex-row gap-2 max-w-4xl bg-content1 items-center select-none p-4 border-2 border-transparent rounded-lg">
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-medium">No Bookmarks Found</p>
                                                        <p className="text-tiny text-default-400">No Bookmarks Found in Marketplace</p>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {
                                            (!SettingsState.MarketPlace.isFetched && SettingsState.MarketPlace.Remote_Bookmarks.length) === 0 && (
                                                <>
                                                    {[...Array(6)].map((_, index) => (
                                                        <Card key={index} className="w-[200px] h-[165px] space-y-5 p-4" radius="lg" shadow="sm">
                                                            <Skeleton className="rounded-lg">
                                                                <div className="h-24 rounded-lg bg-default-300" />
                                                            </Skeleton>
                                                            <div className="space-y-3">
                                                                <Skeleton className="w-5/5 rounded-lg">
                                                                    <div className="h-3 w-5/5 rounded-lg bg-default-200" />
                                                                </Skeleton>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </>
                                            )
                                        }
                                    </>
                                )
                            }
                            {
                                type === ModelType.Settings && (
                                    <>
                                        {/* <div
                                            className={
                                                cn(
                                                    "inline-flex max-w-4xl bg-content1 hover:bg-content2 items-center select-none",
                                                    "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
                                                )
                                            }
                                        >
                                            <Select
                                                selectedKeys={[State.Settings.SearchEngine]}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    Dispatch({
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
                                                        <SelectItem key={engine}>
                                                            {engine}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </Select>
                                        </div>

                                        <div
                                            className={
                                                cn(
                                                    "inline-flex max-w-4xl bg-content1 hover:bg-content2 items-center select-none",
                                                    "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
                                                )
                                            }
                                        >
                                            <Select
                                                className="mt-1"
                                                selectedKeys={[State.Settings.Locale]}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                    if (e.target.value === "") {
                                                        return;
                                                    }
                                                    Dispatch({
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
                                                        <SelectItem key={locale}>
                                                            {locale}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </Select>
                                        </div> */}

                                        <Switch
                                            classNames={{
                                                base: cn(
                                                    "inline-flex flex-row-reverse max-w-4xl bg-content1 hover:bg-content2 items-center",
                                                    "justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent",
                                                ),
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: cn(
                                                    "w-6 h-6 border-2 shadow-lg",
                                                    "group-data-[hover=true]:border-secondary",
                                                    //selected
                                                    "group-data-[selected=true]:ms-6",
                                                    // pressed
                                                    "group-data-[pressed=true]:w-7",
                                                    "group-data-[selected]:group-data-[pressed]:ms-4",
                                                ),
                                            }}
                                            style={{
                                                width: "100%",
                                            }}
                                            color="secondary"
                                            isSelected={!State.Settings.isNewTab}
                                            onValueChange={(value) => {
                                                Dispatch({
                                                    ...State,
                                                    Settings: {
                                                        ...State.Settings,
                                                        isNewTab: !value
                                                    },
                                                });
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="text-medium">Open in Current Tab</p>
                                                <p className="text-tiny text-default-400">
                                                    {
                                                        State.Settings.isNewTab ? "Enabled : open bookmarks in the current tab" : "Disabled : open bookmarks in a newly created tab"
                                                    }
                                                </p>
                                            </div>
                                        </Switch>

                                        <Switch
                                            classNames={{
                                                base: cn(
                                                    "inline-flex flex-row-reverse max-w-4xl bg-content1 hover:bg-content2 items-center",
                                                    "justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent",
                                                ),
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: cn(
                                                    "w-6 h-6 border-2 shadow-lg",
                                                    "group-data-[hover=true]:border-secondary",
                                                    //selected
                                                    "group-data-[selected=true]:ms-6",
                                                    // pressed
                                                    "group-data-[pressed=true]:w-7",
                                                    "group-data-[selected]:group-data-[pressed]:ms-4",
                                                ),
                                            }}
                                            style={{
                                                width: "100%",
                                            }}
                                            color="secondary"
                                            isSelected={State.Settings.CloudSync}
                                            onValueChange={(value) => {
                                                Dispatch({
                                                    ...State,
                                                    Settings: {
                                                        ...State.Settings,
                                                        CloudSync: value
                                                    },
                                                });
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="text-medium">Marketplace Sync</p>
                                                <p className="text-tiny text-default-400">
                                                    {
                                                        State.Settings.CloudSync ? "Disabled : Offline Bookmarks only or Manually add from Marketplace" : "Enabled : Automatically Adds Bookmarks from Published Database"
                                                    }
                                                </p>
                                            </div>
                                        </Switch>

                                        <Switch
                                            classNames={{
                                                base: cn(
                                                    "inline-flex flex-row-reverse max-w-4xl bg-content1 hover:bg-content2 items-center",
                                                    "justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent z-0",
                                                ),
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: cn(
                                                    "w-6 h-6 border-2 shadow-lg",
                                                    "group-data-[hover=true]:border-secondary",
                                                    //selected
                                                    "group-data-[selected=true]:ms-6",
                                                    // pressed
                                                    "group-data-[pressed=true]:w-7",
                                                    "group-data-[selected]:group-data-[pressed]:ms-4",
                                                ),
                                            }}
                                            style={{
                                                width: "100%",
                                            }}
                                            color="secondary"
                                            isSelected={!State.Settings.CloudSyncRandomize}
                                            onValueChange={(value) => {
                                                Dispatch({
                                                    ...State,
                                                    Settings: {
                                                        ...State.Settings,
                                                        CloudSyncRandomize: !value
                                                    },
                                                });
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="text-medium">Disable Sorting for Marketplace Items</p>
                                                <p className="text-tiny text-default-400">
                                                    Note : this Option is only work when Marketplace Sync is Enabled
                                                </p>
                                                <p className="text-tiny text-default-400">
                                                    {
                                                        State.Settings.CloudSyncRandomize ? "Disabled : Priority Bookmarks can be Top if not avilable on marketplace" : "Enabled : Randomize the order of Bookmarks from Marketplace"
                                                    }
                                                </p>
                                            </div>
                                        </Switch>

                                        <Switch
                                            classNames={{
                                                base: cn(
                                                    "inline-flex flex-row-reverse max-w-4xl bg-content1 hover:bg-content2 items-center",
                                                    "justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent",
                                                ),
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: cn(
                                                    "w-6 h-6 border-2 shadow-lg",
                                                    "group-data-[hover=true]:border-secondary",
                                                    //selected
                                                    "group-data-[selected=true]:ms-6",
                                                    // pressed
                                                    "group-data-[pressed=true]:w-7",
                                                    "group-data-[selected]:group-data-[pressed]:ms-4",
                                                ),
                                            }}
                                            style={{
                                                width: "100%",
                                            }}
                                            color="secondary"
                                            isSelected={State.Settings.priorityWindowsApp}
                                            onValueChange={(value) => {
                                                Dispatch({
                                                    ...State,
                                                    Settings: {
                                                        ...State.Settings,
                                                        priorityWindowsApp: value
                                                    },
                                                });
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="text-medium">Open in Windows</p>
                                                <p className="text-tiny text-default-400">
                                                    {
                                                        State.Settings.priorityWindowsApp ? "Disabled : You can't able to open in windows option on context menu" : "Enabled : You can able to open in windows option on context menu"
                                                    }
                                                </p>
                                            </div>
                                        </Switch>

                                        <Switch
                                            classNames={{
                                                base: cn(
                                                    "inline-flex flex-row-reverse max-w-4xl bg-content1 hover:bg-content2 items-center",
                                                    "justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent",
                                                ),
                                                wrapper: "p-0 h-4 overflow-visible",
                                                thumb: cn(
                                                    "w-6 h-6 border-2 shadow-lg",
                                                    "group-data-[hover=true]:border-secondary",
                                                    //selected
                                                    "group-data-[selected=true]:ms-6",
                                                    // pressed
                                                    "group-data-[pressed=true]:w-7",
                                                    "group-data-[selected]:group-data-[pressed]:ms-4",
                                                ),
                                            }}
                                            style={{
                                                width: "100%",
                                            }}
                                            color="secondary"
                                            isSelected={State.Settings.priorityAndroidapp}
                                            onValueChange={(value) => {
                                                Dispatch({
                                                    ...State,
                                                    Settings: {
                                                        ...State.Settings,
                                                        priorityAndroidapp: value
                                                    },
                                                });
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="text-medium">Open in Andorid</p>
                                                <p className="text-tiny text-default-400">
                                                    {
                                                        State.Settings.priorityAndroidapp ? "Disabled : You can't able to open in android option on context menu" : "Enabled : You can able to open in android option on context menu"
                                                    }
                                                </p>
                                            </div>
                                        </Switch>

                                        {
                                            Config.Environment === "development" && (
                                                <div
                                                    className={
                                                        cn(
                                                            "inline-flex max-w-4xl bg-content1 hover:bg-content2 items-center select-none",
                                                            "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
                                                        )
                                                    }
                                                >
                                                    <div>
                                                        Sync Database with Static Data
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

                                    </>
                                )
                            }
                            {
                                type === ModelType.Request && (
                                    <>
                                        <p className="text-sm text-gray-500">All requests are anonymous</p>

                                        <Input
                                            label="Bookmark Name"
                                            placeholder="Enter bookmark name"
                                            value={SettingsState.newRequest.name}
                                            onChange={(e) => {
                                                SetSettingsState({
                                                    ...SettingsState,
                                                    newRequest: {
                                                        ...SettingsState.newRequest,
                                                        name: e.target.value
                                                    }
                                                });
                                            }}
                                        />

                                        <Input
                                            label="URL"
                                            placeholder="Enter bookmark URL"
                                            value={SettingsState.newRequest.url}
                                            onChange={(e) => {
                                                SetSettingsState({
                                                    ...SettingsState,
                                                    newRequest: {
                                                        ...SettingsState.newRequest,
                                                        url: e.target.value
                                                    }
                                                });
                                            }}
                                        />

                                        <Textarea
                                            label="Description"
                                            placeholder="Why do you want this bookmark added?"
                                            value={SettingsState.newRequest.description}
                                            onChange={(e: any) => {
                                                SetSettingsState({
                                                    ...SettingsState,
                                                    newRequest: {
                                                        ...SettingsState.newRequest,
                                                        description: e.target.value
                                                    }
                                                });
                                            }}
                                        />

                                        <Button
                                            color="primary"
                                            onClick={() => {
                                                // Submit request logic
                                                toast.success("Request submitted successfully");
                                                SetSettingsState({
                                                    ...SettingsState,
                                                    newRequest: {
                                                        name: "",
                                                        url: "",
                                                        description: ""
                                                    }
                                                });
                                            }}
                                        >
                                            Submit Request
                                        </Button>
                                    </>
                                )
                            }
                            {
                                type === ModelType.Requests && (
                                    <div className="flex flex-col gap-3 px-2 py-16 HideScrollbars">
                                        <Tabs>
                                            <Tab key="all" title="All Requests">
                                                {/* All requests content */}
                                            </Tab>
                                            <Tab key="pending" title="Pending Requests">
                                                {/* Pending requests content */}
                                            </Tab>
                                            <Tab key="approved" title="Approved Requests">
                                                {/* Approved requests content */}
                                            </Tab>
                                            <Tab key="rejected" title="Rejected Requests">
                                                {/* Rejected requests content */}
                                            </Tab>
                                        </Tabs>
                                    </div>
                                )
                            }
                            {
                                type === ModelType.Admin && (
                                    <div className="flex flex-col gap-3 px-2 py-16 HideScrollbars">
                                        {!SettingsState.isAdmin ? (
                                            <div className="admin-auth">
                                                <Input
                                                    type="password"
                                                    label="Admin Key"
                                                    placeholder="Enter admin key"
                                                    value={SettingsState.adminKey}
                                                    onChange={(e) => {
                                                        SetSettingsState({
                                                            ...SettingsState,
                                                            adminKey: e.target.value
                                                        });
                                                    }}
                                                />
                                                <Button
                                                    color="primary"
                                                    onClick={verifyAdmin}
                                                >
                                                    Verify
                                                </Button>
                                            </div>
                                        ) : (
                                            <Tabs>
                                                <Tab key="publish" title="Publish & Unpublish">
                                                    {/* Publish/Unpublish content */}
                                                </Tab>
                                                <Tab key="delete" title="Delete Bookmarks">
                                                    {/* Delete bookmarks content */}
                                                </Tab>
                                                <Tab key="edit" title="Edit Bookmarks">
                                                    {/* Edit bookmarks content */}
                                                </Tab>
                                                <Tab key="add" title="Add New Bookmarks">
                                                    {/* Add bookmarks content */}
                                                </Tab>
                                            </Tabs>
                                        )}
                                    </div>
                                )
                            }
                        </div>

                    </ModalBody>
                    <ModalFooter
                        className="backdrop-blur-md py-1"
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            zIndex: 11,
                            borderRadius: "0 0 0.5rem 0.5rem",
                        }}
                    >
                        {
                            type === ModelType.Edit && (
                                <Tooltip content={"Save Changes"} placement="top">
                                    <Button
                                        isIconOnly
                                        color="primary"
                                        onPress={() => {
                                            // Validate form before saving
                                            if (!SettingsState.New_Bookmark.name.trim()) {
                                                toast.error("Bookmark name is required");
                                                return;
                                            }

                                            if (!isValidUrl(SettingsState.New_Bookmark.url)) {
                                                toast.error("Please enter a valid URL");
                                                return;
                                            }

                                            // Existing save logic
                                            const index = State.Bookmarks.findIndex((b) => b.id === EditBookmarkData?.id);
                                            if (index === -1) {
                                                return;
                                            }

                                            Dispatch({
                                                ...State,
                                                Bookmarks: [
                                                    ...State.Bookmarks.slice(0, index),
                                                    SettingsState.New_Bookmark,
                                                    ...State.Bookmarks.slice(index + 1)
                                                ],
                                                FilterBookmarks: [
                                                    ...State.FilterBookmarks.slice(0, index),
                                                    SettingsState.New_Bookmark,
                                                    ...State.FilterBookmarks.slice(index + 1)
                                                ],
                                                Query: "",
                                                QueryDisplay: "",
                                            })

                                            onClose();
                                        }}
                                        variant="light"
                                    >
                                        <Save />
                                    </Button>
                                </Tooltip>
                            )
                        }
                        {
                            type === ModelType.Create && (
                                <Tooltip content={"Add New Bookmark"} placement="top">
                                    <Button
                                        isIconOnly
                                        color="success"
                                        onPress={() => {
                                            // Validate form before adding
                                            if (!SettingsState.New_Bookmark.name.trim()) {
                                                toast.error("Bookmark name is required");
                                                return;
                                            }

                                            if (!isValidUrl(SettingsState.New_Bookmark.url)) {
                                                toast.error("Please enter a valid URL");
                                                return;
                                            }

                                            // Ensure keywords is an array
                                            const bookmarkToAdd = {
                                                ...SettingsState.New_Bookmark,
                                                keywords: Array.isArray(SettingsState.New_Bookmark.keywords)
                                                    ? SettingsState.New_Bookmark.keywords
                                                    : []
                                            };

                                            Dispatch({
                                                ...State,
                                                Bookmarks: [
                                                    ...State.Bookmarks,
                                                    bookmarkToAdd
                                                ],
                                                FilterBookmarks: [
                                                    ...State.FilterBookmarks,
                                                    bookmarkToAdd
                                                ],
                                                Query: "",
                                                QueryDisplay: "",
                                            });

                                            SetSettingsState({
                                                ...SettingsState,
                                                New_Bookmark: {
                                                    id: v4(),
                                                    name: "",
                                                    url: "",
                                                    icon: "",
                                                    androidapp: "",
                                                    windowsapp: "",
                                                    description: "",
                                                    keywords: [],
                                                    SVGStyles: {
                                                        fill: "#000000",
                                                    },
                                                    isSVGSrc: false,
                                                    size: "128",
                                                }
                                            });

                                            onClose();
                                        }}
                                        variant="light"
                                    >
                                        <Add />
                                    </Button>
                                </Tooltip>
                            )
                        }

                        {
                            (type === ModelType.Create || type === ModelType.Edit) && (
                                <Tooltip content="Reset" placement="top">
                                    <Button isIconOnly color="secondary" variant="light" onPress={() => {
                                        SetSettingsState({
                                            ...SettingsState,
                                            New_Bookmark: {
                                                name: "",
                                                url: "",
                                                icon: "",
                                                androidapp: "",
                                                windowsapp: "",
                                                description: "",
                                                keywords: [],
                                                SVGStyles: {
                                                    fill: "#000000",
                                                },
                                                isSVGSrc: false,
                                                size: "128",
                                            }
                                        })
                                        return;
                                    }}>
                                        <Restore />
                                    </Button>
                                </Tooltip>
                            )
                        }

                        {
                            type === ModelType.Marketplace && (
                                <Tooltip content="Remove All Bookmarks" placement="top">
                                    <Button isIconOnly color="secondary" variant="light" onPress={() => {
                                        localStorage.removeItem(StorageKey);
                                        Dispatch({
                                            ...State,
                                            FilterBookmarks: [],
                                            Bookmarks: [],
                                        })
                                    }}>
                                        <Restore />
                                    </Button>
                                </Tooltip>
                            )
                        }

                        <Tooltip content="Close" placement="top">
                            <Button isIconOnly color="danger" variant="light" onPress={onClose}>
                                <Close />
                            </Button>
                        </Tooltip>

                    </ModalFooter>
                </ModalContent>
            </Modal >
        </>
    );
}

export default Settings;