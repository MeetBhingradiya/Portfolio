import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Sessions_Model } from "@Models/Sessions";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { sessionId: string } }
) {
	try {
		const authHeader = request.headers.get("authorization");
		const token =
			authHeader?.replace("Bearer ", "") ||
			request.cookies.get("auth-token")?.value;

		if (!token) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Authentication token required",
					StatusCode: 401,
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
					StatusCode: 401,
				},
				{ status: 401 }
			);
		}

		const { sessionId } = params;

		if (!sessionId) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Session ID is required",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		// Prevent terminating current session
		if (sessionId === decoded.sessionID) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Cannot terminate current session",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		await dbConnect();

		// Terminate the specific session (only if it belongs to the current user)
		const result = await Sessions_Model.deleteOne({
			SessionID: sessionId,
			UserID: decoded.userID,
		});

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Session not found or already terminated",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		log(`User ${decoded.userID} terminated session: ${sessionId}`);

		return NextResponse.json({
			Status: 1,
			Message: "Session terminated successfully",
			StatusCode: 200,
		});
	} catch (error: any) {
		log(`Session termination error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to terminate session",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}
