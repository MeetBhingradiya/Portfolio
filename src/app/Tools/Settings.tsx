/**
 *  @FileID          app\Tools\Settings.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.9
 *  -----------------------------------------------------------------------------
 *  @created 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 *  @modified 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
 */


"use client";

import React from "react";
import {
    IBookmark,
    ILocale,
    ISearchEngine,
    ModelType,
    SettingsProps,
    SettingsState
} from "@Types/Tools";
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
    Skeleton
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
    BookmarkOutlined
} from "@mui/icons-material";
import { Axios } from "@/Utils/Axios";
import { Config } from "@/Config";
import SvgComponent from "@/Components/SVGComponent";
import { ResolveIcon } from "@/Data/Tools";
import Image from "next/image";
import { v4 } from "uuid";

const StorageKey = "Tools";

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
    isOpen,
    onClose,
    type,
    State,
    Dispatch,
    EditBookmarkData,
    SwitchModelType
}: SettingsProps) {
    const [SettingsState, SetSettingsState] = React.useState<SettingsState>({
        MarketPlace: {
            Remote_Bookmarks: [],
            Serch_Bookmarks_Query: "",
            isFetched: false
        },
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
        },
        Search_Settings_Query: ""
    });

    function LoadBodyStyles() {
        if (type === ModelType.Marketplace) {
            return BodyStyles.Marketplace;
        }

        return {};
    }

    async function FetchMarketPlaceBookmarks() {
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
                }
            })

            ProcessedBookmarks = ProcessedBookmarks.filter((bookmark: IBookmark) => {
                return !State.Bookmarks.find((b) => b.url === bookmark.url);
            })

            ProcessedBookmarks = ProcessedBookmarks.sort(() => Math.random() - 0.5);


            SetSettingsState({
                ...SettingsState,
                MarketPlace: {
                    ...SettingsState.MarketPlace,
                    Remote_Bookmarks: ProcessedBookmarks,
                    isFetched: true
                }
            })
        } catch (error) {
            console.error("Error Fetching Marketplace Bookmarks", error);
        }
    }

    React.useEffect(() => {
        if (type === ModelType.Marketplace && !SettingsState.MarketPlace.isFetched) {
            FetchMarketPlaceBookmarks();
        }

        if (type === ModelType.Edit && EditBookmarkData) {
            SetSettingsState({
                ...SettingsState,
                New_Bookmark: EditBookmarkData
            })
        }

        if (type === ModelType.Create) {
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
            })
        }
    }, [
        type,
    ])

    return (
        <>
            {/* Settings Model */}
            <Modal
                backdrop="opaque"
                isDismissable={
                    type === ModelType.Edit || type === ModelType.Create ? false : true
                }
                isKeyboardDismissDisabled={
                    type === ModelType.Edit || type === ModelType.Create ? false : true
                }
                isOpen={isOpen}
                onClose={onClose}
                hideCloseButton={
                    // type === ModelType.Edit || type === ModelType.Create ? true : false
                    true
                }
                size="4xl"
                scrollBehavior="inside"
            >
                <ModalContent
                    className="backdrop-blur-md"
                    style={{
                        height: "70vh",
                        padding: "0",
                    }}
                >
                    <ModalHeader
                        className="flex flex-row gap-5 py-4 backdrop-blur-md"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 11,
                            borderRadius: "0.5rem 0.5rem 0 0",
                        }}
                    >
                        {/* Mac Close Buttons Theme */}
                        <div className="flex flex-row gap-1 items-center mr-3">
                            <Tooltip content="Close" placement="top">
                                <div className="h-3 w-3 bg-red-500 rounded-full cursor-pointer" onClick={onClose}></div>
                            </Tooltip>
                            {/* <Tooltip content="Minimize" placement="top">
                                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                            </Tooltip> */}
                            <Tooltip content="Maximize" placement="top">
                                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                            </Tooltip>
                            <Tooltip content="Save" placement="top">
                                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                            </Tooltip>
                        </div>

                        {/* Titles */}
                        {
                            type === ModelType.Edit && (
                                <div className="flex flex-row gap-2 leading-6">
                                    <Bookmark />
                                    Edit Bookmark
                                </div>
                            )
                        }
                        {
                            type === ModelType.Create && (
                                <div className="flex flex-row gap-2 leading-6">
                                    <Book />
                                    New Bookmark
                                </div>
                            )
                        }
                        {
                            type === ModelType.Settings && (
                                <div className="flex flex-row gap-2 leading-6">
                                    <SettingsIcon />
                                    Settings
                                </div>
                            )
                        }
                        {
                            type === ModelType.Marketplace && (
                                <div className="flex flex-row gap-2 leading-6">
                                    <LocalMall />
                                    Marketplace
                                </div>
                            )
                        }
                        {
                            type === ModelType.About && (
                                <div className="flex flex-row gap-2 leading-6">
                                    <Info />
                                    About
                                </div>
                            )
                        }
                    </ModalHeader>
                    <ModalBody
                        className="flex flex-row gap-2"
                        style={{
                            overflow: "hidden"
                        }}
                    >

                        {/* Sidebar Menu */}
                        <div className="flex flex-col gap-3 p-2 top-0 mt-12" style={{ width: "28%" }}>
                            {
                                type === ModelType.Edit && (<div
                                    className="flex select-none p-1 flex-row gap-2 items-center justify-start cursor-pointer"
                                    onClick={() => {
                                        SwitchModelType(ModelType.Edit);
                                    }}
                                >
                                    {
                                        type === ModelType.Edit ? <Bookmark /> : <BookmarkOutlined />
                                    }
                                    Edit Bookmark
                                </div>)
                            }
                            <div
                                className="flex select-none p-1 flex-row gap-2 items-center justify-start cursor-pointer"
                                onClick={() => {
                                    SwitchModelType(ModelType.Create);
                                }}
                            >
                                {
                                    type === ModelType.Create ? <Book /> : <BookOutlined />
                                }
                                Add Bookmark
                            </div>
                            <div
                                className="flex select-none p-1 flex-row gap-2 items-center justify-start cursor-pointer"
                                onClick={() => {
                                    SwitchModelType(ModelType.Marketplace);
                                }}
                            >
                                {
                                    type === ModelType.Marketplace ? <LocalMall /> : <LocalMallOutlined />
                                }
                                Marketplace
                            </div>
                            <div
                                className="flex select-none p-1 flex-row gap-2 items-center justify-start cursor-pointer"
                                onClick={() => {
                                    SwitchModelType(ModelType.Settings);
                                }}
                            >
                                {
                                    type === ModelType.Settings ? <SettingsIcon /> : <SettingsOutlined />
                                }
                                Settings
                            </div>
                            {/* <div
                                className="flex select-none p-1 flex-row gap-2 items-center justify-start cursor-pointer"
                                onClick={() => {
                                    SwitchModelType(ModelType.About);
                                }}>
                                {
                                    type === ModelType.About ? <Info /> : <InfoOutlined />
                                }
                                About
                            </div> */}
                        </div>

                        {/* Main Content */}
                        <div
                            className={
                                cn(
                                    type === ModelType.Marketplace ? "grid grid-cols-4 px-2 py-16 HideScrollbars" : "",
                                    type === ModelType.Settings ? "flex flex-col gap-3 px-2 py-16 HideScrollbars" : "",
                                    type === ModelType.About ? "flex flex-col gap-3 px-2 py-16 HideScrollbars" : "",
                                    type === ModelType.Edit ? "flex flex-row gap-1 px-2 py-16 HideScrollbars" : "",
                                    type === ModelType.Create ? "flex flex-row gap-1 px-2 py-16 HideScrollbars" : "",
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
                                        <div className="flex flex-col gap-3 h-full w-full">
                                            
                                            {/* Create & Edit Menus Here */}
                                            <Input
                                                label="Name"
                                                placeholder="Name of Bookmark"
                                                value={SettingsState.New_Bookmark.name}
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
                                        </div>
                                        <div className="flex flex-col gap-3 h-full" style={{width: "28%"}}>
                                            {/* ? Preview of Icon Image */}
                                            <div className="flex flex-col items-center">
                                                <div className="w-32 h-32">
                                                    {SettingsState.New_Bookmark.icon ? (
                                                        <img
                                                            src={SettingsState.New_Bookmark.icon.toString()}
                                                            alt="Icon Preview"
                                                            className="w-full h-full rounded object-cover border border-gray-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 rounded dark:bg-zinc-800 dark:text-zinc-500">
                                                            No Icon
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-2">Preview</p>
                                            </div>

                                            {/* DND List */}
                                            {
                                                // SettingsState.New_Bookmark.keywords.length > 0 && (
                                                //     <div className="flex flex-col gap-2">
                                                //         {
                                                //             SettingsState.New_Bookmark.keywords.map((keyword, index) => (
                                                //                 <div key={index} className="flex flex-row gap-2 items-center">
                                                //                     <Circle />
                                                //                     <p>{keyword}</p>
                                                //                     <Tooltip content="Delete Keyword" placement="top">
                                                //                         <Button isIconOnly color="danger" variant="light" onPress={() => {
                                                //                             SetSettingsState({
                                                //                                 ...SettingsState,
                                                //                                 New_Bookmark: {
                                                //                                     ...SettingsState.New_Bookmark,
                                                //                                     keywords: SettingsState.New_Bookmark.keywords.filter((_, i) => i !== index)
                                                //                                 }
                                                //                             })
                                                //                         }}>
                                                //                             <Delete />
                                                //                         </Button>
                                                //                     </Tooltip>
                                                //                 </div>
                                                //             ))
                                                //         }
                                                //     </div>
                                                // )
                                            }
                                        </div>
                                    </>
                                )
                            }
                            {
                                type === ModelType.Marketplace && (
                                    <>
                                        {
                                            SettingsState.MarketPlace.Remote_Bookmarks.map((bookmark) => (
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
                                                <Card className="w-[200px] h-[165px] space-y-5 p-4" radius="lg" shadow="sm">
                                                    <Skeleton className="rounded-lg">
                                                        <div className="h-24 rounded-lg bg-default-300" />
                                                    </Skeleton>
                                                    <div className="space-y-3">
                                                        <Skeleton className="w-5/5 rounded-lg">
                                                            <div className="h-3 w-5/5 rounded-lg bg-default-200" />
                                                        </Skeleton>
                                                    </div>
                                                </Card>
                                            )
                                        }
                                    </>
                                )
                            }
                            {
                                type === ModelType.About && (
                                    <>
                                        About Tools
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
                                                        <SelectItem key={engine} value={engine}>
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
                                                        <SelectItem key={locale} value={locale}>
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
                                            const index = State.Bookmarks.findIndex((b) => b.id === EditBookmarkData?.id);
                                            if (index === -1) {
                                                return;
                                            }

                                            // State.Bookmarks[index] = SettingsState.New_Bookmark;
                                            // State.FilterBookmarks[index] = SettingsState.New_Bookmark;

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
                                            Dispatch({
                                                ...State,
                                                Bookmarks: [
                                                    ...State.Bookmarks,
                                                    SettingsState.New_Bookmark
                                                ],
                                                FilterBookmarks: [
                                                    ...State.FilterBookmarks,
                                                    SettingsState.New_Bookmark
                                                ],
                                                Query: "",
                                                QueryDisplay: "",
                                            })
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
                                        }} // TODO: Confirm Bookmark
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