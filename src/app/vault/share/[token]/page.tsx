"use client";

import React, { useEffect, useState } from "react";
import { useDesignTheme } from "@Hooks";

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}

export default function SharedVaultPage({ params }: { params: Promise<{ token: string }> }) {
    const { palette } = useDesignTheme();
    const [state, setState] = useState<{ loading: boolean; error: string; doc: any | null }>({
        loading: true,
        error: "",
        doc: null
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            const { token } = await params;
            const r = await fetch(`/api/vault/share/${token}`);
            const j = await r.json();
            if (!mounted) return;
            if (!r.ok) {
                setState({ loading: false, error: j.error || "Share link is invalid", doc: null });
                return;
            }
            setState({ loading: false, error: "", doc: j.doc });
        })();
        return () => {
            mounted = false;
        };
    }, [params]);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8" style={{ color: palette.textPrimary }}>
            {state.loading ? (
                <div>Loading shared file…</div>
            ) : state.error ? (
                <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                    {state.error}
                </div>
            ) : state.doc ? (
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold">{state.doc.filename}</h1>
                    <p style={{ color: palette.textSecondary }}>
                        {state.doc.type?.toUpperCase?.() || "FILE"} · {formatBytes(state.doc.size)}
                    </p>
                    {state.doc.description ? <p style={{ color: palette.textSecondary }}>{state.doc.description}</p> : null}

                    {state.doc.previewUrl && (
                        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(128,128,128,0.25)" }}>
                            {state.doc.mimeType?.startsWith("image/") ? (
                                <img src={state.doc.previewUrl} alt={state.doc.filename} className="w-full max-h-[70vh] object-contain bg-black/5" />
                            ) : state.doc.mimeType?.startsWith("video/") ? (
                                <video src={state.doc.previewUrl} controls className="w-full max-h-[70vh] bg-black" />
                            ) : state.doc.mimeType === "application/pdf" ? (
                                <iframe
                                    src={state.doc.previewUrl}
                                    title={state.doc.filename}
                                    className="w-full h-[75vh]"
                                    sandbox="allow-same-origin allow-scripts"
                                />
                            ) : (
                                <a href={state.doc.previewUrl} className="inline-block p-4 underline" target="_blank" rel="noreferrer">
                                    Open file preview
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
