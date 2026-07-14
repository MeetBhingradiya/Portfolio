import { NextRequest, NextResponse } from "next/server";
import { EAAccess } from "@/Models/EAAccess";
import { ShopProduct } from "@/Models/ShopProduct";
import dbConnect from "@/Utils/dbConnect";
import { permissionError, requirePermission } from "@Library/adminApiMiddleware";

export async function GET(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "shop.order.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const p = req.nextUrl.searchParams;
        const userId = p.get("userId");
        const productId = p.get("productId");
        const status = p.get("status");

        const query: any = {};
        if (userId) query.userId = userId;
        if (productId) query.productId = productId;
        if (status) query.status = status;

        const accessList = await EAAccess.find(query).sort({ createdAt: -1 }).lean();

        return NextResponse.json({
            success: true,
            data: accessList
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "shop.order.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const body = await req.json();
        
        // Allow looking up product by slug or productId
        const product = await ShopProduct.findOne({
            $or: [{ productId: body.productId }, { slug: body.productId }]
        });
        
        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found by slug or ID." }, { status: 404 });
        }

        // We could optionally lookup the User by email here if the admin typed an email
        // For simplicity and since we only validate via mtId for runtime now, we just save what the admin gave.
        // However, the download route needs `userId` to match the web session's `user.id` or `user.email`.
        // Let's resolve the user from the DB using a mongoose model if needed. 
        // We will assume `body.userId` might be an email, so we let the download route check `session.user.email` or `session.user.id`.
        // But the best is to just save the exact IDs the admin typed.
        
        // Overwrite the body payload with resolved product ID
        const finalPayload = {
            ...body,
            productId: product.productId // Convert slug to actual productId
        };

        const newAccess = new EAAccess(finalPayload);
        await newAccess.save();

        return NextResponse.json({ success: true, data: newAccess });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "shop.order.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const body = await req.json();
        const id = req.nextUrl.searchParams.get("id") || body._id || body.id;

        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        const updated = await EAAccess.findByIdAndUpdate(id, body, { new: true });
        if (!updated) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const auth = await requirePermission(req, "shop.order.manage");
        if (auth.error) return permissionError(auth.status ?? 403, auth.message ?? "Forbidden");
        await dbConnect();

        const id = req.nextUrl.searchParams.get("id");
        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        await EAAccess.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
