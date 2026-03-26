import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Agreement, AgreementStatus } from "@/Models/Agreements";
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

// GET /api/agreements/[id] - Get single agreement by ID or Slug
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;

        // Check if user is admin
        const isAdminUser = await isAdmin(request);

        // Build query - search by both AgreementID and Slug
        const query: any = {
            $or: [{ AgreementID: id }, { Slug: id }],
            isDeleted: false
        };

        // Non-admin users can only see published agreements
        if (!isAdminUser) {
            query.Status = AgreementStatus.Published;
        }

        const agreement = await Agreement.findOne(query).select("-__v");

        if (!agreement) {
            return NextResponse.json(
                { success: false, error: "Agreement not found" },
                { status: 404 }
            );
        }

        // Get related products if any
        let products = [];
        if (agreement.ProductIDs && agreement.ProductIDs.length > 0) {
            products = await Product.find({
                ProductID: { $in: agreement.ProductIDs },
                isDeleted: false
            }).select("ProductID Name Slug Icon Status");
        }

        return NextResponse.json({
            success: true,
            data: {
                ...agreement.toObject(),
                products
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch agreement",
                message: error.message
            },
            { status: 500 }
        );
    }
}

// PUT /api/agreements/[id] - Update agreement (Admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check admin authorization
        if (!(await isAdmin(request))) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const { Title, Slug, Content, Version, ProductIDs, Status, EffectiveDate, Metadata } = body;

        // Find agreement
        const agreement = await Agreement.findOne({
            $or: [{ AgreementID: id }, { Slug: id }],
            isDeleted: false
        });

        if (!agreement) {
            return NextResponse.json(
                { success: false, error: "Agreement not found" },
                { status: 404 }
            );
        }

        // Check if slug is being changed and if it's unique
        if (Slug && Slug !== agreement.Slug) {
            const existingAgreement = await Agreement.findOne({
                Slug: Slug.toLowerCase(),
                isDeleted: false,
                AgreementID: { $ne: agreement.AgreementID }
            });

            if (existingAgreement) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Agreement with this slug already exists"
                    },
                    { status: 409 }
                );
            }
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

        // Update fields
        if (Title) agreement.Title = Title;
        if (Slug) agreement.Slug = Slug.toLowerCase();
        if (Content) agreement.Content = Content;
        if (Version) agreement.Version = Version;
        if (ProductIDs) agreement.ProductIDs = ProductIDs;
        if (Status) {
            agreement.Status = Status;
            // Set publish date if status changed to published
            if (Status === AgreementStatus.Published && !agreement.PublishDate) {
                agreement.PublishDate = new Date();
            }
        }
        if (EffectiveDate) agreement.EffectiveDate = new Date(EffectiveDate);
        if (Metadata) agreement.Metadata = { ...agreement.Metadata, ...Metadata };
        agreement.LastModifiedBy = userID;

        await agreement.save();

        return NextResponse.json({
            success: true,
            message: "Agreement updated successfully",
            data: agreement
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update agreement",
                message: error.message
            },
            { status: 500 }
        );
    }
}

// DELETE /api/agreements/[id] - Soft delete agreement (Admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check admin authorization
        if (!(await isAdmin(request))) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        await dbConnect();

        const { id } = await params;

        // Find and soft delete agreement
        const agreement = await Agreement.findOne({
            $or: [{ AgreementID: id }, { Slug: id }],
            isDeleted: false
        });

        if (!agreement) {
            return NextResponse.json(
                { success: false, error: "Agreement not found" },
                { status: 404 }
            );
        }

        agreement.isDeleted = true;
        await agreement.save();

        return NextResponse.json({
            success: true,
            message: "Agreement deleted successfully"
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete agreement",
                message: error.message
            },
            { status: 500 }
        );
    }
}
