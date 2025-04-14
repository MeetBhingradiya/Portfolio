/**
 *  @FileID          Utils/ControllerResponseMap.ts
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
 *  @created 11/04/25 4:27 PM IST (Kolkata +5:30 UTC)
 *  @modified 11/04/25 4:27 PM IST (Kolkata +5:30 UTC)
 */

import { Config } from "@Config";
import { Controller_Response } from "@Types";
// import { HMACSignature } from "@Utils/HMACSignature";
import { useEmptyFields } from "@Hooks";
import { NextResponse } from "next/server";

/**
 * Maps a `Controller_Response` object to a standardized Next.js API response.
 * 
 * This function ensures:
 * - Required fields (`Status`, `Message`, `StatusCode`) are present.
 * - Debug information is removed in non-development environments.
 * - A cryptographic signature is generated if `Data` exists.
 * - `StatusNumber` is set based on `StatusCode` (only if it's a number).
 * - Returns a `NextResponse.json()` object with a structured response.
 * 
 * @param Response The `Controller_Response` object containing status, message, data, and optional debug info.
 * @returns `NextResponse` formatted JSON response with appropriate status codes.
 * @throws Error if required fields are missing.
 */
function ControllerResponseMap(Response: Controller_Response): NextResponse {

    const missingFields = useEmptyFields({
        ReqiuredFields: ["Status", "Message", "StatusCode"],
        targetObject: Response,
    });

    if (missingFields.isMissing) {
        throw new Error("Required Fields are not provided in ControllerResponseMap");
    }

    // Remove Debug Information if not in development
    if (Config.Environment !== "development") {
        delete Response.Debug;
    }

    // Generate Signature if Data is present
    if (Response.Data) {
        // Response.Signature = HMACSignature().generateSignature(Response.Data);
    }

    // Ensure StatusNumber is set to a number
    const StatusNumber = typeof Response.StatusCode === "number" ? Response.StatusCode : 200;

    // Create the response object without `StatusNumber` & `StatusText`
    const JSONBody: Controller_Response = {
        Status: Response.Status,
        Message: Response.Message,
        StatusCode: Response.StatusCode,
        Signature: Response.Signature || undefined,
        Data: Response.Data || undefined,
        Debug: Response.Debug || undefined,
    };

    return NextResponse.json(JSONBody, {
        status: StatusNumber,
        statusText: Response.StatusText || undefined,
    });
}

export {
    ControllerResponseMap
};
