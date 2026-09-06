"use client";

/**
 * useDeviceFingerprint Hook
 *
 * React hook that initializes the device fingerprint on mount and
 * provides the hash value to components. Also installs the global
 * fetch interceptor to automatically attach the fingerprint header.
 *
 * Usage:
 *   const fingerprint = useDeviceFingerprint();
 *   // fingerprint is null until computed, then a 64-char hex string
 */

import { useState, useEffect } from "react";
import { initDeviceFingerprint } from "@Library/DeviceFingerprint";

/**
 * Initialize device fingerprint on mount.
 * Returns null while computing, then the 64-char hex fingerprint hash.
 */
export function useDeviceFingerprint(): string | null {
    const [fingerprint, setFingerprint] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        initDeviceFingerprint().then((fp) => {
            if (!cancelled) {
                setFingerprint(fp);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return fingerprint;
}

export default useDeviceFingerprint;
