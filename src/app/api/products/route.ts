import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Product } from "@/Models/Products";

// GET /api/products - Get all products with filtering
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const category = searchParams.get("category");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = parseInt(searchParams.get("skip") || "0");

        // Build query
        const query: any = {
            isDeleted: false
        };

        if (status) {
            query.Status = status;
        }

        if (category) {
            query.Category = category;
        }

        // Fetch products
        const products = await Product.find(query).select("-__v").limit(limit).skip(skip).sort({ CreateDate: -1 });

        const total = await Product.countDocuments(query);

        return NextResponse.json({
            success: true,
            data: products,
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + products.length < total
            }
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch products",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
