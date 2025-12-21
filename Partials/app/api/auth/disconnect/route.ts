import { NextRequest, NextResponse } from "next/server";
import { Users_Model as EnhancedUsers_Model } from "../../../../Models/EnhancedUsers";
import { getSession } from "../../../../Lib/auth";
import { dbConnect } from "../../../../Utils/dbConnect";

export async function POST(req: NextRequest) {
    try {
        const session = await getSession(req.headers);

        if (!session?.user?.email) {
            return NextResponse.json({
                Status: 0,
                Message: "Authentication required",
                StatusCode: "AUTHENTICATION_REQUIRED"
            }, { status: 401 });
        }

        const { provider } = await req.json();

        if (!provider) {
            return NextResponse.json({
                Status: 0,
                Message: "Provider is required",
                StatusCode: "MISSING_PROVIDER"
            }, { status: 400 });
        }

        await dbConnect();
                // Find user by email
        const user = await EnhancedUsers_Model.findOne({
            email: session.user.email
        });

        if (!user) {
            return NextResponse.json({
                Status: 0,
                Message: "User not found",
                StatusCode: "USER_NOT_FOUND"
            }, { status: 404 });
        }

        // Check if user has this provider connected
        const connectedAccount = user.connectedAccounts?.find(
            (account: any) => account.provider === provider
        );

        if (!connectedAccount) {
            return NextResponse.json({
                Status: 0,
                Message: "Provider not connected",
                StatusCode: "PROVIDER_NOT_CONNECTED"
            }, { status: 400 });
        }

        // Check if user has a password or other providers (can't disconnect the only auth method)
        const hasPassword = !!user.password;
        const otherProviders = user.connectedAccounts?.filter(
            (account: any) => account.provider !== provider && account.isActive
        ) || [];

        if (!hasPassword && otherProviders.length === 0) {
            return NextResponse.json({
                Status: 0,
                Message: "Cannot disconnect the only authentication method. Please set a password first.",
                StatusCode: "LAST_AUTH_METHOD"
            }, { status: 400 });
        }

        // Remove the provider
        await EnhancedUsers_Model.updateOne(
            { email: session.user.email },
            {
                $pull: {
                    connectedAccounts: { provider: provider }
                }
            }
        );

        return NextResponse.json({
            Status: 1,
            Message: "Provider disconnected successfully",
            Data: {
                provider: provider,
                disconnectedAt: new Date()
            }
        });

    } catch (error: any) {
        console.error("Disconnect provider error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            StatusCode: "INTERNAL_ERROR"
        }, { status: 500 });
    }
}

