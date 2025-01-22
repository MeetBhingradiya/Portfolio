/**
 *  @FileID          Data\APIMessages.ts
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
 *  @created 13/01/25 12:45 PM IST (Kolkata +5:30 UTC)
 *  @modified 22/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */


import { NextResponse } from "next/server"

interface IStatusMessages {
    [key: number]: {
        message?: string
        statuscode: number
        status: 0 | 1
    }
}

export const StatusMessages: IStatusMessages = {
    200: {
        statuscode: 200,
        status: 1
    },
    404: {
        message: "No Documents Found",
        statuscode: 404,
        status: 0
    }
}

export function APIResponse(key:number, {
    data,
    headers
}: {
    data?: any
    headers?: [string, string][] | Record<string, string>
}) {
    const Response = StatusMessages[key]

    const newResponse = NextResponse.json({
        Status: Response.status,
        Message: Response.message,
        data
    },
    {
        status: Response.statuscode,
        headers: headers
    })

    return newResponse    
}