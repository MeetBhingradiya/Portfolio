/**
 *  @FileID          app/api/(tools)/bookmarks/route.ts
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 11/04/25 4:27 PM IST (Kolkata +5:30 UTC)
 */

import { NextRequest } from "next/server";
import { Config } from "@Config";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import * as jose from 'jose';
import dbConnect from "@Utils/dbConnect";
import { Bookmarks_Model } from "@Models/Bookmarks";

// ? Enables Cache 
export const revalidate = 60

async function verifyAdminToken(token: string): Promise<boolean> {
    try {
        if (!token) return false;

        const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
        const verified = await jose.jwtVerify(token, secret);

        if (!verified) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();

        const {
            _page,
            _limit,
            excludeID,
            adminSignature,
            query,
        } = body;

        let page = parseInt(_page || '1');
        let limit = parseInt(_limit || '20');

        if (limit > 20) {
            limit = 20;
        }

        if (limit < 5) {
            limit = 5;
        }
        
        const adminToken = req.headers.get('x-admin-signature') || adminSignature;
        const isAdmin = await verifyAdminToken(adminToken || '');
        
        // Get already added bookmark IDs from body
        const excludeIds = Array.isArray(excludeID) 
            ? excludeID 
            : (excludeID ? excludeID.split(',') : []);
            
        await dbConnect();

        let Bookmarks = await Bookmarks_Model.find({
            isDeleted: false,
            BookmarkID: { $nin: excludeIds },

            // ? Only Admins Can See Unpublished Bookmarks
            isPublished: isAdmin ? { $ne: false } : true,

            // ? Only Admins Can See Admin Only Bookmarks
            isAdminOnly: isAdmin ? { $ne: false } : false,

            // ? Filter Bookmarks by Name, Description, Keywords
            $or: [
                { Name: { $regex: query, $options: 'i' } },
                { Description: { $regex: query, $options: 'i' } },
                { Keywords: { $regex: query, $options: 'i' } }
            ],

            // ? Sponsored Bookmarks Auto Top Priority on Results
        }).limit(limit).skip((page - 1) * limit).sort({ createdAt: -1 }).lean().exec();
        
        if (!Bookmarks || Bookmarks.length === 0) {
            return ControllerResponseMap({
                Status: 1,
                Message: "No bookmarks available",
                StatusCode: 200,
                Data: {
                    Bookmarks: [],
                    Pagination: {
                        page,
                        limit,
                        totalItems: 0,
                        totalPages: 0,
                        hasMore: false
                    }
                }
            });
        }

        // ? Sort on First Priority : Sponsored Bookmarks
        Bookmarks = Bookmarks.sort((a, b) => {
            if (a.isSponsored && !b.isSponsored) return -1;
            if (!a.isSponsored && b.isSponsored) return 1;
            return 0;
        });

        // Pagination
        const totalItems = Bookmarks.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedResults = Bookmarks.slice(startIndex, endIndex);

        return ControllerResponseMap({
            Status: 1,
            Message: "Bookmarks Successfully Fetched",
            StatusCode: 200,
            Data: {
                Bookmarks: paginatedResults,
                Pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    hasMore: page < totalPages
                }
            }
        });
    } catch (error) {
        return ControllerResponseMap({
            Status: 0,
            Message: "Error processing request",
            StatusCode: 500,
            Data: [],
            Debug: error
        });
    }
}