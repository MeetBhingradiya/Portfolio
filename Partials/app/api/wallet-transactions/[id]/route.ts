import { NextRequest, NextResponse } from "next/server";
import { WalletController } from "../../../../Controllers/Wallet";
import { connectToDatabase } from "../../../../Lib/MongoDB";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        
        const { id } = await params;
        const body = await request.json();
        const { userID, type, amount, description, category } = body;
        
        if (!userID || !type || !amount || !description) {
            return NextResponse.json({
                Status: 0,
                Message: "User ID, type, amount, and description are required"
            }, { status: 400 });
        }

        const result = await WalletController.updateWalletTransaction(id, {
            userID,
            type,
            amount,
            description,
            category
        });
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("PUT /api/wallet-transactions/[id] error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userID = searchParams.get('userID');
        
        if (!userID) {
            return NextResponse.json({
                Status: 0,
                Message: "User ID is required"
            }, { status: 400 });
        }

        const result = await WalletController.deleteWalletTransaction(id, userID);
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("DELETE /api/wallet-transactions/[id] error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}
