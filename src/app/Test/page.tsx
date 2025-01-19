/**
 *  @FileID          app\Test\page.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import { Axios } from "@Utils/Axios";
import { Button } from "@nextui-org/react";
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
