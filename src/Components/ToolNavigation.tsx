"use client";
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QrCode2 } from '@mui/icons-material';
import Image from 'next/image';
import "@Styles/Tools-Navigation.sass";
import { Tooltip } from '@nextui-org/react';

const Tools: Array<{
    Query: any,
    Title: string,
    Icon: string | React.ReactNode,
}> = [
        {
            Query: "Googletrends",
            Title: "Google Trends",
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
        }
    ]

function ToolNavigation() {
    const router = useRouter();
    const ToolEndpoint: string = usePathname().split("/").pop() as string;

    return (
        <div className={`${ToolEndpoint.includes("Tools") ? "Hide" : ""} ToolNavigation`}>
            {
                !ToolEndpoint.includes("Tools") && Tools.map((_Tool, Index) => {
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

export default ToolNavigation;