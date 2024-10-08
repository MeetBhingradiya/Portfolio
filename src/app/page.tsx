"use client";

import SVGgen from "@App/Components/SVGgen";
import Image from "next/image";
import { motion } from "framer-motion"

export default function Home() {
    return (
        <div className="CommingSoon">
            <div className="Notification">
                <Image width="30" height="30" src="https://img.icons8.com/ios-glyphs/512/error--v1.png" alt="error--v1"/> This website is under construction. Please visit later.
            </div>
            {/* <a className="Notification" href="/Home">
                <Image width="30" height="30" src="https://img.icons8.com/ios-glyphs/512/error--v1.png" alt="error--v1" />
                This website is under construction. Click heare to Visit Home Page.
            </a> */}
            <motion.a
                className="Container"
                href="https://github.com/meetbhingradiya"
                initial={{ opacity: 0, top: 10 }}
                animate={{ opacity: 1, top: 0 }}
                transition={{ delay: 0.5 }}
            >
                <h1>Meet Bhingradiya</h1>
                <div className="CENTER">
                    <Image
                        src="/meet.jpg"
                        alt="Meet Bhingradiya"
                        width={150}
                        height={150}
                        priority={true}
                    />
                </div>
                <p className="soon">
                    Coming Soon!
                </p>
            </motion.a>
            <div className="footer">
                {/* Copyright © 2021 - {new Date().getFullYear()} Meet Bhingradiya */}
                All rights reserved. Meet Bhingradiya © 2021 - {new Date().getFullYear()}
            </div>
        </div>
    );
}
