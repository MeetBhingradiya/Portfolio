"use client";
import React from "react";

function UnsupportedPlatformPage() {
    const [platform, setPlatform] = React.useState("");

    React.useEffect(() => {
        if (navigator.platform) {
            if (/iPad|iPhone|iPod/.test(navigator.platform)) {
                setPlatform("iOS");
            } else if (/Android/.test(navigator.userAgent)) {
                setPlatform("Android");
            } else if (/Win/.test(navigator.platform)) {
                setPlatform("Windows");
            } else if (/Mac/.test(navigator.platform)) {
                setPlatform("Mac");
            } else {
                setPlatform("Unknown");
            }
        }
    }, []);

    return (
        <div className="Page CENTER">
            <div className="flex flex-col gap-4 justify-center items-center">
                <h1 className="text-4xl">UnSupported Oprating System</h1>
                <p className="text-2xl">{platform}</p>
            </div>
        </div>
    );
}

export default UnsupportedPlatformPage;
