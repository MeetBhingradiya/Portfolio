/**
 *  @FileID          app\api\(auth)\email\status\route.ts
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
 *  author or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last sUpdated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 22/01/25 1:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 22/01/25 1:05 PM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
    return NextResponse.json({ Status: 1, Message: 'Email status route is working', StatusCode: 200 }, { status: 200 });
}