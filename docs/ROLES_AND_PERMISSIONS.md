# Role & Permissions System Guide

## Overview

Your application now has a comprehensive role-based access control (RBAC) system with:
- **Conditional sidebar rendering** based on permissions
- **API route protection** with permission checks
- **Role definitions** with permission catalogs
- **User role assignments** with custom permissions

## Architecture

### 1. Core Models

**RoleDefinition** (`src/Models/RoleDefinition.ts`)
- Defines roles and their permissions
- Built-in roles: `employee`, `paid_customer`, `moderator`
- Custom roles can be created via Admin Panel

**UserRole** (`src/Models/UserRole.ts`)
- Maps users to roles
- Supports custom permissions (overrides)
- Built-in role: `user` (default for all authenticated users)

### 2. Server-Side Utilities

**Permissions Library** (`src/Library/permissions.ts`)
```typescript
// Get all permissions for a user (merged from roles + custom)
await getUserPermissions(userId: string): Promise<string[]>

// Check specific permissions
await hasPermission(userId: string, permission: string): Promise<boolean>
await hasAnyPermission(userId: string, permissions: string[]): Promise<boolean>
await hasAllPermissions(userId: string, permissions: string[]): Promise<boolean>

// Check roles
await getUserRoles(userId: string): Promise<string[]>
await hasRole(userId: string, role: string): Promise<boolean>

// Check admin email
isAdminEmail(email: string): boolean
```

### 3. Client-Side Hook

**useAdminSession** (`src/Hooks/useAdminSession.ts`)
```typescript
const { session, loading, error, hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAdminSession();

// Check permissions on client
if (hasPermission("shop.orders.view")) {
    // Show orders section
}
```

### 4. API Protection Middleware

**adminApiMiddleware** (`src/Library/adminApiMiddleware.ts`)
```typescript
// Protect API routes with permission checks
const result = await requirePermission(req, "shop.orders.view");
if (result.error) {
    return permissionError(result.status, result.message);
}

const session = result.session;
// Process request...
```

## How to Use

### 1. Conditional Sidebar Rendering

The sidebar automatically filters items based on user permissions:

**Config** (`src/app/admin/sidebarPermissions.ts`)
```typescript
export const sidebarPermissions: Record<NavItemKey, string[]> = {
    users: ["admin.users.manage"],
    orders: ["shop.orders.view"],
    blogs: ["content.blog.manage"],
    // ...
};
```

To add a new sidebar item with permission:
1. Add the item to `allNavItems` in `AdminSidebar.tsx` with a `permKey`
2. Add permission requirements in `sidebarPermissions.ts`
3. The sidebar automatically filters based on user permissions

### 2. Protecting API Routes

```typescript
// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission, permissionError } from "@Library/adminApiMiddleware";

export async function GET(req: NextRequest) {
    const result = await requireAnyPermission(req, ["shop.orders.view", "admin.users.manage"]);

    if (result.error) {
        return permissionError(result.status, result.message);
    }

    const session = result.session;
    // Process request with session...

    return NextResponse.json({ orders: [...] });
}
```

### 3. Client-Side Permission Checks

```typescript
'use client';

import { useAdminSession } from "@Hooks/useAdminSession";

export function OrdersManager() {
    const { session, loading, hasPermission } = useAdminSession();

    if (loading) return <div>Loading...</div>;

    if (!hasPermission("shop.orders.view")) {
        return <div>You don't have permission to view orders</div>;
    }

    return (
        <div>
            {/* Orders UI */}
        </div>
    );
}
```

### 4. Assigning Permissions to Users

Via the Admin Panel, you can:
1. Create custom roles with specific permissions
2. Assign roles to users
3. Override permissions on a per-user basis

## Permission Naming Convention

Permissions follow a hierarchical naming pattern:

```
<module>.<submodule>.<action>
```

Examples:
- `support.tickets.view` - View support tickets
- `support.tickets.manage` - Create/edit/delete tickets
- `shop.orders.view` - View shop orders
- `shop.refunds.view` - View refunds
- `admin.faq.manage` - Manage FAQ
- `content.blog.manage` - Manage blog content
- `portfolio.manage` - Manage portfolio content
- `admin.users.manage` - Manage users
- `admin.roles.manage` - Manage roles & permissions

## Two-Layer Protection

Your system now has **two-layer protection**:

### Layer 1: Client-Side (UX)
- Sidebar items hidden based on permissions
- UI elements conditionally rendered
- Hooks prevent rendering unauthorized content

### Layer 2: Server-Side (Security)
- API endpoints verify permissions
- Admin layout checks ADMIN_EMAIL
- Individual API routes validate permissions
- Always trust the server for security

## API Endpoint Example

```typescript
// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, permissionError } from "@Library/adminApiMiddleware";
import { Product } from "@Models/Product";

export async function GET(req: NextRequest) {
    // CHECK 1: Verify authentication & permission
    const result = await requirePermission(req, "shop.products.manage");
    if (result.error) {
        return permissionError(result.status, result.message);
    }

    // CHECK 2: Verify request is valid
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { error: "Missing product ID" },
            { status: 400 }
        );
    }

    // CHECK 3: Fetch and return data
    const product = await Product.findById(id);
    return NextResponse.json(product);
}
```

## Customizing Permissions

### Add New Permission

1. Update `RoleDefinition` built-in roles with new permission keys
2. Update `sidebarPermissions.ts` to map UI elements to permissions
3. Seed roles via `/api/admin/seed-roles` or manually in Admin Panel

### Add New Role

1. Add role definition to `seedBuiltinRoles()` function
2. Run seed function once during deployment
3. Roles are immutable after seeding (permissions can be edited)

## Security Best Practices

✅ **DO:**
- Always verify permissions on the server (API routes)
- Use permission checks as secondary validation
- Follow the two-layer protection pattern
- Use meaningful permission names
- Audit admin actions

❌ **DON'T:**
- Rely only on client-side permission checks
- Store sensitive data in session on client
- Mix authentication and authorization logic
- Create overly granular permissions
- Grant "admin" role to regular users

## Troubleshooting

### Sidebar items not showing
- Check `sidebarPermissions.ts` configuration
- Verify user has required permissions in UserRole model
- Check browser console for permission check errors

### API returns 403 Forbidden
- Verify user is authenticated (401 vs 403)
- Check API middleware permission requirements
- Verify user roles in database
- Check permission key naming

### Permissions not updating
- Clear browser cache (localStorage/cookies)
- Refresh /api/admin/is-admin endpoint
- Verify UserRole document exists in database
- Check MongoDB connection

## Next Steps

1. **Assign roles to users** via Admin Panel (Roles & Perms section)
2. **Test API protection** by making authenticated requests
3. **Monitor admin actions** for security audit trail
4. **Create custom roles** as needed for your business logic
