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