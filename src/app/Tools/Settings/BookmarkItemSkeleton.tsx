import { motion } from "motion/react";
import { Card, Skeleton } from "@heroui/react";
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
            }}>
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
    );
}

export default BookmarkItemSkeleton;
