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
        const { userID, name, type, currency, isActive } = body;
        
        if (!userID || !name || !type) {
            return NextResponse.json({
                Status: 0,
                Message: "User ID, name, and type are required"
            }, { status: 400 });
        }

        const result = await WalletController.updateWallet(id, {
            userID,
            name,
            type,
            currency,
            isActive
        });
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("PUT /api/wallets/[id] error:", error);
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

        const result = await WalletController.deleteWallet(id, userID);
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("DELETE /api/wallets/[id] error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}
