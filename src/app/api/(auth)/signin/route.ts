/**
 *  @FileID          app\api\(auth)\signin\route.ts
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
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
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
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 22/01/25 1:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 22/02/25 7:25 PM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { RSAKeys_Model, RSAKeyPermissions } from "@Models/RSAKeys"
import { Passkeys_Model } from "@Models/Passkeys";
import { Encrypt, Decrypt } from "@Utils/Crypto";
import { RSA } from "@Utils/RSA";
import { getRelativeTime } from "@Utils/Relativetime";

export function GET(req: NextRequest) {

    const Body = req.body;

    if (useEmptyFields({
        Fields: [
            "email",
            "password"
        ],
        object: Body,
        Type: "Object"
    }).isMising) {
        return NextResponse.json({
            Status: 0,
            Message: 'Missing required fields',
            StatusCode: 400
        }, { status: 400 });
    }




    return NextResponse.json({ Status: 1, Message: 'Email status route is working', StatusCode: 200 }, { status: 200 });
}