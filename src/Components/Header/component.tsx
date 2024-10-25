"use Client"

import React from 'react';
import Styles from "@App/Components/Header/component.module.sass";
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
        <motion.div className={Styles.Header}>
            <div className={Styles.Brand}>
                <div className={Styles.Icon}>
                    
                </div>
                <div className={Styles.Text}>

                </div>
            </div>

            <div className={Styles.QuickLinks}>
                {/* Links Types */}

                {/* Type 1 */}
                <div className={Styles.SimpleLinks}></div>

                {/* Type 2 */}
                <div className={Styles.MenuLink}></div>

                {/* Type 3 */}
                <div className={Styles.Button}></div>

                {/* Type 4 */}
                <div className={Styles.Theme}></div>

                {/* Type 4 */}
                <div className={Styles.MobileToggle}></div>
            </div>
        </motion.div>
    )
}

export default Header