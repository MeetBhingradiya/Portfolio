/**
 *  @FileID          app/api/(auth)/username/route.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 *  @modified 12/03/25 1:52 PM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import {
    is_email_already_exists,
    is_email_Verified,
    is_username_created,
    is_username_already_exists
} from "@Controllers";
import { useEmptyFields } from "@Hooks";
import { Config } from "@Config";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";

export async function POST(req: NextRequest) {
    try {

        // ? Validate Authenticated User

        // ? Validate Request
        let Request = await req.json();
        
        if (useEmptyFields({
            targetObject: Request,
            ReqiuredFields: [
                "username",
            ]
        }).isMising) {
            return NextResponse.json({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            }, {
                status: 400
            });
        }

        await dbConnect();
    } catch (error:any) {
        log(error?.message);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, {
            status: 500
        });
    }
}