"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PAPERKNIFE_TOOL_MAP } from "../_lib/toolRegistry";

type VisibilityEntry = {
    toolId: string;
    enabled: boolean;
    featured: boolean;
    publicAccess: boolean;
};

export default function PaperKnifeToolPage() {
    const params = useParams<{ tool: string }>();
    const entry = PAPERKNIFE_TOOL_MAP.get(params.tool);
    const [visibility, setVisibility] = useState<VisibilityEntry[]>([]);

    useEffect(() => {
        fetch("/api/tools/visibility")
            .then((r) => r.json())
            .then((json) => {
                if (json.success && Array.isArray(json.visibility)) {
                    setVisibility(json.visibility);
                }
            })
            .catch(() => {
                // Default fallback: visible.
            });
    }, []);

    const isVisible = useMemo(() => {
        if (!entry) return false;

        const getVis = (toolId: string) => {
            const found = visibility.find((v) => v.toolId === toolId);
            const vis = found ?? { enabled: true, featured: false, publicAccess: true };
            return vis.enabled && vis.publicAccess;
        };

        return getVis("paperknife") && getVis(`paperknife-${entry.slug}`);
    }, [entry, visibility]);

    if (!entry) {
        return <div className="p-8 text-sm font-semibold">Tool not found.</div>;
    }

    if (!isVisible) {
        return <div className="p-8 text-sm font-semibold">This tool is disabled by admin settings.</div>;
    }

    const Component = entry.component;
    return <Component />;
}

