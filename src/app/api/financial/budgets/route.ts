import { NextRequest, NextResponse } from "next/server";
import { FinancialController } from "@Controllers/Financial";
import { BudgetPeriod, ExpenseCategory } from "@Models/index";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            userID, 
            name, 
            totalAmount, 
            period, 
            startDate, 
            endDate, 
            categories, 
            description 
        } = body;

        // Validate required fields
        if (!userID || !name || !totalAmount || !period || !startDate || !endDate) {
            return NextResponse.json(
                { error: "Missing required fields: userID, name, totalAmount, period, startDate, endDate" },
                { status: 400 }
            );
        }

        // Validate amount
        if (typeof totalAmount !== 'number' || totalAmount <= 0) {
            return NextResponse.json(
                { error: "Total amount must be a positive number" },
                { status: 400 }
            );
        }

        // Validate period
        if (!Object.values(BudgetPeriod).includes(period)) {
            return NextResponse.json(
                { error: "Invalid budget period" },
                { status: 400 }
            );
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            return NextResponse.json(
                { error: "End date must be after start date" },
                { status: 400 }
            );
        }

        const budget = await FinancialController.createBudget({
            userID,
            name,
            totalAmount,
            period,
            startDate: start,
            endDate: end,
            categories,
            description
        });

        return NextResponse.json({
            success: true,
            message: "Budget created successfully",
            data: budget
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating budget:", error);
        return NextResponse.json(
            { error: "Failed to create budget" },
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

        // For now, we'll just get the basic budget info
        // You can extend this to include filters, pagination, etc.
        const [activeBudgets, budgetSummary] = await Promise.all([
            (await import("@Models/index")).Budgets_Model.getActiveBudgets(userID),
            (await import("@Models/index")).Budgets_Model.getBudgetSummary(userID)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                activeBudgets,
                summary: budgetSummary
            }
        });

    } catch (error) {
        console.error("Error fetching budgets:", error);
        return NextResponse.json(
            { error: "Failed to fetch budgets" },
            { status: 500 }
        );
    }
}
