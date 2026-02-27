/**
 * GET  /api/shop/products        → public product listing
 * POST /api/shop/products        → create product (admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { ShopProduct } from "@Models/ShopProduct";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const q = req.nextUrl.searchParams;
        const category = q.get("category") || "";
        const type = q.get("type") || "";
        const search = q.get("search") || "";
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(50, parseInt(q.get("limit") || "20"));

        const h = await headers();
        const user = await getResolvedUser(h);
        const isStaff = user?.isAdmin || user?.isEmployee;

        const query: any = { isDeleted: false };
        if (!isStaff) query.status = "active";
        if (category) query.category = category;
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } },
            ];
        }

        const total = await ShopProduct.countDocuments(query);
        const products = await ShopProduct.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: products,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const product = await ShopProduct.create({ ...body, createdBy: user.email });
        return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
