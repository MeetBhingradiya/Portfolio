import { Config } from "../Config";
import { Controller_Response } from "../Types";
// import { HMACSignature } from "@Utils/HMACSignature";
import { useEmptyFields } from "../Hooks";
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
        targetObject: Response
    });

    if (missingFields.isMissing) {
        throw new Error(
            "Required Fields are not provided in ControllerResponseMap"
        );
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
    const StatusNumber =
        typeof Response.StatusCode === "number" ? Response.StatusCode : 200;

    // Create the response object without `StatusNumber` & `StatusText`
    const JSONBody: Controller_Response = {
        Status: Response.Status,
        Message: Response.Message,
        StatusCode: Response.StatusCode,
        Signature: Response.Signature || undefined,
        Data: Response.Data || undefined,
        Debug: Response.Debug || undefined
    };
    // console.log("JSONBody", JSONBody);
    return NextResponse.json(JSONBody, {
        status: StatusNumber,
        statusText: Response.StatusText || undefined
    });
}

/**
 * Maps a `Controller_Response` object to a FormData response for file transfers.
 *
 * This function creates a multipart/form-data response containing:
 * - Metadata as JSON in the 'metadata' field
 * - Files as binary data with proper content types
 *
 * @param Response The `Controller_Response` object containing status, message, and data.
 * @param files Array of file objects with buffer, filename, and mimeType.
 * @returns `NextResponse` with multipart FormData containing metadata and files.
 * @throws Error if required fields are missing.
 */
function ControllerResponseMapFormData(
    Response: Controller_Response,
    files: Array<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
        metadata?: any;
    }>
): NextResponse {
    const missingFields = useEmptyFields({
        ReqiuredFields: ["Status", "Message", "StatusCode"],
        targetObject: Response
    });

    if (missingFields.isMissing) {
        throw new Error(
            "Required Fields are not provided in ControllerResponseMapFormData"
        );
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
    const StatusNumber =
        typeof Response.StatusCode === "number" ? Response.StatusCode : 200;

    // Create the multipart boundary
    const boundary = `----formdata-boundary-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    // Build multipart form data manually
    const bufferParts: Buffer[] = [];
    const textEncoder = new TextEncoder();

    // Add metadata as the first part
    const metadata: Controller_Response = {
        Status: Response.Status,
        Message: Response.Message,
        StatusCode: Response.StatusCode,
        Signature: Response.Signature || undefined,
        Data: Response.Data || undefined,
        Debug: Response.Debug || undefined
    };

    let metadataPart = `--${boundary}\r\n`;
    metadataPart += `Content-Disposition: form-data; name="metadata"\r\n`;
    metadataPart += `Content-Type: application/json\r\n\r\n`;
    metadataPart += `${JSON.stringify(metadata)}\r\n`;

    bufferParts.push(Buffer.from(metadataPart, "utf8"));

    // Add each file as a separate part
    files.forEach((file, index) => {
        let filePart = `--${boundary}\r\n`;
        filePart += `Content-Disposition: form-data; name="file_${index}"; filename="${file.filename}"\r\n`;
        filePart += `Content-Type: ${file.mimeType}\r\n\r\n`;

        bufferParts.push(Buffer.from(filePart, "utf8"));
        bufferParts.push(file.buffer);
        bufferParts.push(Buffer.from("\r\n", "utf8"));

        // Add file metadata if provided
        if (file.metadata) {
            let fileMetadataPart = `--${boundary}\r\n`;
            fileMetadataPart += `Content-Disposition: form-data; name="file_${index}_metadata"\r\n`;
            fileMetadataPart += `Content-Type: application/json\r\n\r\n`;
            fileMetadataPart += `${JSON.stringify(file.metadata)}\r\n`;

            bufferParts.push(Buffer.from(fileMetadataPart, "utf8"));
        }
    });

    // Add closing boundary
    bufferParts.push(Buffer.from(`--${boundary}--\r\n`, "utf8"));

    // Combine all buffer parts
    const totalLength = bufferParts.reduce((sum, buf) => sum + buf.length, 0);
    const finalBuffer = Buffer.concat(bufferParts, totalLength);

    return new NextResponse(finalBuffer, {
        status: StatusNumber,
        statusText: Response.StatusText || undefined,
        headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": finalBuffer.length.toString()
        }
    });
}

export { ControllerResponseMap, ControllerResponseMapFormData };
