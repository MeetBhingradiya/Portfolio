"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { PipelineProvider } from "./utils/pipelineContext";

export default function PaperKnifeProvider({ children }: { children: ReactNode }) {
    return (
        <PipelineProvider>
            {children}
            <Toaster
                position="top-center"
                expand
                richColors
                duration={2000}
                toastOptions={{
                    className: "mt-10",
                    style: { zIndex: 1100 }
                }}
            />
        </PipelineProvider>
    );
}
