import { NextRequest, NextResponse } from "next/server";
import { FinancialController } from "@Controllers/Financial";
import { ExpenseCategory, PaymentMethod } from "@Models/index";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userID, title, amount, category, paymentMethod, description, date, tags, walletID, location, vendor, isRecurring, recurrence } = body;

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
        if (!Object.values(ExpenseCategory).includes(category)) {
            return NextResponse.json(
                { error: "Invalid expense category" },
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

        const expense = await FinancialController.createExpense({
            userID,
            title,
            amount,
            category,
            paymentMethod,
            description,
            date: date ? new Date(date) : undefined,
            tags,
            walletID,
            location,
            vendor,
            isRecurring,
            recurrence
        });

        return NextResponse.json({
            success: true,
            message: "Expense created successfully",
            data: expense
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            { error: "Failed to create expense" },
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

        // Parse filters
        const filters: any = {};
        
        if (searchParams.get('category')) {
            filters.category = searchParams.get('category');
        }
        
        if (searchParams.get('paymentMethod')) {
            filters.paymentMethod = searchParams.get('paymentMethod');
        }
        
        if (searchParams.get('startDate')) {
            filters.startDate = new Date(searchParams.get('startDate')!);
        }
        
        if (searchParams.get('endDate')) {
            filters.endDate = new Date(searchParams.get('endDate')!);
        }
        
        if (searchParams.get('minAmount')) {
            filters.minAmount = parseFloat(searchParams.get('minAmount')!);
        }
        
        if (searchParams.get('maxAmount')) {
            filters.maxAmount = parseFloat(searchParams.get('maxAmount')!);
        }
        
        if (searchParams.get('tags')) {
            filters.tags = searchParams.get('tags')!.split(',');
        }
        
        if (searchParams.get('page')) {
            filters.page = parseInt(searchParams.get('page')!);
        }
        
        if (searchParams.get('limit')) {
            filters.limit = parseInt(searchParams.get('limit')!);
        }

        const result = await FinancialController.getExpenses(userID, filters);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json(
            { error: "Failed to fetch expenses" },
            { status: 500 }
        );
    }
}
