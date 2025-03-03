/**
 *  @FileID          Components\Header\index.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


"use Client"

import React from 'react';
import "@Styles/Header.sass";
import { motion } from 'framer-motion';

interface QuickLinks_Type {
    Type: "SimpleLink" | "MenuLink" | "Button" | "Theme" | "MobileToggle"
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

/**
 * Renders the header component containing the brand icon and quick links.
 *
 * This component displays a brand icon (sourced from "/favicon.ico") alongside a series of simple links:
 * Home, About, Showcase, Contact, and Resume. Additional link types are outlined in commented sections for future use.
 *
 * @returns A JSX element representing the header.
 */
function Header() {
    return (
        <div className={"Header"}>
            <div className="Warp">
                <div className={"Brand"}>
                    <div className={"Icon"}>
                        <img src={"/favicon.ico"} alt={"Brand Icon"} />
                    </div>
                </div>

                <div className={"QuickLinks"}>
                    {/* Links Types */}

                    {/* Type 1 */}
                    <div className={"SimpleLink"}>Home</div>
                    <div className={"SimpleLink"}>About</div>
                    <div className={"SimpleLink"}>Showcase</div>
                    <div className={"SimpleLink"}>Contact</div>
                    <div className={"SimpleLink"}>Resume</div>

                    {/* Type 2 */}
                    {/* <div className={"MenuLink"}></div> */}

                    {/* Type 3 */}
                    {/* <div className={"Button"}></div> */}

                    {/* Type 4 */}
                    {/* <div className={"Theme"}></div> */}

                    {/* Type 4 */}
                    {/* <div className={"MobileToggle"}></div> */}
                </div>
            </div>
        </div>
    )
}

export default Header