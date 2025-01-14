/**
 *  @FileID          Data\APIMessages.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 12:45 PM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
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
        message: "No Records Found",
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
    // ? Find the key in the StatusMessages 
    const Response = StatusMessages[key]
    // ? Return the message
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