"use client";

import React, { useState } from "react";
import "@Styles/Footer.sass";
import { motion } from "framer-motion";
import { Config } from "@Config";
import { getRelativeTime, isFutureDate } from "@Utils/Relativetime";
import { Tooltip } from "@heroui/react";
import {
    Contrast,
    DarkMode,
    GitHub,
    Instagram,
    Language,
    LightMode,
    LinkedIn,
    YouTube,
    Settings
} from "@mui/icons-material";
import ModelMenu from "@Components/ModelMenu";
import { SocialLinks } from "@Config/SocialLinks";
import { useTheme } from "@Hooks/useTheme";

function Footer({
    ShowonFirstRender,
    isHideSocialLinks
}: {
    ShowonFirstRender?: boolean;
    isHideSocialLinks?: boolean;
}) {
    const { theme, toggleTheme } = useTheme();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [State, setState] = React.useState({
        isFooterVisible: false,
        isFirstRender: true
    });

    React.useEffect(() => {
        let lastScrollTop = window.scrollY;

        if (State.isFirstRender) {
            setState({
                ...State,
                isFirstRender: false
            });
        }

        const handleScroll = () => {
            const currentScroll = window.scrollY;
            const isAtBottom =
                window.innerHeight + window.scrollY >=
                document.body.scrollHeight - 10;

            if (isAtBottom) {
                setState({
                    ...State,
                    isFooterVisible: true
                });
            } else if (currentScroll < lastScrollTop) {
                setState({
                    ...State,
                    isFooterVisible: false
                });
            }

            lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        };

        window.addEventListener("scroll", handleScroll);

        if (ShowonFirstRender) {
            setState({
                ...State,
                isFooterVisible: true
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
            transition={{ duration: 0.3, ease: "easeInOut" }}>
            {!isHideSocialLinks && (
                <motion.div
                    className="Social"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        delay: 0.5,
                        duration: 0.7,
                        ease: "easeInOut"
                    }}>
                    {SocialLinks.map((item, index) => {
                        if (item.isEnable) {
                            return (
                                <Tooltip
                                    key={index}
                                    content={item.Label}
                                    placement="top">
                                    <a href={item.URL}>{item.Component}</a>
                                </Tooltip>
                            );
                        }
                    })}
                </motion.div>
            )}
            All rights reserved. Meet Bhingradiya © 2021 -{" "}
            {new Date().getFullYear()}
            <div className="flex items-center">
                <Tooltip
                    content={theme}
                    placement="top">
                    <div
                        className="Version theme-toggle"
                        onClick={toggleTheme}
                        style={{ cursor: "pointer" }}>
                        {theme === "system" ? (
                            <Contrast />
                        ) : theme === "light" ? (
                            <LightMode />
                        ) : (
                            <DarkMode />
                        )}
                    </div>
                </Tooltip>
                <Tooltip
                    content="Site Settings"
                    placement="top">
                    <div
                        className="Version settings-toggle"
                        onClick={() => setIsSettingsOpen(true)}
                        style={{ cursor: "pointer" }}>
                        <Settings />
                    </div>
                </Tooltip>
            </div>
            {/* Settings Modal */}
            <ModelMenu
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </motion.div>
    );
}

export default Footer;
