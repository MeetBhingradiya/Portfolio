import { NextRequest, NextResponse } from "next/server";
import { WalletController } from "@Controllers/Wallet";
import { connectToDatabase } from "@Lib/MongoDB";

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        
        const { searchParams } = new URL(request.url);
        const userID = searchParams.get('userID');
        const walletID = searchParams.get('walletID');
        const financialType = searchParams.get('financialType');
        const category = searchParams.get('category');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        if (!userID) {
            return NextResponse.json({
                Status: 0,
                Message: "User ID is required"
            }, { status: 400 });
        }

        // If walletID is specified, use the specific wallet transactions method
        if (walletID) {
            const result = await WalletController.getWalletTransactionsByWallet(walletID, userID);
            return NextResponse.json(result, { status: result.Status === 1 ? 200 : 400 });
        }

        const filters = {
            walletID: walletID || undefined,
            financialType: financialType || undefined,
            category: category || undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page,
            limit
        };

        const result = await WalletController.getWalletTransactions(userID, filters);
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("GET /api/wallet-transactions error:", error);
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
        const {
            userID,
            fromWalletID,
            toWalletID,
            amount,
            title,
            description,
            financialType,
            category,
            paymentMethod,
            vendor,
            location,
            source,
            tax,
            tags,
            isRecurring,
            budgetID
        } = body;
        
        // Debug logging
        console.log('POST /api/wallet-transactions received:', {
            userID,
            fromWalletID,
            amount,
            title,
            financialType,
            paymentMethod
        });
        
        if (!userID || !fromWalletID || amount === undefined || amount === null || !title || !financialType || !paymentMethod) {
            console.log('Validation failed - missing fields:', {
                userID: !!userID,
                fromWalletID: !!fromWalletID,
                amount: !!amount,
                title: !!title,
                financialType: !!financialType,
                paymentMethod: !!paymentMethod
            });
            return NextResponse.json({
                Status: 0,
                Message: "Required fields: userID, fromWalletID, amount, title, financialType, paymentMethod"
            }, { status: 400 });
        }

        const result = await WalletController.addTransaction({
            userID,
            fromWalletID,
            toWalletID,
            amount,
            title,
            description,
            financialType,
            category,
            paymentMethod,
            vendor,
            location,
            source,
            tax,
            tags,
            isRecurring,
            budgetID
        });
        
        if (result.Status === 1) {
            return NextResponse.json(result, { status: 201 });
        } else {
            return NextResponse.json(result, { status: 400 });
        }
    } catch (error) {
        console.error("POST /api/wallet-transactions error:", error);
        return NextResponse.json({
            Status: 0,
            Message: "Internal server error",
            Error: error
        }, { status: 500 });
    }
}
