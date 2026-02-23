/**
 * useCDNUpload — React hook for uploading assets to the private GitHub CDN.
 *
 * Works from any page/component. On success it returns the permanent CDN URL
 * that can be stored in MongoDB alongside any entity (user profile, project, etc.).
 *
 * Usage examples:
 * ─────────────────────────────────────────────────────────────
 *  // 1. User avatar
 *  const { upload, uploading, error } = useCDNUpload();
 *  const url = await upload(file, { type: "avatar", context: "user:userId", tags: ["profile"] });
 *
 *  // 2. Project screenshot
 *  const url = await upload(file, { type: "banner", context: "project:slug", tags: ["screenshot"] });
 *
 *  // 3. Company icon
 *  const url = await upload(file, { type: "icon", context: "company:Google", tags: ["logo"] });
 *
 *  // 4. Certificate image
 *  const url = await upload(file, { type: "document", context: "cert:awsCcp", tags: ["certificate"] });
 * ─────────────────────────────────────────────────────────────
 */
"use client";

import { useState, useCallback } from "react";

export type CDNAssetType =
    | "icon"
    | "avatar"
    | "banner"
    | "background"
    | "video"
    | "document"
    | "other";

export interface UploadOptions {
    /** Asset category — controls the repo subfolder */
    type?: CDNAssetType;
    /** Comma-separated or array of tags for search */
    tags?: string | string[];
    /** Alt text / accessibility description */
    altText?: string;
    /**
     * Entity this asset belongs to.
     * Recommended format: "<kind>:<id>"
     * Examples: "user:abc123", "project:my-portfolio", "company:Google", "cert:awsCcp"
     */
    context?: string;
}

export interface UploadResult {
    assetId: string;
    cdnUrl: string;
    filename: string;
    size: number;
    mimeType: string;
    type: CDNAssetType;
    githubRepo: string;
    checksumMd5: string;
    checksumSha256: string;
}

export interface UseCDNUpload {
    /** Upload a File to the CDN. Returns the permanent CDN URL, or throws. */
    upload: (file: File, opts?: UploadOptions) => Promise<UploadResult>;
    /** true while the upload request is in-flight */
    uploading: boolean;
    /** Progress percentage (0-100) — browser estimated, based on XHR */
    progress: number;
    /** Last error message, or "" when clear */
    error: string;
    /** Last successful UploadResult */
    lastResult: UploadResult | null;
    /** Reset error + lastResult */
    reset: () => void;
}

export function useCDNUpload(): UseCDNUpload {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [lastResult, setLastResult] = useState<UploadResult | null>(null);

    const reset = useCallback(() => {
        setError("");
        setLastResult(null);
        setProgress(0);
    }, []);

    const upload = useCallback(
        async (file: File, opts: UploadOptions = {}): Promise<UploadResult> => {
            setUploading(true);
            setError("");
            setProgress(0);

            try {
                const fd = new FormData();
                fd.append("file", file);
                if (opts.type) fd.append("type", opts.type);
                if (opts.altText) fd.append("altText", opts.altText);
                if (opts.context) fd.append("context", opts.context);

                const tagsStr = Array.isArray(opts.tags)
                    ? opts.tags.join(",")
                    : opts.tags || "";
                if (tagsStr) fd.append("tags", tagsStr);

                // Use XMLHttpRequest so we can track upload progress
                const result = await new Promise<UploadResult>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", "/api/cdn/upload");

                    xhr.upload.addEventListener("progress", (e) => {
                        if (e.lengthComputable) {
                            setProgress(Math.round((e.loaded / e.total) * 100));
                        }
                    });

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                resolve(JSON.parse(xhr.responseText) as UploadResult);
                            } catch {
                                reject(new Error("Invalid response from CDN upload API"));
                            }
                        } else {
                            try {
                                const { error } = JSON.parse(xhr.responseText);
                                reject(new Error(error || `Upload failed (${xhr.status})`));
                            } catch {
                                reject(new Error(`Upload failed (${xhr.status})`));
                            }
                        }
                    });

                    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
                    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

                    xhr.send(fd);
                });

                setProgress(100);
                setLastResult(result);
                return result;
            } catch (e: any) {
                const msg = e?.message || "Upload failed";
                setError(msg);
                throw new Error(msg);
            } finally {
                setUploading(false);
            }
        },
        []
    );

    return { upload, uploading, progress, error, lastResult, reset };
}
