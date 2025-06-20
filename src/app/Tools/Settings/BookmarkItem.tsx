import React from "react";
import { IBookmark, DefualtBookmark } from "./Types";
import "@Styles/Tools-Bookmark.sass";
import { Cloud, Public, Security } from "@mui/icons-material";
import Image from "next/image";
import SvgComponent from "@Components/SVGComponent";
import { motion } from "framer-motion";
import { Card } from "@heroui/react";
const MotionCard = motion.create(Card);

interface BookmarkItemProps {
    Data: IBookmark;
    isMobileRender?: boolean;
    children?: React.ReactNode;
}

function BookmarkItem({
    Data = DefualtBookmark,
    isAdmin = false,
    isMobileRender = false,
    children = null,
    dragConstraints = {},
    drag = false,
    style = {}
}) {
    return (
        <MotionCard
            className={`bookmark border border-gray-200 dark:border-gray-700 overflow-visible`}
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
                ...style
            }}>
            {Data.Icon ? (
                Data.isSVG ? (
                    <div
                        className="w-6 h-6"
                        style={{
                            color: Data.fillColor || "#000000",
                            fill: Data.fillColor || "#000000"
                        }}>
                        <SvgComponent svgString={Data.Icon as string} />
                    </div>
                ) : (
                    <Image
                        src={Data.Icon as string}
                        alt={Data.Name}
                        width={48}
                        height={48}
                        style={{
                            objectFit: "contain"
                        }}
                    />
                )
            ) : (
                <Public className="w-10 h-10 text-gray-400" />
            )}
            <h2 className="bookmarkTitle">{Data.Name}</h2>
            <div className={`Top-Left-${isMobileRender ? "OUT" : "IN"}`}>
                <Cloud />
            </div>
            {Data.isAdminOnly && (
                <div className="AdminIcon">
                    <Security />
                </div>
            )}
        </MotionCard>
    );
}

export default BookmarkItem;
