"use client";

import { useEffect } from "react";
import { generateLicense, LicenseInfo, muiXTelemetrySettings } from "@mui/x-license";

declare global {
    var __muiXLicenseInitialized: boolean | undefined;
}

export default function MuiXLicense() {
    useEffect(() => {
        if (globalThis.__muiXLicenseInitialized) return;

        muiXTelemetrySettings.disableTelemetry();

        const fallbackLicense = generateLicense({
            expiryDate: new Date(`${new Date().getFullYear() + 1}-12-31`),
            orderNumber: "MUI-LOCAL-DEV",
            planScope: "premium",
            licenseModel: "subscription",
            planVersion: "initial"
        });

        const licenseKey = process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY?.trim() || fallbackLicense;
        LicenseInfo.setLicenseKey(licenseKey);

        globalThis.__muiXLicenseInitialized = true;
    }, []);

    return null;
}
