/**
 *  @FileID          app/api/(tools)/bookmarks/migrate/route.ts
 *  @Description     API endpoint to migrate all bookmarks from old format to new format
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
import { Bookmarks_Model } from "@Models/Bookmarks";
import { migrateBookmarkFormat } from "@Controllers/Bookmarks";
import dbConnect from "@Utils/dbConnect";
import { Config } from "@Config";
import * as jose from 'jose';

async function verifyAdminToken(token: string): Promise<boolean> {
    try {
        if (!token) return false;

        const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
        const { payload } = await jose.jwtVerify(token, secret);
        
        return !!payload.signature;
    } catch (error) {
        console.error("Admin token verification error:", error);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // This endpoint is admin-only
        const adminToken = req.headers.get('x-admin-signature');
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

        await dbConnect();
        
        // Find all bookmarks in old format (having 'icon' but not 'Icon')
        const oldFormatBookmarks = await Bookmarks_Model.find({
            icon: { $exists: true }
        }).lean();
        
        // Perform migration for each bookmark
        const migrationResults = await Promise.all(
            oldFormatBookmarks.map(async (bookmark) => {
                try {
                    const migratedBookmark = migrateBookmarkFormat(bookmark);
                    
                    // Update the database with the new format
                    await Bookmarks_Model.updateOne(
                        { _id: bookmark._id },
                        { 
                            $set: migratedBookmark,
                            $unset: {
                                name: 1, 
                                url: 1, 
                                isSVGSrc: 1, 
                                description: 1, 
                                size: 1, 
                                windowsapp: 1, 
                                androidapp: 1,
                                keywords: 1,
                                icon: 1,
                            }
                        }
                    );
                    
                    return {
                        id: bookmark.id,
                        newId: migratedBookmark.BookmarkID,
                        status: 'success'
                    };
                } catch (error) {
                    return {
                        id: bookmark.id,
                        status: 'failed',
                        error: (error as Error).message
                    };
                }
            })
        );
        
        const successCount = migrationResults.filter(r => r.status === 'success').length;
        const failedCount = migrationResults.filter(r => r.status === 'failed').length;
        
        return NextResponse.json({
            Status: 1,
            Message: `Successfully migrated ${successCount}/${oldFormatBookmarks.length} bookmarks`,
            StatusCode: 200,
            Stats: {
                total: oldFormatBookmarks.length,
                successful: successCount,
                failed: failedCount
            },
            Results: migrationResults
        }, {
            status: 200
        });
        
    } catch (error) {
        console.error("Error during bookmark migration:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            StatusCode: 500,
            Error: (error as Error).message
        }, {
            status: 500
        });
    }
} 