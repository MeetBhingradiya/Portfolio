import { NextRequest, NextResponse } from "next/server";
import { FinancialController } from "../../../../../Controllers/Financial";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userID: string }> }
) {
    try {
        const resolvedParams = await params;
        const userID = resolvedParams.userID;
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') as 'month' | 'quarter' | 'year' || 'month';

        if (!userID) {
            return NextResponse.json(
                { error: "userID is required" },
                { status: 400 }
            );
        }

        const dashboard = await FinancialController.getFinancialDashboard(userID);

        return NextResponse.json({
            success: true,
            data: dashboard
        });

    } catch (error) {
        console.error("Error fetching financial dashboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch financial dashboard" },
            { status: 500 }
        );
    }
}
