/**
 *  @FileID          app\page.tsx
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
import Image from "next/image";
import { motion } from "framer-motion";
import { Tooltip } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { Config } from "@Config/index";

// @ Icons Import
import Link from "next/link";
import { SocialLinks } from "@Config/SocialLinks";

// @ File
export default function Home() {
    const router = useRouter();

    React.useEffect(() => {
        if (Config.isHomeReleased) {
            router.replace('/Home');
        }
    }, []);

    return (
        <>
            {
                Config.isHomeReleased ? null : (
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
                                {SocialLinks.map((item, index) => (
                                    <Tooltip key={index} content={item.Label} placement="top">
                                        <a href={item.URL}>
                                            {item.Component}
                                        </a>
                                    </Tooltip>
                                ))}
                            </motion.div>

                        </motion.div>
                    </div>
                )
            }
        </>
    );
}