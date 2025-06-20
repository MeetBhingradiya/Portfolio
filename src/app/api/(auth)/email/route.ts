import { NextRequest, NextResponse } from "next/server";
import {
    is_email_already_exists,
    is_email_Verified,
    is_username_created
} from "@Controllers";
import { useEmptyFields } from "@Hooks";
import { Config } from "@Config";
import { dbConnect } from "@Utils/dbConnect";
import { log } from "@Utils";

export async function POST(req: NextRequest) {
    try {
        let Request = await req.json();

        if (
            useEmptyFields({
                targetObject: Request,
                ReqiuredFields: ["email"]
            }).isMissing
        ) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Missing required fields",
                    StatusCode: 400
                },
                {
                    status: 400
                }
            );
        }

        await dbConnect();
        const isExists = await is_email_already_exists(Request.email);
        if (isExists) {
            // ? Check for Email Verification
            const isVerified = await is_email_Verified(Request.email);
            if (isVerified) {
                // ? Check for Username Creation
                const isUsernameCreated = await is_username_created(
                    Request.email
                );
                if (!isUsernameCreated) {
                    return NextResponse.json(
                        {
                            Status: 1,
                            Message: "username creation required",
                            StatusCode: Config.StatusCodes.UsernameRequired
                        },
                        {
                            status: 200
                        }
                    );
                }
                return NextResponse.json(
                    {
                        Status: 0,
                        Message: "Email already exists",
                        StatusCode: 200
                    },
                    {
                        status: 200
                    }
                );
            } else {
                return NextResponse.json(
                    {
                        Status: 1,
                        Message: "Email already exists but not verified",
                        StatusCode: Config.StatusCodes.VerificationRequired
                    },
                    {
                        status: 200
                    }
                );
            }
        }
        return NextResponse.json(
            {
                Status: 1,
                Message: "Email is available",
                StatusCode: 200
            },
            {
                status: 200
            }
        );
    } catch (error: any) {
        log(error?.message);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            {
                status: 500
            }
        );
    }
}
