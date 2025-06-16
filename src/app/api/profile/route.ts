import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@Models/Users";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";

export async function PATCH(request: NextRequest) {
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

		const { FirstName, LastName, Username } = await request.json();

		if (!FirstName || !LastName || !Username) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "First name, last name, and username are required",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		await dbConnect();

		// Check if username is already taken by another user
		if (Username) {
			const existingUser = await Users_Model.findOne({
				Username: Username,
				UserID: { $ne: decoded.userID },
			});

			if (existingUser) {
				return NextResponse.json(
					{
						Status: 0,
						Message: "Username is already taken",
						StatusCode: 409,
					},
					{ status: 409 }
				);
			}
		}

		// Update user profile
		const updatedUser = await Users_Model.findOneAndUpdate(
			{ UserID: decoded.userID },
			{
				FirstName,
				LastName,
				Username,
				updatedAt: new Date(),
			},
			{ new: true }
		).select("-Credentials");

		if (!updatedUser) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "User not found",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		log(`User ${decoded.userID} updated profile`);

		return NextResponse.json({
			Status: 1,
			Message: "Profile updated successfully",
			StatusCode: 200,
			Data: {
				FirstName: updatedUser.FirstName,
				LastName: updatedUser.LastName,
				Username: updatedUser.Username,
			},
		});
	} catch (error: any) {
		log(`Profile update error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to update profile",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}
