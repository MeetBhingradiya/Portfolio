/**
 *  @file        app\Home\page.tsx
 *  @description No description available for app\Home\page.tsx.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Tooltip } from "@nextui-org/react";
import { getRelativeTime } from "@Utils/Relativetime";
import "@Styles/Home.sass";

// @ Icons Import
import {
    Bookmark,
    QrCode2,
} from '@mui/icons-material';
import Link from "next/link";
import { SocialLinks } from "@Config/SocialLinks";

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
        </div>
    );
}