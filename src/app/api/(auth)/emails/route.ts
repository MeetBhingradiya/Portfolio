import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@Models/Users";
import { verifyJWT } from "@Utils/JWT";
import { log } from "@Utils";

// Add email
export async function POST(request: NextRequest) {
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

		const { email } = await request.json();

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Valid email address is required",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		await dbConnect();

		// Check if email already exists for this user or another user
		const existingUser = await Users_Model.findOne({
			"Emails.Email": email,
		});

		if (existingUser) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Email address is already registered",
					StatusCode: 409,
				},
				{ status: 409 }
			);
		}

		// Add email to user's account
		const updatedUser = await Users_Model.findOneAndUpdate(
			{ UserID: decoded.userID },
			{
				$push: {
					Emails: {
						Email: email,
						isPrimary: false,
						isVerified: false,
						addedAt: new Date(),
					},
				},
				updatedAt: new Date(),
			},
			{ new: true }
		).select("Emails");

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

		log(`User ${decoded.userID} added email: ${email}`);

		return NextResponse.json({
			Status: 1,
			Message: "Email added successfully",
			StatusCode: 200,
			Data: {
				email: email,
				message: "Verification email will be sent shortly",
			},
		});
	} catch (error: any) {
		log(`Add email error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to add email",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}

// Update email (set primary)
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

		const { email, setPrimary } = await request.json();

		if (!email) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Email address is required",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		await dbConnect();

		if (setPrimary) {
			// First, unset all emails as primary
			await Users_Model.updateOne(
				{ UserID: decoded.userID },
				{ $set: { "Emails.$[].isPrimary": false } }
			);

			// Then set the specified email as primary
			const result = await Users_Model.updateOne(
				{
					UserID: decoded.userID,
					"Emails.Email": email,
				},
				{
					$set: {
						"Emails.$.isPrimary": true,
						updatedAt: new Date(),
					},
				}
			);

			if (result.matchedCount === 0) {
				return NextResponse.json(
					{
						Status: 0,
						Message: "Email not found",
						StatusCode: 404,
					},
					{ status: 404 }
				);
			}

			log(`User ${decoded.userID} set primary email: ${email}`);
		}

		return NextResponse.json({
			Status: 1,
			Message: "Email updated successfully",
			StatusCode: 200,
		});
	} catch (error: any) {
		log(`Update email error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to update email",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}

// Remove email
export async function DELETE(request: NextRequest) {
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

		const { searchParams } = new URL(request.url);
		const email = searchParams.get("email");

		if (!email) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Email address is required",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		await dbConnect();

		// Get user first to check if they have multiple emails
		const user = await Users_Model.findOne({
			UserID: decoded.userID,
		}).select("Emails");

		if (!user || user.Emails.length <= 1) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Cannot remove the only email address",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		// Check if trying to remove primary email
		const emailToRemove = user.Emails.find((e) => e.Email === email);
		if (emailToRemove?.isPrimary) {
			return NextResponse.json(
				{
					Status: 0,
					Message:
						"Cannot remove primary email. Set another email as primary first.",
					StatusCode: 400,
				},
				{ status: 400 }
			);
		}

		// Remove the email
		const result = await Users_Model.updateOne(
			{ UserID: decoded.userID },
			{
				$pull: { Emails: { Email: email } },
				updatedAt: new Date(),
			}
		);

		if (result.matchedCount === 0) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Email not found",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		log(`User ${decoded.userID} removed email: ${email}`);

		return NextResponse.json({
			Status: 1,
			Message: "Email removed successfully",
			StatusCode: 200,
		});
	} catch (error: any) {
		log(`Remove email error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to remove email",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}
