/**
 *  @FileID          app/api/(tools)/bookmarks/route.ts
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:03 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { Controller_GET_Bookmarks } from "@Controllers/Bookmarks";
import { Config } from "@Config";
import * as jose from 'jose';

// ? Enables Cache 
export const revalidate = 60

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

export async function GET(req: NextRequest) {
    // Get pagination parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get admin signature token
    const adminToken = searchParams.get('adminSignature');
    const isAdmin = await verifyAdminToken(adminToken || '');
    
    // Get already added bookmark IDs
    const existingBookmarks = searchParams.get('existingIds');
    const excludeIds = existingBookmarks ? existingBookmarks.split(',') : [];
    
    // Check if we should skip migration
    const skipMigration = searchParams.get('skipMigration') === 'true';
    
    // Get response from controller with options
    let Response: Array<any> = await Controller_GET_Bookmarks({
        isAdmin,
        excludeIds,
        showUnpublished: isAdmin,
        migrateOldBookmarks: !skipMigration
    });

    if (Response.length === 0) {
        return NextResponse.json({
            Status: 1,
            Message: "No bookmarks available",
            StatusCode: 200,
            Pagination: {
                page,
                limit,
                totalItems: 0,
                totalPages: 0,
                hasMore: false
            },
            Data: []
        }, {
            status: 200
        });
    }

    // Pagination
    const totalItems = Response.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedResults = Response.slice(startIndex, endIndex);

    return NextResponse.json({
        Status: 1,
        Message: "Bookmarks Fetched",
        StatusCode: 200,
        Pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasMore: page < totalPages
        },
        Data: paginatedResults
    }, {
        status: 200
    });
}

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();
        
        // Get pagination parameters from body
        const page = parseInt(body.page || '1');
        let limit = parseInt(body.limit || '20');

        if (limit > 20) {
            limit = 20;
        }

        if (limit < 5) {
            limit = 5;
        }
        
        // Get admin signature token from headers
        const adminToken = req.headers.get('x-admin-signature') || body.adminSignature;
        const isAdmin = await verifyAdminToken(adminToken || '');
        
        // Get already added bookmark IDs from body
        const excludeIds = Array.isArray(body.existingIds) 
            ? body.existingIds 
            : (body.existingIds ? body.existingIds.split(',') : []);
        
        // Check if we should skip migration
        const skipMigration = body.skipMigration === true;
        
        // Get response from controller with options
        let Response: Array<any> = await Controller_GET_Bookmarks({
            isAdmin,
            excludeIds,
            showUnpublished: isAdmin,
            migrateOldBookmarks: !skipMigration
        });

        if (Response.length === 0) {
            return NextResponse.json({
                Status: 1,
                Message: "No bookmarks available",
                StatusCode: 200,
                Pagination: {
                    page,
                    limit,
                    totalItems: 0,
                    totalPages: 0,
                    hasMore: false
                },
                Data: []
            }, {
                status: 200
            });
        }

        // Pagination
        const totalItems = Response.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedResults = Response.slice(startIndex, endIndex);

        return NextResponse.json({
            Status: 1,
            Message: "Bookmarks Fetched",
            StatusCode: 200,
            Pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasMore: page < totalPages
            },
            Data: paginatedResults
        }, {
            status: 200
        });
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Error processing request",
            StatusCode: 500
        }, {
            status: 500
        });
    }
}