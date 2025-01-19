/**
 *  @FileID          Components\Footer\index.tsx
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
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import React from "react";
import "@Styles/Footer.sass";
import { motion } from "framer-motion";
import { Config } from "@Config/index";
import { getRelativeTime } from "@Utils/Relativetime";
import { Tooltip } from "@nextui-org/react";
import {
    Contrast,
    DarkMode,
    GitHub,
    Instagram,
    Language,
    LightMode,
    LinkedIn,
    YouTube,
} from "@mui/icons-material";
import { SocialLinks } from "@Config/SocialLinks";
import { useTheme } from "@Hooks/useTheme";

function Footer({ ShowonFirstRender, isHideSocialLinks }: {
    ShowonFirstRender?: boolean
    isHideSocialLinks?: boolean
}
) {
    const { theme, toggleTheme } = useTheme();
    const [State, setState] = React.useState({
        isFooterVisible: false,
        isFirstRender: true,
    });

    React.useEffect(() => {
        let lastScrollTop = window.scrollY;

        if (State.isFirstRender) {
            setState({
                ...State,
                isFirstRender: false,
            });
        }

        const handleScroll = () => {
            const currentScroll = window.scrollY;
            const isAtBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 10;

            if (isAtBottom) {
                setState({
                    ...State,
                    isFooterVisible: true,
                });
            } else if (currentScroll < lastScrollTop) {
                setState({
                    ...State,
                    isFooterVisible: false,
                });
            }

            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        };

        window.addEventListener("scroll", handleScroll);

        if (ShowonFirstRender) {
            setState({
                ...State,
                isFooterVisible: true,
            });
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <motion.div
            className="footer"
            initial={{ y: 0 }}
            animate={{ y: State.isFooterVisible ? 0 : "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            {
                !isHideSocialLinks && (<motion.div
                    className="Social"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
                >
                    {SocialLinks.map((item, index) => {
                        if (item.isEnable) {
                            return (
                                <Tooltip key={index} content={item.Label} placement="top">
                                    <a href={item.URL}>{item.Component}</a>
                                </Tooltip>
                            );
                        }
                    })}
                </motion.div>)
            }

            All rights reserved. Meet Bhingradiya © 2021 - {new Date().getFullYear()}
            <div className="flex items-center">
                {/* <Tooltip content="Language" placement="top">
                    <div className="Version">
                        <Language />
                    </div>
                </Tooltip> */}
                <Tooltip content={theme} placement="top">
                    <div
                        className="Version theme-toggle"
                        onClick={toggleTheme}
                        style={{ cursor: "pointer" }}
                    >
                        {theme === "system" ? (
                            <Contrast />
                        ) : theme === "light" ? (
                            <LightMode />
                        ) : (
                            <DarkMode />
                        )}
                    </div>
                </Tooltip>
                <Tooltip content="Version Changelog" placement="top">
                    <motion.a
                        href={`https://github.com/MeetBhingradiya/MeetBhingradiya/blob/${Config.visiblebranch}/ChangeLog.md`}
                        target="_blank"
                        className="Version"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5, ease: "easeInOut" }}
                    >
                        v{Config.version} | {getRelativeTime(new Date(Config.releasedate))}
                    </motion.a>
                </Tooltip>
            </div>
        </motion.div>
    );
}

export default Footer;