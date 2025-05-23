import { NextRequest, NextResponse } from "next/server";
import {
    is_email_already_exists,
    is_email_Verified,
    is_username_created,
    is_username_already_exists
} from "@Controllers";
import { useEmptyFields } from "@Hooks";
import { Config } from "@Config";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";

export async function POST(req: NextRequest) {
    try {

        // ? Validate Authenticated User

        // ? Validate Request
        let Request = await req.json();
        
        if (useEmptyFields({
            targetObject: Request,
            ReqiuredFields: [
                "username",
            ]
        }).isMissing) {
            return NextResponse.json({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            }, {
                status: 400
            });
        }

        await dbConnect();
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