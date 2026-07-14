/**
 * GET  /api/shop/orders        → get user's orders (or all for those with shop.orders.view permission)
 * POST /api/shop/orders        → place an order (authenticated)
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@Utils/dbConnect";
import { Order, OrderCounter } from "@Models/Order";
import { Cart } from "@Models/Cart";
import { ShopProduct } from "@Models/ShopProduct";
import { UserRole } from "@Models/UserRole";
import { getResolvedUser, hasPermission } from "@Utils/RolePermissions";
import { getSession } from "@Library/auth";

async function nextOrderNumber(): Promise<number> {
    const counter = await OrderCounter.findByIdAndUpdate("order", { $inc: { seq: 1 } }, { new: true, upsert: true });
    return counter.seq;
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const q = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(50, parseInt(q.get("limit") || "20"));
        const status = q.get("status") || "";
        const viewAll = q.get("all") === "true";

        const query: any = { isDeleted: false };
        
        // Check if user can view all orders
        const canViewAll = await hasPermission(req.headers, "shop.orders.view");
        
        // If viewAll requested and user doesn't have permission, fallback to own orders
        if (viewAll && !canViewAll && !user.isEmployee) {
            query.userId = user.userId;
        } else if (!viewAll && !canViewAll) {
            // Default: show own orders
            query.userId = user.userId;
        } else if ((viewAll || canViewAll) && canViewAll) {
            // User can view all - no userId filter
        } else if (user.isEmployee && (viewAll || !canViewAll)) {
            // Legacy: employees can view all
            // No filter applied
        } else {
            // Safety: default to own orders
            query.userId = user.userId;
        }
        
        if (status) query.status = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: orders,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
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
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { shippingAddress, paymentMethod, customerNote, useCart, items: manualItems } = body;

        // Resolve items from cart or manual payload
        let orderItems: any[] = [];
        let subtotal = 0;

        if (useCart) {
            const cart = await Cart.findOne({ userId: user.userId });
            if (!cart || cart.items.length === 0) {
                return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
            }

            for (const ci of cart.items) {
                const product = await ShopProduct.findOne({
                    productId: ci.productId,
                    isDeleted: false
                });
                if (!product) continue;
                const variant = product.variants.find((v: any) => v.variantId === ci.variantId);
                if (!variant) continue;

                const lineTotal = variant.price * ci.quantity;
                subtotal += lineTotal;
                orderItems.push({
                    productId: ci.productId,
                    productName: product.name,
                    variantId: ci.variantId,
                    variantName: variant.name,
                    productType: product.type,
                    quantity: ci.quantity,
                    unitPrice: variant.price,
                    totalPrice: lineTotal,
                    currency: variant.currency,
                    billingCycle: variant.billingCycle
                });
            }

            // Clear cart after order
            await Cart.findOneAndUpdate({ userId: user.userId }, { items: [] });
        } else {
            orderItems = manualItems || [];
            subtotal = orderItems.reduce((s: number, i: any) => s + i.totalPrice, 0);
        }

        if (orderItems.length === 0) {
            return NextResponse.json({ success: false, error: "No valid items" }, { status: 400 });
        }

        const orderNum = await nextOrderNumber();
        const year = new Date().getFullYear();
        const orderId = `ORD-${year}${String(orderNum).padStart(4, "0")}`;

        const tax = Math.round(subtotal * 0); // apply tax logic here if needed
        const shippingCost = 0; // calculate based on address/weight
        const total = subtotal + tax + shippingCost;

        const order = await Order.create({
            orderId,
            orderNumber: orderNum,
            userId: user.userId,
            userEmail: user.email,
            userName: user.name,
            items: orderItems,
            subtotal,
            tax,
            shippingCost,
            total,
            currency: orderItems[0]?.currency || "USD",
            status: "pending",
            paymentStatus: "pending",
            paymentMethod,
            shippingAddress,
            customerNote
        });

        // Automatically grant paid_customer role if not already
        if (!user.isPaidCustomer) {
            await UserRole.findOneAndUpdate(
                { userId: user.userId },
                {
                    $setOnInsert: {
                        userId: user.userId,
                        email: user.email,
                        grantedBy: "system"
                    },
                    $addToSet: { roles: "paid_customer" }
                },
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ success: true, data: order }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
}
