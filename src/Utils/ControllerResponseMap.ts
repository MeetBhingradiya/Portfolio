import { Config } from "@Config";
import { Controller_Response } from "@Types";
import { HMACSignature } from "@Utils/HMACSignature";
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
        Response.Signature = HMACSignature().generateSignature(Response.Data);
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
