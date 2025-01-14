/**
 *  @FileID          app\(auth)\signup\layout.tsx
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
 *  @modified 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Signup - Meet Bhingradiya",
    description: "Create a New Account",
    icons: "/favicon.ico",
    keywords: [
        "Meet Bhingradiya",
        "Meet",
        "Bhingradiya",
        "Portfolio",
        "Signup",
        "Account",
        "Register",
        "Create Account",
    ]
}

// @ File
export default function signinLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children
}