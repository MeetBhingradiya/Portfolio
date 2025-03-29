/**
 *  @FileID          app/Tools/JWT/layout.tsx
 *  @Description     Layout for JWT Debugger tool
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
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
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
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 12/04/25 1:45 PM IST (Kolkata +5:30 UTC)
 *  @modified 12/04/25 1:45 PM IST (Kolkata +5:30 UTC)
 */


import { Metadata } from "next";

export const metadata: Metadata = {
    title: "JWT Debugger - Meet Bhingradiya",
    description: "Decode, verify and debug JSON Web Tokens (JWT) securely in your browser.",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Tools",
        "JWT",
        "JSON Web Token",
        "JWT Debugger",
        "JWT Decoder",
        "Token Verification"
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
