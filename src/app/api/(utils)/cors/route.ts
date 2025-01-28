/**
 *  @FileID          app\api\(utils)\cors\route.ts
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


import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
    try {
        const { body = null } = await req.json();

        if (!body.endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            );
        }

        const axiosConfig = {
            url: body.endpoint,
            method: body.method || 'GET',
            headers: body.headers || {},
            data: body.body,
        };

        const response = await axios(axiosConfig);

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
                details: error.response?.data || null,
            },
            { status: error.response?.status || 500 }
        );
    }
}