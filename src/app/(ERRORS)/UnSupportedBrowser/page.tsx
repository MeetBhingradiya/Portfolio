"use client";
import React from "react";

function UnSupportedPlateform_Page() {
    const [platform, setPlatform] = React.useState("");

    React.useEffect(() => {
        const userAgent = navigator.userAgent;
        // if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        //     setPlatform('iOS');
        // } else if (userAgent.includes('Android')) {
        //     setPlatform('Android');
        // } else if (userAgent.includes('Windows')) {
        //     setPlatform('Windows');
        // } else if (userAgent.includes('Mac')) {
        //     setPlatform('Mac');
        // }
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

export default UnSupportedPlateform_Page;
