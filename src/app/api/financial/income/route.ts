import { NextRequest, NextResponse } from "next/server";
import { FinancialController } from "@Controllers/Financial";
import { IncomeCategory, PaymentMethod } from "@Models/index";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            userID, 
            title, 
            amount, 
            category, 
            paymentMethod, 
            description, 
            date, 
            source, 
            projectDetails, 
            invoiceNumber, 
            taxDetails, 
            status 
        } = body;

        // Validate required fields
        if (!userID || !title || !amount || !category || !paymentMethod) {
            return NextResponse.json(
                { error: "Missing required fields: userID, title, amount, category, paymentMethod" },
                { status: 400 }
            );
        }

        // Validate amount
        if (typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: "Amount must be a positive number" },
                { status: 400 }
            );
        }

        // Validate category
        if (!Object.values(IncomeCategory).includes(category)) {
            return NextResponse.json(
                { error: "Invalid income category" },
                { status: 400 }
            );
        }

        // Validate payment method
        if (!Object.values(PaymentMethod).includes(paymentMethod)) {
            return NextResponse.json(
                { error: "Invalid payment method" },
                { status: 400 }
            );
        }

        const income = await FinancialController.createIncome({
            userID,
            title,
            amount,
            category,
            paymentMethod,
            description,
            date: date ? new Date(date) : undefined,
            source,
            projectDetails,
            invoiceNumber,
            taxDetails,
            status
        });

        return NextResponse.json({
            success: true,
            message: "Income created successfully",
            data: income
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating income:", error);
        return NextResponse.json(
            { error: "Failed to create income" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userID = searchParams.get('userID');
        
        if (!userID) {
            return NextResponse.json(
                { error: "userID is required" },
                { status: 400 }
            );
        }

        const period = searchParams.get('period') as 'month' | 'quarter' | 'year' || 'month';
        const analytics = await FinancialController.getIncomeAnalytics(userID, period);

        return NextResponse.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error("Error fetching income:", error);
        return NextResponse.json(
            { error: "Failed to fetch income" },
            { status: 500 }
        );
    }
}
