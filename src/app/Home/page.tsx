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
    Contrast,
    Build,
    Bookmark,
    QrCode2,
} from '@mui/icons-material';
import Link from "next/link";
import Footer from "@Components/Footer";
import { SocialLinks } from "@Config/SocialLinks";
import { Config } from "@Config/index";

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
                    {SocialLinks.map((item, index) => {
                        if (item.isEnable) {
                            return (
                                <Tooltip key={index} content={item.Label} placement="top">
                                    <a href={item.URL} target="_blank">
                                        {item.Component}
                                    </a>
                                </Tooltip>
                            );
                        }
                    })}
                </motion.div>
            </motion.div>
            <motion.div
                className="ItemRow"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
            >
                <motion.div
                    className="Item"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
                >
                    <Link href={"/Tools"} className="flex row gap-4 items-center">
                        <Bookmark sx={{
                            width: 32,
                            height: 32,
                        }} />
                        Bookmarks
                    </Link>
                </motion.div>
                <motion.div
                    className="Item"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
                >
                    <Link href={"/Tools/QR"} className="flex row gap-4 items-center max-h max-w">
                        <QrCode2 sx={{
                            width: 32,
                            height: 32,
                        }} />
                        QR
                    </Link>
                </motion.div>

            </motion.div>

            {/* ? Footer */}
            <Footer />
        </div>
    );
}