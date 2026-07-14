/**
 * GET   /api/shop/products/[id]   → single product (by productId or slug)
 * PATCH /api/shop/products/[id]   → update (admin)
 * DELETE /api/shop/products/[id]  → soft delete (admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { ShopProduct } from "@Models/ShopProduct";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const product = await ShopProduct.findOne({
            $or: [{ productId: id }, { slug: id }],
            isDeleted: false
        }).lean();
        if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: product });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { id } = await params;
        const body = await req.json();
        const product = await ShopProduct.findOneAndUpdate(
            { $or: [{ productId: id }, { slug: id }] },
            { ...body },
            { new: true }
        );
        return NextResponse.json({ success: true, data: product });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const { id } = await params;
        await ShopProduct.findOneAndUpdate(
            { $or: [{ productId: id }, { slug: id }] },
            { isDeleted: true, status: "archived" }
        );
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
