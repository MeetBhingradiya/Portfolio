import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Agreement, IAgreement, AgreementType, AgreementStatus } from "@/Models/Agreements";
import { Product } from "@/Models/Products";
import { auth } from "@Library/auth";

// Helper function to check admin authorization
async function isAdmin(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        // Type assertion for custom user properties
        return (session?.user as any)?.role === "admin";
    } catch (error) {
        return false;
    }
}

// GET /api/agreements - List agreements with pagination and filtering
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const type = searchParams.get("type") as AgreementType;
        const status = searchParams.get("status") as AgreementStatus;
        const slug = searchParams.get("slug");
        const productID = searchParams.get("productID");

        // Build query
        const query: any = { isDeleted: false };

        // Check if user is admin
        const isAdminUser = await isAdmin(request);

        // Non-admin users can only see published agreements
        if (!isAdminUser) {
            query.Status = AgreementStatus.Published;
        } else {
            // Admin can filter by status
            if (status) query.Status = status;
        }

        if (type) query.Type = type;
        if (slug) query.Slug = slug;
        if (productID) query.ProductIDs = productID;

        // Get total count
        const total = await Agreement.countDocuments(query);

        // Get agreements with pagination
        const agreements = await Agreement.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("-__v");

        return NextResponse.json({
            success: true,
            data: agreements,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch agreements",
                message: error.message
            },
            { status: 500 }
        );
    }
}

// POST /api/agreements - Create new agreement (Admin only)
export async function POST(request: NextRequest) {
    try {
        // Check admin authorization
        if (!(await isAdmin(request))) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        await dbConnect();

        const body = await request.json();
        const { Type, Title, Slug, Content, Version, ProductIDs, Status, EffectiveDate, Metadata } = body;

        // Validate required fields
        if (!Type || !Title || !Slug || !Content) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: Type, Title, Slug, Content"
                },
                { status: 400 }
            );
        }

        // Validate agreement type
        if (!Object.values(AgreementType).includes(Type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid agreement type"
                },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingAgreement = await Agreement.findOne({ Slug, isDeleted: false });
        if (existingAgreement) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Agreement with this slug already exists"
                },
                { status: 409 }
            );
        }

        // Validate product IDs if provided
        if (ProductIDs && ProductIDs.length > 0) {
            const products = await Product.find({
                ProductID: { $in: ProductIDs },
                isDeleted: false
            });

            if (products.length !== ProductIDs.length) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Some product IDs are invalid"
                    },
                    { status: 400 }
                );
            }
        }

        // Get user session for LastModifiedBy
        const session = await auth.api.getSession({ headers: request.headers });
        const userID = session?.user?.id;

        // Create agreement
        const newAgreement = new Agreement({
            Type,
            Title,
            Slug: Slug.toLowerCase(),
            Content,
            Version: Version || "1.0.0",
            ProductIDs: ProductIDs || [],
            Status: Status || AgreementStatus.Draft,
            EffectiveDate: EffectiveDate ? new Date(EffectiveDate) : undefined,
            PublishDate: Status === AgreementStatus.Published ? new Date() : undefined,
            LastModifiedBy: userID,
            Metadata: Metadata || {}
        });

        await newAgreement.save();

        return NextResponse.json(
            {
                success: true,
                message: "Agreement created successfully",
                data: newAgreement
            },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to create agreement",
                message: error.message
            },
            { status: 500 }
        );
    }
}
