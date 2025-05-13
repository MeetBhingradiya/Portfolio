/**
 *  @FileID          app/Tools/Settings/BookmarkItemSkeleton.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

import { motion } from "framer-motion";
import {
    Card,
    Skeleton
} from "@heroui/react";
import { CardContent } from "@mui/material";

const MotionCard = motion.create(Card);

function BookmarkItemSkeleton({ index }: { index: number }) {
    return (
        <MotionCard
            className="w-full h-full border border-gray-200 dark:border-gray-700 shadow-sm"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.2,
                delay: Math.min(index * 0.03, 0.2),
                ease: "easeOut"
            }}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-md" />
                        <div className="flex flex-col gap-1">
                            <Skeleton className="w-32 h-5 rounded-md" />
                            <Skeleton className="w-40 h-3 rounded-md" />
                        </div>
                    </div>
                    <Skeleton className="w-10 h-8 rounded-md" />
                </div>
                <Skeleton className="w-full h-10 mt-3 rounded-md" />
                <div className="flex gap-2 mt-3">
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                </div>
            </CardContent>
        </MotionCard>
    )
}

export default BookmarkItemSkeleton;
