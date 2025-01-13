/**
 *  @file        Components\Header\index.tsx
 *  @description No description available for Components\Header\index.tsx.
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