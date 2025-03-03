/**
 *  @FileID          app\api\(auth)\email\route.ts
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
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
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
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import {
    is_email_already_exists,
    is_email_Verified,
    is_username_created
} from "@Controllers";
import { useEmptyFields } from "@Hooks";
import { Config } from "@Config";
import { dbConnect } from "@Utils/dbConnect";

/**
 * Processes a POST request to validate an email and check related user setup.
 *
 * This API endpoint:
 * - Parses the JSON body of the incoming request and verifies that the "email" field is provided.
 * - Establishes a database connection.
 * - Determines if the provided email already exists:
 *   - If the email exists and is verified, it checks whether a username has been created and returns a response indicating that username creation is required if not.
 *   - If the email exists but is not verified, it returns a response indicating that the email requires verification.
 *   - If the email does not exist, it confirms that the email is available.
 * - Returns appropriate JSON responses with relevant status codes, including handling error conditions with a 500 status code.
 *
 * @returns A JSON response object conveying the email verification and username creation status.
 */
export async function POST(req: NextRequest) {
    try {
        let Request = await req.json();
        
        if (useEmptyFields({
            Object: Request,
            ReqiuredFields: ["email"]
        }).isMising) {
            return NextResponse.json({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            }, {
                status: 400
            });
        }

        await dbConnect();
        const isExists = await is_email_already_exists(Request.email);
        if (isExists) {
            // ? Check for Email Verification
            const isVerified = await is_email_Verified(Request.email);
            if (isVerified) {
                // ? Check for Username Creation
                const isUsernameCreated = await is_username_created(Request.username);
                if (!isUsernameCreated) {
                    return NextResponse.json({
                        Status: 1,
                        Message: 'username creation required',
                        StatusCode: Config.StatusCodes.UsernameRequired
                    }, {
                        status: 200
                    });
                }
                return NextResponse.json({
                    Status: 0,
                    Message: 'Email already exists',
                    StatusCode: 200
                }, {
                    status: 200
                });
            } else {
                return NextResponse.json({
                    Status: 1,
                    Message: 'Email already exists but not verified',
                    StatusCode: Config.StatusCodes.VerificationRequired
                }, {
                    status: 200
                });
            }
        }
        return NextResponse.json({
            Status: 1,
            Message: 'Email is available',
            StatusCode: 200
        }, {
            status: 200
        });
    } catch (error:any) {
        console.error(error?.message);
        return NextResponse.json({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500
        }, {
            status: 500
        });
    }
}