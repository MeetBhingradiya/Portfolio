import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../Lib/auth";
import { dbConnect } from "../../../../Utils/dbConnect";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession(request.headers);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Authentication required",
                    StatusCode: 401
                },
                { status: 401 }
            );
        }

        await dbConnect();

        // Promote current user to admin
        const user = session.user as any;
        const updatedUser = await EnhancedUsers_Model.findOneAndUpdate(
            { email: session.user.email.toLowerCase() },
            { 
                role: "admin",
                $setOnInsert: {
                    profile: {
                        displayName: session.user.name || session.user.email.split('@')[0],
                        firstName: user.firstName || '',
                        lastName: user.lastName || ''
                    }
                }
            },
            { 
                new: true, 
                upsert: false,
                runValidators: true 
            }
        );

        if (!updatedUser) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "User not found in database",
                    StatusCode: 404
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            Status: 1,
            Message: "User promoted to admin successfully",
            Data: {
                email: updatedUser.email,
                role: updatedUser.role,
                isAdmin: updatedUser.role === 'admin'
            },
            StatusCode: 200
        });

    } catch (error) {
        console.error("Quick promote error:", error);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Failed to promote user to admin",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

