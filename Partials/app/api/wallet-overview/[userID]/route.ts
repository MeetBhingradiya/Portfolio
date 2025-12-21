import { NextRequest, NextResponse } from "next/server";
import { WalletController } from "../../../../Controllers/Wallet";
import { connectToDatabase } from "../../../../Lib/MongoDB";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userID: string }> }
) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') as "month" | "quarter" | "year" || "month";
        
        const { userID } = await params;
        
        if (!userID) {
            return NextResponse.json({
                Status: 0,
                Message: "User ID is required"
            }, { status: 400 });
        }

        const result = await WalletController.getWalletOverview(userID);
        
        if (result.Status === 1) {
            return NextResponse.json(result.Data, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("GET /api/wallet-overview error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}
