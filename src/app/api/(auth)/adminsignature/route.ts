/**
 *  @FileID          app/api/(auth)/email/route.ts
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
import { useEmptyFields } from "@Hooks";
import { Config } from "@Config";
import { log } from "@Utils";
import { createHash } from "crypto";
import * as jose from 'jose';

export async function POST(req: NextRequest) {
    try {
        let Request = await req.json();
        
        if (useEmptyFields({
            targetObject: Request,
            ReqiuredFields: ["signature"]
        }).isMissing) {
            return NextResponse.json({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            }, {
                status: 400
            });
        }

        // ? Create SHA-512 Hash of the Signature
        const SignatureHash = await createHash('sha512').update(Request.signature).digest('hex');

        if (SignatureHash === Config.Env.ADMIN_SIGNATURE) {
            const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
            const token = await new jose.SignJWT({
                signature: SignatureHash
            })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('30m')
            .sign(secret);
            
            return NextResponse.json({
                Status: 1,
                Message: 'Signature is valid',
                StatusCode: 200,
                Data: {
                    Token: token
                }
            }, {
                status: 200
            });
        } else {
            return NextResponse.json({
                Status: 0,
                Message: 'Signature is invalid',
                StatusCode: 400
            }, {
                status: 400
            });
        }

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