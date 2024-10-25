"use Client"

import React from 'react';
import "@Styles/Header.sass";
import { motion } from 'framer-motion';

interface QuickLinks_Type {
    Type: "SimpleLinks" | "MenuLink" | "Button" | "Theme" | "MobileToggle"
    URL?: string
    isAnchour: boolean
    AnchourID: string
    Menu: Array<{
        icon?: string
        Label: string
        URL: string
    }>
}

function Header() {
    return (
        <motion.div className={"Header"}>
            <div className={"Brand"}>
                <div className={"Icon"}>
                    
                </div>
                <div className={"Text"}>

                </div>
            </div>

            <div className={"QuickLinks"}>
                {/* Links Types */}

                {/* Type 1 */}
                <div className={"SimpleLinks"}></div>

                {/* Type 2 */}
                <div className={"MenuLink"}></div>

                {/* Type 3 */}
                <div className={"Button"}></div>

                {/* Type 4 */}
                <div className={"Theme"}></div>

                {/* Type 4 */}
                <div className={"MobileToggle"}></div>
            </div>
        </motion.div>
    )
}

export default Header