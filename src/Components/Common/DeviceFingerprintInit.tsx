"use client";

/**
 * DeviceFingerprintInit — Client Component
 *
 * Invisible component that initializes the device fingerprint system
 * on mount. Generates the canvas/WebGL hash and installs the global
 * fetch interceptor to automatically attach the x-device-fp header
 * to all same-origin requests.
 *
 * This component renders nothing — it only runs side effects.
 */

import { useEffect } from "react";
import { initDeviceFingerprint } from "@Library/DeviceFingerprint";

export default function DeviceFingerprintInit() {
    useEffect(() => {
        // Initialize fingerprint + install fetch interceptor
        // Run after a short delay to avoid blocking initial render
        const timer = setTimeout(() => {
            initDeviceFingerprint().catch(() => {
                // Fingerprint generation failed — non-critical, ignore
                console.warn("Failed to initialize device fingerprint");
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return null;
}
