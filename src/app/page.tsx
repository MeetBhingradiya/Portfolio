"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Tooltip } from "@nextui-org/react";
import { getRelativeTime } from "@Utils/Relativetime";

// @ Icons Import
import {
    LinkedIn,
    GitHub,
    Instagram,
    YouTube,
} from '@mui/icons-material';
import type { Metadata } from "next";
import Link from "next/link";

let ProjectInfo = {
    version: "1.0.2",
    releasedate: "2024-12-08",
    visiblebranch: "Development", // Development | Release
}

const Links: Array<{
    Label: string;
    URL: string;
    Component: React.ReactNode;
}> = [
    {
        Label: "LinkedIn",
        URL: "https://www.linkedin.com/in/meetbhingradiya/",
        Component: <LinkedIn />,
    },
    {
        Label: "GitHub",
        URL: "https://github.com/MeetBhingradiya",
        Component: <GitHub />,
    },
    {
        Label: "Instagram",
        URL: "https://www.instagram.com/_meet_bhingradiya_/",
        Component: <Instagram />,
    },
    {
        Label: "YouTube",
        URL: "https://www.youtube.com/@MeetBhingradiya",
        Component: <YouTube />,
    },
    {
        Label: "StackOverflow",
        URL: "https://stackoverflow.com/users/19279518/meet-bhingradiya",
        Component: (
            <svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24" className="stackoverflowsvg">
                <path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154Z" />
            </svg>
        ),
    }
];

// @ File
export default function Home() {
    return (
        <div className="CommingSoon">
            <Link className="Notification" href="/Home">
                <Image
                    width="30"
                    height="30"
                    src="https://img.icons8.com/ios-glyphs/512/error--v1.png" alt="error--v1"
                />
                This website is under construction. Please visit later.
            </Link>

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
                        priority={true}
                    />
                </div>

                {/* ? Social Links */}
                <motion.div
                    className="Social"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                >
                    {Links.map((item, index) => (
                        <Tooltip key={index} content={item.Label} placement="top">
                            <a href={item.URL}>
                                {item.Component}
                            </a>
                        </Tooltip>
                    ))}
                </motion.div>

            </motion.div>

            {/* ? Footer */}
            <motion.div
                className="footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeInOut" }}
            >
                All rights reserved. Meet Bhingradiya © 2021 - {new Date().getFullYear()}
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
            </motion.div>
        </div>
    );
}