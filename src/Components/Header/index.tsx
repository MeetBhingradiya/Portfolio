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