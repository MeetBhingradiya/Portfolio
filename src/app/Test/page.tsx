/**
 *  @FileID          app\Test\page.tsx
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

import { Axios } from "@Utils/Axios";
import { Button } from "@heroui/react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Config } from "@Config/index";

function Page() {

    React.useEffect(() => {
        if (Config.Environment === "development") {
            async function getData() {
                return await Axios.post("/api/cors", {
                    body: {
                        endpoint: "https://trends.google.com/trends/api/dailytrends?geo=IN&ed=20250119",
                        method: "GET",
                        body: null,
                        headers: {}
                    }
                })
            }

            console.log(getData());
        }
    }, []);

    return (
        <div className="Page CENTER">
            <div className="flex flex-col gap-4 items-center">
                <h1 className="text-5xl">
                    Testing Page
                </h1>
                <div className="text-gray-400">
                    This is Test Page this will be used to test Only on Development Mode
                </div>
                <Link href="/">
                    <Button variant="faded">
                        Go Back
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default Page;
