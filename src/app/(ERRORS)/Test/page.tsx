/**
 *  @FileID          app/(ERRORS)/Test/page.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import React from "react";
import { Config } from "@Config/index";

function Page() {

    React.useEffect(() => {
        if (Config.Environment === "development") {
            // ? Do Something Here that Only work on Development Mode
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
