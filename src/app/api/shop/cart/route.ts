/**
 * GET   /api/shop/cart        → get user's cart
 * POST  /api/shop/cart        → add item to cart
 * PATCH /api/shop/cart        → update item quantity
 * DELETE /api/shop/cart       → remove item or clear cart
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { Cart } from "@Models/Cart";
import { ShopProduct } from "@Models/ShopProduct";
import { getResolvedUser } from "@Utils/RolePermissions";

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const cart = await Cart.findOne({ userId: user.userId }).lean();
        return NextResponse.json({ success: true, data: cart ?? { userId: user.userId, items: [] } });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { productId, variantId, quantity = 1 } = body;

        // Validate product & variant
        const product = await ShopProduct.findOne({ productId, isDeleted: false, status: "active" });
        if (!product) return NextResponse.json({ success: false, error: "Product not found or unavailable" }, { status: 404 });

        const variant = product.variants.find((v: any) => v.variantId === variantId);
        if (!variant || !variant.isActive) {
            return NextResponse.json({ success: false, error: "Variant not found or inactive" }, { status: 404 });
        }

        let cart = await Cart.findOne({ userId: user.userId });
        if (!cart) {
            cart = new Cart({ userId: user.userId, items: [] });
        }

        // Check if same product+variant already in cart
        const existing = cart.items.find(
            (i: any) => i.productId === productId && i.variantId === variantId
        );

        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, 99);
            existing.price = variant.price; // refresh price snapshot
        } else {
            cart.items.push({
                productId,
                productName: product.name,
                thumbnail: product.thumbnail,
                variantId,
                variantName: variant.name,
                productType: product.type,
                price: variant.price,
                currency: variant.currency,
                billingCycle: variant.billingCycle,
                quantity,
                addedAt: new Date(),
            });
        }

        await cart.save();
        return NextResponse.json({ success: true, data: cart });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { productId, variantId, quantity } = body;

        const cart = await Cart.findOne({ userId: user.userId });
        if (!cart) return NextResponse.json({ success: false, error: "Cart not found" }, { status: 404 });

        const item = cart.items.find(
            (i: any) => i.productId === productId && i.variantId === variantId
        );
        if (!item) return NextResponse.json({ success: false, error: "Item not in cart" }, { status: 404 });

        if (quantity <= 0) {
            cart.items = cart.items.filter(
                (i: any) => !(i.productId === productId && i.variantId === variantId)
            );
        } else {
            item.quantity = Math.min(quantity, 99);
        }

        await cart.save();
        return NextResponse.json({ success: true, data: cart });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json().catch(() => ({}));
        const { productId, variantId, clearAll } = body;

        const cart = await Cart.findOne({ userId: user.userId });
        if (!cart) return NextResponse.json({ success: true, data: null });

        if (clearAll) {
            cart.items = [];
        } else {
            cart.items = cart.items.filter(
                (i: any) => !(i.productId === productId && i.variantId === variantId)
            );
        }

        await cart.save();
        return NextResponse.json({ success: true, data: cart });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
