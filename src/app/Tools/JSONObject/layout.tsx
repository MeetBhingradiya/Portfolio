/**
 *  @FileID          app\Tools\JSONObject\layout.tsx
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
    title: "JSObject : JSON Convert - Meet Bhingradiya",
    description: "Convert JSON to JS Object and JS Object to JSON.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "JSON",
        "JSObject",
        "JSON Convert",
        "JSObject Convert"
    ]
}

// @ File
export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}