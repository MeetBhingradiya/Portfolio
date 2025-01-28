/**
 *  @FileID          Components\Markdown\Note.tsx
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
 *  @created 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


import { clsx } from "clsx";
import { Prose } from "./Prose";

interface NoteProps {
    emoji?: string;
    children: React.ReactNode;
}

export const Note: React.FC<NoteProps> = ({ emoji, children }) => {
    return (
        <aside
            className={clsx(
                "p-4 flex gap-4 border rounded-md",
                "bg-gray-100",
                "dark:bg-gray-800 dark:border-gray-700"
            )}
        >
            {emoji ? <span>{emoji}</span> : null}
            <Prose>{children}</Prose>
        </aside>
    );
};