import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@Models/Users";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider } = await params;

        // Verify authentication
        const authHeader = request.headers.get("authorization");
        const token =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("auth-token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid authentication token",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        // Connect to database
        await dbConnect();

        // Find the user
        const user = await Users_Model.findOne({ UserID: decoded.userID });
        if (!user) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Check if the connection exists
        const connectionIndex =
            user.thirdPartyConnections?.findIndex(
                (conn: any) => conn.provider === provider
            ) ?? -1;

        if (connectionIndex === -1) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: `No ${provider} connection found`,
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        // Remove the connection
        user.thirdPartyConnections?.splice(connectionIndex, 1);

        // Save the updated user
        await user.save();

        log(
            `OAuth disconnection successful for user ${decoded.userID} with provider ${provider}`
        );

        return NextResponse.json(
            {
                Status: 1,
                Message: `Successfully disconnected from ${provider}`,
                StatusCode: 200
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`OAuth disconnect error: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
