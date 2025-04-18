import React from "react";
import { IBookmark, DefualtBookmark } from "./Types";
import "@Styles/Tools-Bookmark.sass";
import { Cloud, Public, Security } from "@mui/icons-material";
import Image from "next/image";
import SvgComponent from "@Components/SVGComponent";

interface BookmarkItemProps {
    Data: IBookmark;
    isMobileRender?: boolean;
    children?: React.ReactNode;
}

function BookmarkItem({
    Data = DefualtBookmark,
    isMobileRender = false,
    children = null
}) {

    return (
        <>
            <div
                className="bookmark"
            >
                {
                    Data.Icon ? (
                        Data.isSVG ? (
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
                        ) : (
                            <Image
                                src={Data.Icon}
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
                    )
                }
                <h2 className="bookmarkTitle">{Data.Name}</h2>
                <div className={`Top-Left-${isMobileRender ? "OUT" : "IN"}`}>
                    <Cloud />
                </div>
                {
                    Data.isAdminOnly && (
                        <div className="AdminIcon">
                            <Security />
                        </div>
                    )
                }
            </div>
        </>
    )
}

export default BookmarkItem;