"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// @ Icons Import
import { 
    LinkedIn, 
    GitHub, 
    Instagram, 
    YouTube 
} from '@mui/icons-material';

// @ File
export default function Home() {
    return (
        <div className="CommingSoon">
            <div
                className="Notification"
            >
                <Image
                    width="30"
                    height="30"
                    src="https://img.icons8.com/ios-glyphs/512/error--v1.png"
                    alt="error--v1"
                />
                This website is under construction. Please visit later.
            </div>
            {/* <a className="Notification" href="/Home">
                <Image width="30" height="30" src="https://img.icons8.com/ios-glyphs/512/error--v1.png" alt="error--v1" />
                This website is under construction. Click heare to Visit Home Page.
            </a> */}

            <motion.div
                className="Container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: "easeInOut" }}
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
                    <a href="https://www.linkedin.com/in/meetbhingradiya/">
                        <LinkedIn />
                    </a>
                    <a href="https://github.com/MeetBhingradiya">
                        <GitHub />
                    </a>
                    <a href="https://www.instagram.com/_meet_bhingradiya_/">
                        <Instagram />
                    </a>
                    <a href="https://www.youtube.com/@MeetBhingradiya">
                        <YouTube />
                    </a>
                </motion.div>
            </motion.div>

            <motion.div
                className="footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeInOut" }}
            >
                All rights reserved. Meet Bhingradiya © 2021 - {new Date().getFullYear()}
            </motion.div>
        </div>
    );
}