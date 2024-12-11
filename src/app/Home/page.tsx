"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Tooltip } from "@nextui-org/react";
import { getRelativeTime } from "@Utils/Relativetime";
import "@Styles/Home.sass";

// @ Icons Import
import {
    LinkedIn,
    GitHub,
    Instagram,
    YouTube,
    Language,
    LightMode,
    DarkMode,
    Contrast
} from '@mui/icons-material';

let ProjectInfo = {
    version: "1.0.2",
    releasedate: "2024-12-08",
    visiblebranch: "Development", // Development | Release
}

const Links: Array<{
    Label: string;
    URL: string;
    Component: React.ReactNode;
    isEnable: boolean;
}> = [
        {
            Label: "LinkedIn",
            URL: "https://www.linkedin.com/in/meetbhingradiya/",
            Component: <LinkedIn />,
            isEnable: true,
        },
        {
            Label: "GitHub",
            URL: "https://github.com/MeetBhingradiya",
            Component: <GitHub />,
            isEnable: true,
        },
        {
            Label: "Instagram",
            URL: "https://www.instagram.com/_meet_bhingradiya_/",
            Component: <Instagram />,
            isEnable: true,
        },
        {
            Label: "YouTube",
            URL: "https://www.youtube.com/@MeetBhingradiya",
            Component: <YouTube />,
            isEnable: true,
        },
        {
            Label: "StackOverflow",
            URL: "https://stackoverflow.com/users/19279518/meet-bhingradiya",
            Component: (
                <svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24" className="stackoverflowsvg">
                    <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154Z" />
                </svg>
            ),
            isEnable: true,
        }
    ];

// @ File
export default function Home() {
    return (
        <div className="Home">
            <motion.div
                className="Container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
                tabIndex={0}
            >
                <h1>
                    Meet Bhingradiya
                </h1>

                <div className="CENTER">
                    <Image
                        src="/meet.jpg"
                        alt="Meet Bhingradiya"
                        width={150}
                        height={150}
                    />
                </div>

                {/* ? Social Links */}
                <motion.div
                    className="Social"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                >
                    {Links.map((item, index) => {
                        if (item.isEnable) {
                            return (
                                <Tooltip key={index} content={item.Label} placement="top">
                                    <a href={item.URL}>
                                        {item.Component}
                                    </a>
                                </Tooltip>
                            );
                        }
                    })}
                </motion.div>

            </motion.div>

            {/* ? Footer */}
            <motion.div
                className="footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeInOut" }}
            >
                <motion.div
                    className="Social"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                >
                    {
                        Links.map((item, index) => {
                            if (item.isEnable) {
                                return (
                                    <Tooltip key={index} content={item.Label} placement="top">
                                        <a href={item.URL}>
                                            {item.Component}
                                        </a>
                                    </Tooltip>
                                );
                            }
                        })
                    }
                </motion.div>
                All rights reserved. Meet Bhingradiya © 2021 - {new Date().getFullYear()}
                <div className="flex items-center">
                    <Tooltip content="Language" placement="top">
                        <div className="Version">
                            <Language />
                        </div>
                    </Tooltip>
                    <Tooltip content="Toggle Theme" placement="top">
                        <div className="Version">
                            <Contrast />
                            {/* <LightMode /> */}
                            {/* <DarkMode /> */}
                        </div>
                    </Tooltip>
                    <Tooltip content="Version Changelog" placement="top">
                        <motion.a
                            href={`https://github.com/MeetBhingradiya/MeetBhingradiya/blob/${ProjectInfo.visiblebranch}/ChangeLog.md`}
                            target="_blank"
                            className="Version"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5, ease: "easeInOut" }}
                        >
                            v{ProjectInfo.version} | {getRelativeTime(new Date(ProjectInfo.releasedate))}
                        </motion.a>
                    </Tooltip>
                </div>
            </motion.div>
        </div>
    );
}