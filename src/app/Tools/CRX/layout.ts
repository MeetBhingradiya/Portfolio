/**
 *  @FileID          app\Tools\Googletrends\layout.ts
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

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chrome Extenstion CRX Download - Meet Bhingradiya",
    description: "Download Chrome Extension CRX files with a single click",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "CRX",
        "Chrome",
        "Extension",
        "Download",
        "Download CRX with id"
    ]
}

// @ File
export default function ToolsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}