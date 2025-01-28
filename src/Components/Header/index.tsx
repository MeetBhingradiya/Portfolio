/**
 *  @FileID          Components\Header\index.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
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