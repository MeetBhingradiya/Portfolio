import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "../../../../Utils/dbConnect";
import { Tickets_Model } from "../../../../Models/Tickets";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";
import { Sessions_Model } from "../../../../Models/Sessions";

async function getUserFromSession(sessionID: string) {
    if (!sessionID) return null;

    const session = await Sessions_Model.findOne({ SessionID: sessionID });
    if (!session) return null;

    const user = await EnhancedUsers_Model.findOne({
        UserID: session.UserID,
        isDeleted: false,
        isLocked: false,
        isSuspended: false
    });

    return user;
}

// Get user's tickets
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Get session from authorization header or cookie
        const authHeader = request.headers.get("authorization");
        const sessionID =
            authHeader?.replace("Bearer ", "") ||
            request.cookies.get("sessionID")?.value ||
            request.nextUrl.searchParams.get("sessionID");

        if (!sessionID) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get user from session
        const user = await getUserFromSession(sessionID);
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Invalid session" },
                { status: 401 }
            );
        }

        // Get user's email
        const primaryEmail = user.email;
        if (!primaryEmail) {
            return NextResponse.json(
                { success: false, error: "User email not found" },
                { status: 400 }
            );
        }

        // Find tickets that belong to this user (either by userID or email)
        const tickets = await Tickets_Model.find({
            $or: [
                { userID: user.UserID },
                { email: primaryEmail.toLowerCase() }
            ]
        }).sort({ createdAt: -1 });

        // Return safe ticket data
        const safeTickets = tickets.map((ticket) => ({
            id: ticket.id,
            subject: ticket.subject,
            message: ticket.message,
            projectType: ticket.projectType,
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            responses: ticket.responses.map((response: any) => ({
                id: response.id,
                message: response.message,
                isAdmin: response.isAdmin,
                createdAt: response.createdAt
            }))
        }));

        return NextResponse.json({
            success: true,
            tickets: safeTickets
        });
    } catch (error) {
        console.error("Get user tickets error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to retrieve tickets"
            },
            { status: 500 }
        );
    }
}

