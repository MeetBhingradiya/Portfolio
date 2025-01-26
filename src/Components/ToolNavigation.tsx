/**
 *  @FileID          Components\ToolNavigation.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 19/01/25 9:44 AM IST (Kolkata +5:30 UTC)
 */

"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QrCode2 } from '@mui/icons-material';
import Image from 'next/image';
import "@Styles/Tools-Navigation.sass";
import { Tooltip } from '@heroui/react';
import SvgComponent from './SVGComponent';

const Tools: Array<{
    Query: any,
    Title: string,
    Icon?: string | React.ReactNode,
}> = [
        {
            Query: "BingQuerys",
            Title: "Bing Querys",
            Icon: "https://www.gstatic.com/trends/favicon.ico",
        },
        {
            Query: "UUID",
            Title: "UUID Generator",
            Icon: "https://www.gstatic.com/trends/favicon.ico",
        },
        {
            Query: "QR",
            Title: "QR Code",
            Icon: <QrCode2
                sx={{
                    width: 32,
                    height: 32,
                }}
            />
        },
        {
            Query: "JSONObject",
            Title: "JSON JS Object Convert",
            Icon: <SvgComponent
                svgString='<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"type-color\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" stroke-width=\"2\" stroke=\"currentColor\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n  <path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"/>\n  <path d=\"M20 16v-8l3 8v-8\"/>\n  <path d=\"M15 8a2 2 0 0 1 2 2v4a2 2 0 1 1 -4 0v-4a2 2 0 0 1 2 -2z\"/>\n  <path d=\"M1 8h3v6.5a1.5 1.5 0 0 1 -3 0v-.5\"/>\n  <path d=\"M7 15a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-1a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1h1a1 1 0 0 1 1 1\"/>\n</svg>'
            />,
        }
    ]

function ToolNavigation() {
    const router = useRouter();
    const ToolEndpoint: string = usePathname().split("/").pop() as string;

    return (
        <>
            {
                ToolEndpoint.includes("Tools") ? null : (
                    <div className="ToolNavigation">
                        {
                            Tools.map((_Tool, Index) => {
                                return (
                                    <Tooltip key={_Tool.Query} content={_Tool.Title} placement="right">
                                        <div
                                            key={Index}
                                            className={`ToolNavigation-Item ${ToolEndpoint.includes(_Tool.Query) ? "Active" : ""}`}
                                            onClick={() => {
                                                ToolEndpoint.includes(_Tool.Query) ? null : router.push(`/Tools/${_Tool.Query}`);
                                            }}
                                        >
                                            {
                                                typeof _Tool.Icon === "string"
                                                    ? <Image
                                                        src={_Tool.Icon as string}
                                                        alt={_Tool.Title}
                                                        width={32}
                                                        height={32}
                                                    />
                                                    : _Tool.Icon
                                            }
                                            <span>{_Tool.Title}</span>
                                        </div>
                                    </Tooltip>
                                )
                            })
                        }
                    </div>
                )
            }
        </>
    )
}

export default ToolNavigation;