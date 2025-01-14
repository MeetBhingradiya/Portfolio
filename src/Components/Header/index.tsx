/**
 *  @FileID          Components\Header\index.tsx
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
        Category: string
        Icon?: string
        Items: Array<{
            icon?: string
            Label: string
            URL: string
        }>
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