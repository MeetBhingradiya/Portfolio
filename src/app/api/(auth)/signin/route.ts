import { NextRequest, NextResponse } from "next/server";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { RSAKeys_Model, RSAKeyPermissions } from "@Models/RSAKeys"
import { Passkeys_Model } from "@Models/Passkeys";
import { Encrypt, Decrypt } from "@Utils/Crypto";
import { RSA } from "@Utils/RSA";
import { getRelativeTime } from "@Utils/Relativetime";
import { log } from "@Utils";

export async function POST(req: NextRequest) {
    try {
        let Request = await req.json();
        if (useEmptyFields({
            ReqiuredFields: [
                "email",
                "password"
            ],
            targetObject: Request
        }).isMissing) {
            return NextResponse.json({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            }, { status: 400 });
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