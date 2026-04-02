/**
 * EXAMPLE API ROUTE - Role & Permissions Protection
 *
 * This is an example showing how to protect admin API routes.
 * Copy this pattern to any admin API route that needs permission checks.
 *
 * Location: src/app/api/admin/[feature]/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import {
    requireAdminEmail,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    permissionError
} from "@Library/adminApiMiddleware";

// Example 1: Admin-only endpoint (ADMIN_EMAIL required)
export async function exampleAdminOnly(req: NextRequest) {
    const result = await requireAdminEmail(req);
    if (result.error) {
        return permissionError(result.status, result.message);
    }

    const session = result.session;
    // Only admin (ADMIN_EMAIL) can access
    return NextResponse.json({
        message: "Admin endpoint",
        user: session.user.email
    });
}

// Example 2: Endpoint requiring specific permission
export async function exampleWithPermission(req: NextRequest) {
    const result = await requirePermission(req, "shop.orders.view");
    if (result.error) {
        return permissionError(result.status, result.message);
    }

    const session = result.session;
    // User must have "shop.orders.view" permission
    return NextResponse.json({
        message: "Orders data",
        userId: session.user.id
    });
}

// Example 3: Endpoint requiring ANY of multiple permissions (OR logic)
export async function exampleWithAnyPermission(req: NextRequest) {
    const result = await requireAnyPermission(req, ["shop.orders.view", "shop.refunds.view"]);
    if (result.error) {
        return permissionError(result.status, result.message);
    }

    const session = result.session;
    // User must have at least one of the permissions
    return NextResponse.json({
        message: "Orders or refunds data",
        userId: session.user.id
    });
}

// Example 4: Endpoint requiring ALL permissions (AND logic)
export async function exampleWithAllPermissions(req: NextRequest) {
    const result = await requireAllPermissions(req, ["shop.orders.view", "shop.orders.update"]);
    if (result.error) {
        return permissionError(result.status, result.message);
    }

    const session = result.session;
    // User must have ALL permissions to update orders
    return NextResponse.json({
        message: "Can update orders",
        userId: session.user.id
    });
}

// Example 5: Complete GET endpoint with permission check
// Usage: src/app/api/admin/tickets/route.ts
export async function GET(req: NextRequest) {
    // Step 1: Check permission
    const result = await requirePermission(req, "support.tickets.view");
    if (result.error) {
        return permissionError(result.status, result.message);
    }

    // Step 2: Get session (now guaranteed)
    const session = result.session;
    const userId = session.user.id;

    // Step 3: Parse request
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Step 4: Validate input
    if (limit > 100 || limit < 1) {
        return NextResponse.json({ error: "Invalid limit (1-100)" }, { status: 400 });
    }

    // Step 5: Fetch data (would use your database here)
    // const tickets = await Ticket.find().skip(offset).limit(limit);

    // Step 6: Return response
    return NextResponse.json({
        tickets: [], // Replace with actual data
        total: 0,
        limit,
        offset,
        userId // For reference
    });
}

// Example 6: Complete POST endpoint with permission check
// Usage: src/app/api/admin/products/route.ts
export async function POST(req: NextRequest) {
    // Step 1: Check permission (POST requires manage permission, not just view)
    const result = await requirePermission(req, "shop.products.manage");
    if (result.error) {
        return permissionError(result.status, result.message);
    }

    // Step 2: Get session
    const session = result.session;
    const userId = session.user.id;

    // Step 3: Parse request body
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Step 4: Validate required fields
    const { name, price, description } = body;
    if (!name || !price) {
        return NextResponse.json({ error: "Missing required fields: name, price" }, { status: 400 });
    }

    // Step 5: Create product (would use your database here)
    // const product = await Product.create({
    //     name,
    //     price,
    //     description,
    //     createdBy: userId
    // });

    // Step 6: Return created resource
    return NextResponse.json(
        {
            message: "Product created",
            product: { name, price, description, createdBy: userId }
        },
        { status: 201 }
    );
}

/**
 * USAGE PATTERNS
 */

/*
1. Admin endpoints (most restrictive):
   → Use requireAdminEmail()
   → Only accessible by ADMIN_EMAIL owner

2. Feature-specific endpoints:
   → Use requirePermission() for single permission
   → Use requireAnyPermission() for multiple options
   → Use requireAllPermissions() for strict requirements

3. GET endpoints:
   → Usually require "view" permission
   → Example: "shop.orders.view"

4. POST/PUT/DELETE endpoints:
   → Usually require "manage" permission
   → Example: "shop.orders.manage"

5. Error responses:
   → 401 Unauthorized → Not authenticated
   → 403 Forbidden → Authenticated but lacks permission
   → 400 Bad Request → Invalid input
*/
