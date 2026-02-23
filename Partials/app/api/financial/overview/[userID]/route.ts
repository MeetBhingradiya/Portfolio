import { NextRequest, NextResponse } from "next/server";
import { FinancialController } from "../../../../../Controllers/Financial";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userID: string }> }
) {
    try {
        const { userID } = await params;
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') as 'month' | 'quarter' | 'year' || 'month';

        if (!userID) {
            return NextResponse.json(
                { error: "userID is required" },
                { status: 400 }
            );
        }

        const overview = await FinancialController.getFinancialOverview(userID, period);

        return NextResponse.json({
            success: true,
            data: overview
        });

    } catch (error) {
        console.error("Error fetching financial overview:", error);
        return NextResponse.json(
            { error: "Failed to fetch financial overview" },
            { status: 500 }
        );
    }
}
