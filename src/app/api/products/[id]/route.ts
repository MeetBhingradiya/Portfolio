import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Product } from "@/Models/Products";
import { Agreement } from "@/Models/Agreements";
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

// GET /api/products/[id] - Get single product by ID or Slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();

        const { id } = await params;

        // Find product by ProductID or Slug
        const product = await Product.findOne({
            $or: [{ ProductID: id }, { Slug: id }],
            isDeleted: false
        }).select("-__v");

        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        // Get related agreements
        const agreements = await Agreement.find({
            ProductIDs: product.ProductID,
            isDeleted: false,
            Status: "published"
        }).select("AgreementID Type Title Slug Version EffectiveDate");

        return NextResponse.json({
            success: true,
            data: {
                ...product.toObject(),
                agreements
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch product",
                message: error.message
            },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product (Admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Check admin authorization
        if (!(await isAdmin(request))) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized. Admin access required."
                },
                { status: 403 }
            );
        }

        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const { Name, Slug, Description, Version, Category, Status, Icon, URL, Metadata } = body;

        // Find product
        const product = await Product.findOne({
            $or: [{ ProductID: id }, { Slug: id }],
            isDeleted: false
        });

        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        // Check if slug is being changed and if it's unique
        if (Slug && Slug !== product.Slug) {
            const existingProduct = await Product.findOne({
                Slug: Slug.toLowerCase(),
                isDeleted: false,
                ProductID: { $ne: product.ProductID }
            });

            if (existingProduct) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "Product with this slug already exists"
                    },
                    { status: 409 }
                );
            }
        }

        // Update fields
        if (Name) product.Name = Name;
        if (Slug) product.Slug = Slug.toLowerCase();
        if (Description !== undefined) product.Description = Description;
        if (Version) product.Version = Version;
        if (Category !== undefined) product.Category = Category;
        if (Status) product.Status = Status;
        if (Icon !== undefined) product.Icon = Icon;
        if (URL !== undefined) product.URL = URL;
        if (Metadata) product.Metadata = { ...product.Metadata, ...Metadata };

        await product.save();

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update product",
                message: error.message
            },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Soft delete product (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Check admin authorization
        if (!(await isAdmin(request))) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized. Admin access required."
                },
                { status: 403 }
            );
        }

        await dbConnect();

        const { id } = await params;

        // Find and soft delete product
        const product = await Product.findOne({
            $or: [{ ProductID: id }, { Slug: id }],
            isDeleted: false
        });

        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
        }

        product.isDeleted = true;
        await product.save();

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete product",
                message: error.message
            },
            { status: 500 }
        );
    }
}
