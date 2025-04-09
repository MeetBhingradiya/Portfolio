import React from "react";
import { IBookmark, DefualtBookmark } from "./Types";
import "@Styles/Tools-Bookmark.sass";
import { Android, BookmarkOutlined, CheckBoxOutlineBlank, CheckCircleOutline, Cloud, Delete, DeleteForever, Edit, EditOff, Public, Security, Window } from "@mui/icons-material";
import { motion } from "framer-motion";
import { Button, Card, Tooltip, cn } from "@heroui/react";
import { CardContent, Checkbox, Typography } from "@mui/material";

const MotionCard = motion.create(Card);

function BookmarkItemMarketPlace({
    Data,
    isSelected,
    isAdmin,
    toggleSelectBookmark,
    style = {},
    dragConstraints = {}
}: {
    Data: IBookmark,
    isSelected: boolean,
    isAdmin: boolean,
    toggleSelectBookmark: (id: string) => void,
    style?: React.CSSProperties,
    dragConstraints?: any
}) {

    return (
        <div
            key={Data.BookmarkID}
            style={{
                ...style,
            }}
        >
            <MotionCard
                className={`bookmark ${isSelected ? 'border-primary-500 border-2' : 'border border-gray-200 dark:border-gray-700'}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.05,
                    ease: "easeOut"
                }}
                drag
                dragConstraints={dragConstraints}
            >
                <div className="flex items-center justify-between gap-3 w-full">

                    {/* ? Icon */}
                    <div className="flex items-center gap-2 justify-start">
                        <div className="w-10 h-10 flex items-center justify-center rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {Data.Icon && Data.isSVG ? (
                                <div
                                    className="w-6 h-6"
                                    style={{
                                        color: Data.fillColor || '#000000',
                                        fill: Data.fillColor || '#000000'
                                    }}
                                >
                                    {Data.Icon}
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
                                    Data.isAdminOnly && !isAdmin ? "Access Denied" : Data?.WebLink || "No URL provided"
                                }
                            </div>
                        </div>
                    </div>

                    {/* ? Status */}
                    <Button
                        variant="light"
                        isIconOnly
                        isDisabled={isSelected}
                        size="sm"
                        onPress={!isSelected ? () => toggleSelectBookmark(Data.BookmarkID) : undefined}
                        style={{
                            color: "var(--accent-color)"
                        }}
                    >
                        {isSelected ? <CheckCircleOutline /> : <CheckBoxOutlineBlank />}
                    </Button>
                </div>

                <div className="px-2  w-full text-xs text-gray-600 dark:text-gray-400 line-clamp-2 flex truncate items-center justify-start">
                    {Data.isAdminOnly && !isAdmin ? "Access Denied" : Data?.Description === "" ? "No Description Provided" : Data.Description}
                </div>

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
                                                "bg-gray-400 text-gray-800",
                                                "dark:bg-gray-800 dark:text-gray-200"
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
                                                "bg-gray-400 text-gray-800",
                                                "dark:bg-gray-800 dark:text-gray-200"
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
                                                    "bg-gray-400 text-gray-800",
                                                    "dark:bg-gray-800 dark:text-gray-200"
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
                                                    "flex items-center justify-center rounded-full p-[1px] text-[13.5px]",
                                                    "bg-gray-400 text-gray-800",
                                                    "dark:bg-gray-800 dark:text-gray-200"
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
                                                    "bg-gray-400 text-gray-800",
                                                    "dark:bg-gray-800 dark:text-gray-200"
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
                                                    "bg-gray-400 text-gray-800",
                                                    "dark:bg-gray-800 dark:text-gray-200"
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
            </MotionCard >
        </div >
    )
}

export default BookmarkItemMarketPlace;