"use client";

import { motion, MotionProps } from "motion/react";
import React from "react";

interface CustomMotionProps<Tag extends keyof JSX.IntrinsicElements> extends MotionProps {
    type?: Tag;
    children: React.ReactNode;
    className?: string | undefined | null;
    href?: Tag extends "a" ? string : never;
    [key: string]: any;
}

export const Motion = <Tag extends keyof JSX.IntrinsicElements>({
    type,
    children,
    className,
    href,
    ...props
}: CustomMotionProps<Tag>) => {
    const Component = type ? (motion as any)[type] : motion.div;
    const componentProps = { className, ...props } as any;
    if (type === "a" && href) {
        componentProps.href = href;
    }
    return (
        <Component {...componentProps}>
            {children}
        </Component>
    );
};