/**
 *  @FileID          app/api/(tools)/bookmarks/[id]/route.ts
 *  @Description     API route for managing individual bookmarks
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:03 AM IST (Kolkata +5:30 UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { Controller_DELETE_Bookmark, Controller_POST_PublishBookmark } from "@Controllers/Bookmarks";
import { Config } from "@Config";
import * as jose from 'jose';

// Verify admin signature using jose JWT token
async function verifyAdminToken(token: string): Promise<boolean> {
    try {
        if (!token) return false;

        const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
        const { payload } = await jose.jwtVerify(token, secret);
        
        // Check if the token contains a valid signature
        return !!payload.signature;
    } catch (error) {
        console.error("Admin token verification error:", error);
        return false;
    }
}

async function verifyAdminToken_CodeRabbit(token: string): Promise<boolean> {
    try {
        if (!token) return false;
        const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
        const { payload } = await jose.jwtVerify(token, secret);
        
        // Check if the token contains a valid signature
        // Example check using a custom field or standard claim
        return payload.isAdmin === true;
    } catch (error) {
        console.error("Admin token verification error:", error);
        return false;
    }
}

// Get a specific bookmark by ID
export async function GET(
    req: NextRequest
) {
    // Admin validation
    const searchParams = req.nextUrl.searchParams;
    const adminToken = searchParams.get('adminSignature');
    const isAdmin = await verifyAdminToken(adminToken || '');

    if (!isAdmin) {
        return NextResponse.json({
            Status: 0,
            Message: "Unauthorized",
            StatusCode: 401
        }, {
            status: 401
        });
    }

    // TODO: Implement get single bookmark functionality

    return NextResponse.json({
        Status: 1,
        Message: "Bookmark Fetched",
        StatusCode: 200,
        Data: {}
    });
}

// Publish a bookmark
// export async function PATCH(req: NextRequest) {
    // Admin validation
    // const searchParams = req.nextUrl.searchParams;
    // const adminToken = searchParams.get('adminSignature');
    // const isAdmin = await verifyAdminToken(adminToken || '');
    // if (!isAdmin) {
    //     return NextResponse.json({
    //         Status: 0,
    //         Message: "Unauthorized",
    //         StatusCode: 401
    //     }, {
    //         status: 401
    //     });
    // }
    // const bookmarkId = params.id || "";
    // const result = await Controller_POST_PublishBookmark(bookmarkId as string);
    // return NextResponse.json({
    //     Status: result.Status === 200 ? 1 : 0,
    //     Message: result.Message,
    //     StatusCode: result.Status
    // }, {
    //     status: result.Status
    // });
// }

// Delete a bookmark
export async function DELETE(
    req: NextRequest
) {
    // Admin validation
    const searchParams = req.nextUrl.searchParams;
    const adminToken = searchParams.get('adminSignature');
    const isAdmin = await verifyAdminToken(adminToken || '');

    if (!isAdmin) {
        return NextResponse.json({
            Status: 0,
            Message: "Unauthorized",
            StatusCode: 401
        }, {
            status: 401
        });
    }

    const bookmarkId = searchParams.get('id') ?? ""
    const result = await Controller_DELETE_Bookmark(bookmarkId as string);

    return NextResponse.json({
        Status: result.Status === 200 ? 1 : 0,
        Message: result.Message,
        StatusCode: result.Status
    }, {
        status: result.Status
    });
} 