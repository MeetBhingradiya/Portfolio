import { NextRequest, NextResponse } from "next/server";
import { WalletController } from "../../../Controllers/Wallet";
import { connectToDatabase } from "../../../Lib/MongoDB";

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const userID = searchParams.get('userID');
        
        if (!userID) {
            return NextResponse.json({
                Status: 0,
                Message: "User ID is required"
            }, { status: 400 });
        }

        const result = await WalletController.getUserWallets(userID);
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("GET /api/wallets error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const body = await request.json();
        const { userID, name, type, currency, description, initialBalance, minimumBalance, linkedWalletID } = body;
        
        if (!userID || !name || !type) {
            return NextResponse.json({
                Status: 0,
                Message: "User ID, name, and type are required"
            }, { status: 400 });
        }

        // Validate UPI wallet requirements
        if (type === 'UPI' && !linkedWalletID) {
            return NextResponse.json({
                Status: 0,
                Message: "UPI wallets must be linked to a bank account or wallet"
            }, { status: 400 });
        }

        const result = await WalletController.createWallet({
            userID,
            name,
            type,
            currency,
            description,
            initialBalance,
            minimumBalance,
            linkedWalletID
        });
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 201 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("POST /api/wallets error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}
