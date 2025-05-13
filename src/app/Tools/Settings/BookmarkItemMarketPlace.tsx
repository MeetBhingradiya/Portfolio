/**
 *  @FileID          app/Tools/Settings/BookmarkItemMarketPlace.tsx
 *  @Description     Currently, there is no description available.
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
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

import React from "react";
import { IBookmark } from "./Types";
import "@Styles/Tools-Bookmark.sass";
import {
    Android,
    BookmarkOutlined,
    CheckBoxOutlineBlank,
    CheckCircleOutline,
    DeleteForever,
    EditOff,
    Security,
    Window
} from "@mui/icons-material";
import { motion } from "framer-motion";
import {
    Button,
    Card,
    Tooltip,
    cn
} from "@heroui/react";
import SvgComponent from "@/Components/SVGComponent";

const MotionCard = motion.create(Card);

function BookmarkItemMarketPlace({
    Data,
    isSelected,
    isAdmin,
    toggleSelectBookmark,
    style = {},
    dragConstraints = {},
    drag = false
}: {
    Data: IBookmark,
    isSelected: boolean,
    isAdmin: boolean,
    toggleSelectBookmark: (id: string) => void,
    style?: React.CSSProperties,
    drag?: boolean,
    dragConstraints?: any
}) {

    return (
        <MotionCard
            className={`bookmark ${isSelected ? 'border-primary-500 border-2' : 'border border-gray-200 dark:border-gray-700'}`}
            key={Data.BookmarkID}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.05,
                ease: "easeOut"
            }}
            drag={drag}
            dragConstraints={dragConstraints}
            style={{
                ...style,
            }}
        >
            <div className="flex items-center justify-between gap-3 w-full">

                {/* ? Icon */}
                <div className="flex items-center gap-2 justify-start">
                    <div className="w-10 h-10 flex items-center justify-center rounded-md overflow-hidden">
                        {Data.Icon && Data.isSVG ? (
                            <div
                                className="w-6 h-6"
                                style={{
                                    color: Data.fillColor || '#000000',
                                    fill: Data.fillColor || '#000000'
                                }}
                            >
                                <SvgComponent
                                    svgString={Data.Icon}
                                />
                            </div>
                            
                        ) : Data.Icon ? (
                            <img
                                src={Data.Icon}
                                alt={Data.Name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://img.icons8.com/fluency/48/bookmark-ribbon.png";
                                }}
                            />
                        ) : (
                            <BookmarkOutlined className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        )}
                    </div>

                    {/* ? Name & URL */}
                    <div className="flex flex-col">
                        <div className="font-semibold text-medium justify-start flex">
                            {Data.Name || "Unnamed Bookmark"}
                        </div>

                        <div className="text-xs justify-start flex text-gray-500 truncate max-w-[200px]">
                            {
                                Data.isAdminOnly === true && !isAdmin ? "Access Denied" : Data?.WebLink || "No URL provided"
                            }
                        </div>
                    </div>
                </div>

                {/* ? Status */}
                <Button
                    variant="light"
                    isIconOnly
                    size="sm"
                    onPress={() => toggleSelectBookmark(Data.BookmarkID)}
                    style={{
                        color: "var(--accent-color)"
                    }}
                >
                    {isSelected ? <CheckCircleOutline /> : <CheckBoxOutlineBlank />}
                </Button>
            </div>

            {
                Data.isAdminOnly && !isAdmin ? (
                    <div className="px-2 mt-2 w-full text-xs text-gray-600 dark:text-gray-400 line-clamp-2 flex text-justify items-center justify-start">
                        Access Denied
                    </div>
                ) : Data.Description === "" ? null : null
            }

            {
                Data.Keywords && Data.Keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 w-full">
                        {Data.Keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300"
                            >
                                {keyword}
                            </span>
                        ))}
                        {Data.Keywords.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                                +{Data.Keywords.length - 3}
                            </span>
                        )}
                    </div>
                )
            }

            {
                Data.Windows
                    || Data.Android
                    || Data.isAdminOnly
                    || Data.isDeleteBlock
                    || Data.isSponsored
                    || Data.isPublished
                    || Data.isCloudSync ? (
                    <div className="flex justify-start gap-2 items-center mt-2 w-full px-2">
                        {Data.Windows && (
                            <Tooltip content={"Contains Windows App Link"} placement="top">
                                <div
                                    className={
                                        cn(
                                            "flex items-center justify-center rounded-full p-[1px]",
                                            "text-gray-800 dark:text-gray-200"
                                        )
                                    }
                                >
                                    <Window sx={{ fontSize: 20 }} />
                                </div>
                            </Tooltip>
                        )}
                        {Data.Android && (
                            <Tooltip content={"Contains Android App Link"} placement="top">
                                <div
                                    className={
                                        cn(
                                            "flex items-center justify-center rounded-full p-[1px]",
                                            "text-gray-800 dark:text-gray-200"
                                        )
                                    }
                                >
                                    <Android sx={{ fontSize: 20 }} />
                                </div>
                            </Tooltip>
                        )}

                        {
                            Data.isAdminOnly && (
                                <Tooltip content={"only for Admin Users"} placement="top">
                                    <div
                                        className={
                                            cn(
                                                "flex items-center justify-center rounded-full p-[1px]",
                                                "text-gray-800 dark:text-gray-200"
                                            )
                                        }
                                    >
                                        <Security sx={{ fontSize: 20 }} />
                                    </div>
                                </Tooltip>
                            )
                        }
                        {
                            Data.isSponsored && (
                                <Tooltip content="Sponsored Bookmark" placement="top">
                                    <div
                                        className={
                                            cn(
                                                "flex items-center justify-center rounded-md px-[5px] py-[2px] text-[13.5px]",
                                                "text-gray-800 dark:text-gray-200",
                                                "bg-gray-400 dark:bg-gray-700",
                                            )
                                        }
                                    >
                                        AD
                                    </div>
                                </Tooltip>
                            )
                        }
                        {
                            Data.isDeleteBlock && (
                                <Tooltip content="you can't edit this bookmark" placement="top">
                                    <div
                                        className={
                                            cn(
                                                "flex items-center justify-center rounded-full p-[1px]",
                                                "text-gray-800 dark:text-gray-200"
                                            )
                                        }
                                    >
                                        <EditOff sx={{ fontSize: 20 }} />
                                    </div>
                                </Tooltip>
                            )
                        }
                        {
                            Data.isDeleteBlock && (
                                <Tooltip content="you can't remove this without factory reset" placement="top">
                                    <div
                                        className={
                                            cn(
                                                "flex items-center justify-center rounded-full p-[1px]",
                                                "text-gray-800 dark:text-gray-200"
                                            )
                                        }
                                    >
                                        <DeleteForever sx={{ fontSize: 20 }} />
                                    </div>
                                </Tooltip>
                            )
                        }
                    </div>
                ) : null
            }
        </MotionCard>
    )
}

export default BookmarkItemMarketPlace;