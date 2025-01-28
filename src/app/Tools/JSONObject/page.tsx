/**
 *  @FileID          app\Tools\JSONObject\page.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


"use client";

import React from "react";
import "@Styles/Tools-JSONObject.sass";

interface IState {
    json: string;
    object: string;
    error: {
        isERROR: boolean;
        message: string;
    };
}

export default function JSONObject() {
    const [state, setState] = React.useState<IState>({
        json: "",
        object: "",
        error: {
            isERROR: false,
            message: "",
        },
    });

    const handleJSONChange = (value: string) => {
        try {
            const parsed = JSON.parse(value);
            setState({
                ...state,
                json: value,
                object: JSON.stringify(parsed, null, 2),
                error: { isERROR: false, message: "" },
            });
        } catch (error) {
            setState({
                ...state,
                json: value,
                error: { isERROR: true, message: "Invalid JSON" },
            });
        }
    };

    const handleObjectChange = (value: string) => {
        try {
            const parsed = JSON.parse(value);
            setState({
                ...state,
                object: value,
                json: JSON.stringify(parsed, null, 2),
                error: { isERROR: false, message: "" },
            });
        } catch (error) {
            setState({
                ...state,
                object: value,
                error: { isERROR: true, message: "Invalid Object" },
            });
        }
    };

    return (
        <div className="Page CENTER JSONObject flex flex-col gap-4">
            <div className="flex flex-row gap-4">
                {/* JSON Input */}
                <div className="flex flex-col gap-2">
                    <textarea
                        className="w-[500px] h-[300px] p-2 border border-gray-300 rounded-md"
                        placeholder="Enter your JSON here"
                        value={state.json}
                        onChange={(e) => handleJSONChange(e.target.value)}
                    />
                </div>

                {/* Object Input */}
                <div className="flex flex-col gap-2">
                    <textarea
                        className="w-[500px] h-[300px] p-2 border border-gray-300 rounded-md"
                        placeholder="Enter your Object here"
                        value={state.object}
                        onChange={(e) => handleObjectChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Error Message */}
            {state.error.isERROR && (
                <div className="text-red-500 mt-2">{state.error.message}</div>
            )}
        </div>
    );
}
