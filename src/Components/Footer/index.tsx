"use client"

import React from 'react';
import "@Styles/Footer.sass";
import { motion } from 'framer-motion';
import { Config } from "@Config/index";
import { getRelativeTime } from '@Utils/Relativetime';
import { Tooltip } from '@nextui-org/react';
import {
    Contrast,
    DarkMode,
    GitHub,
    Instagram,
    Language,
    LightMode,
    LinkedIn,
    YouTube
} from '@mui/icons-material';
import { SocialLinks } from '@Config/SocialLinks';
import { useTheme } from '@Hooks/useTheme';

function Footer() {
    const { theme, toggleTheme } = useTheme();

    return (
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
                    SocialLinks.map((item, index) => {
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
    )
}

export default Footer