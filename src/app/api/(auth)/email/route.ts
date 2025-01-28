/**
 *  @FileID          app\api\(auth)\email\route.ts
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
 *  @created 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { is_email_already_exists } from "@/Controllers/Signup";

export async function POST(req: NextRequest) {
    try {
        const { body = null } = await req.json();
        const isExists = await is_email_already_exists(body.email);
        if (isExists) {
            return NextResponse.json({ Status: 0, Message: 'Email already exists', StatusCode: 400 }, { status: 400 });
        }
        return NextResponse.json({ Status: 1, Message: 'Email is available', StatusCode: 200 }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ Status: 0, Message: 'Internal server error', StatusCode: 500 }, { status: 500 });
    }
}