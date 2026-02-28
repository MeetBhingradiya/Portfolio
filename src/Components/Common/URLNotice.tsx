"use client";

/**
 * URLNotice
 *
 * Reads the `?notice=` search param on mount and fires a react-toastify
 * notification, then strips the param from the URL so it doesn't persist
 * across navigation.
 *
 * Notice codes → human-readable messages:
 *   immich_access_denied    → Access Denied: You are not authorized to access the photo library.
 *   immich_not_whitelisted  → Access Denied: Your account is not on the Immich access list.
 *   photos_access_denied    → Access Denied: Your account is not allowed to view photos.
 *   photos_error            → An error occurred while checking your photo library access.
 */
import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";

const NOTICE_MESSAGES: Record<string, { message: string; type: "error" | "warning" | "info" | "success" }> = {
    immich_access_denied: {
        message: "Access Denied — You are not authorized to access the photo library.",
        type: "error",
    },
    immich_not_whitelisted: {
        message: "Access Denied — Your account is not on the Immich whitelist. Contact the administrator.",
        type: "error",
    },
    photos_sign_in_required: {
        message: "Please sign in to your account before accessing the photo library.",
        type: "info",
    },
    photos_access_denied: {
        message: "Access Denied — Your account does not have permission to view photos.",
        type: "error",
    },
    photos_error: {
        message: "Something went wrong while verifying your photo library access. Please try again.",
        type: "warning",
    },
};

export default function URLNotice() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const notice = searchParams.get("notice");
        if (!notice) return;

        const config = NOTICE_MESSAGES[notice];
        if (config) {
            toast[config.type](config.message, {
                autoClose: 6000,
                toastId: `notice-${notice}`, // deduplicate on rapid re-render
            });
        }

        // Strip the ?notice= param from the URL cleanly
        const next = new URLSearchParams(searchParams.toString());
        next.delete("notice");
        const qs = next.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    return null;
}
