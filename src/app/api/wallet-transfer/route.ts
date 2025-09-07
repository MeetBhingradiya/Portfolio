import { NextRequest, NextResponse } from "next/server";
import { WalletController } from "@Controllers/Wallet";
import { connectToDatabase } from "@Lib/MongoDB";

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const body = await request.json();
        const { userID, fromWalletID, toWalletID, amount, title, description } = body;
        
        if (!userID || !fromWalletID || !toWalletID || !amount || !title) {
            return NextResponse.json({
                Status: 0,
                Message: "Required fields: userID, fromWalletID, toWalletID, amount, title"
            }, { status: 400 });
        }

        if (fromWalletID === toWalletID) {
            return NextResponse.json({
                Status: 0,
                Message: "Source and destination wallets cannot be the same"
            }, { status: 400 });
        }

        const result = await WalletController.transferBetweenWallets({
            userID,
            fromWalletID,
            toWalletID,
            amount,
            title,
            description
        });
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 201 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("POST /api/wallet-transfer error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}
