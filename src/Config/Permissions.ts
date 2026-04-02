/**
 * Permissions Catalog
 *
 * Single source of truth for every permission string in the system.
 * Used by:
 *  - Role Definition manager (/admin/roles → Role Definitions tab)
 *  - Runtime permission checks (RolePermissions utility)
 *  - UI selectors when editing roles or per-user overrides
 *
 * Adding a new permission:
 *  1. Add an entry here.
 *  2. Check it in your API route via resolveEffectivePermissions() or hasPermission().
 */

export interface PermissionDef {
    key: string; // unique dot-separated identifier
    label: string; // human-readable name
    description?: string; // tooltip
    category: string; // groups the permission in the UI
}

export const PERMISSION_CATEGORIES: Record<string, { label: string; color: string }> = {
    support: { label: "Support", color: "#3b82f6" },
    shop: { label: "Shop & Orders", color: "#f59e0b" },
    cdn: { label: "CDN", color: "#8b5cf6" },
    admin: { label: "Administration", color: "#ef4444" },
    content: { label: "Content", color: "#22c55e" },
    finance: { label: "Finance", color: "#06b6d4" }
};

export const PERMISSIONS: PermissionDef[] = [
    // ── Support ───────────────────────────────────────────────────────────
    {
        key: "support.tickets.view",
        label: "View Tickets",
        description: "See all support tickets",
        category: "support"
    },
    {
        key: "support.tickets.manage",
        label: "Manage Tickets",
        description: "Reply, close and reopen tickets",
        category: "support"
    },
    {
        key: "support.tickets.assign",
        label: "Assign Tickets",
        description: "Assign tickets to other staff",
        category: "support"
    },
    {
        key: "support.tickets.delete",
        label: "Delete Tickets",
        description: "Permanently delete ticket threads",
        category: "support"
    },

    // ── Shop & Orders ─────────────────────────────────────────────────────
    {
        key: "shop.orders.view",
        label: "View All Orders",
        description: "See every customer order",
        category: "shop"
    },
    {
        key: "shop.orders.update",
        label: "Update Order Status",
        description: "Mark orders as shipped/completed",
        category: "shop"
    },
    {
        key: "shop.products.manage",
        label: "Manage Products",
        description: "Create, edit and delete products",
        category: "shop"
    },
    {
        key: "shop.refunds.view",
        label: "View Refunds",
        description: "See refund requests",
        category: "shop"
    },
    {
        key: "shop.refunds.review",
        label: "Review Refunds",
        description: "Approve or deny refund requests",
        category: "shop"
    },
    {
        key: "shop.coupons.manage",
        label: "Manage Coupons",
        description: "Create and disable coupon codes",
        category: "shop"
    },

    // ── CDN ───────────────────────────────────────────────────────────────
    {
        key: "cdn.applications.view",
        label: "View CDN Applications",
        description: "See submitted CDN access requests",
        category: "cdn"
    },
    {
        key: "cdn.applications.review",
        label: "Review CDN Applications",
        description: "Approve, reject or suspend apps",
        category: "cdn"
    },
    {
        key: "cdn.keys.view",
        label: "View CDN API Keys",
        description: "List issued API keys",
        category: "cdn"
    },
    {
        key: "cdn.keys.manage",
        label: "Manage CDN API Keys",
        description: "Issue, revoke and rotate keys",
        category: "cdn"
    },

    // ── Administration ────────────────────────────────────────────────────
    {
        key: "admin.users.view",
        label: "View Users",
        description: "List all registered users",
        category: "admin"
    },
    {
        key: "admin.users.manage",
        label: "Manage Users",
        description: "Edit user details and ban accounts",
        category: "admin"
    },
    {
        key: "admin.roles.manage",
        label: "Manage Roles",
        description: "Edit role definitions and assignments",
        category: "admin"
    },
    {
        key: "admin.faq.manage",
        label: "Manage FAQ",
        description: "Create, edit and delete FAQ entries",
        category: "admin"
    },
    {
        key: "admin.site.settings",
        label: "Site Settings",
        description: "Toggle maintenance mode and banners",
        category: "admin"
    },
    {
        key: "admin.payments.view",
        label: "View Payments",
        description: "See all payment records",
        category: "admin"
    },

    // ── Content ───────────────────────────────────────────────────────────
    {
        key: "content.blog.manage",
        label: "Manage Blog",
        description: "Create, edit and publish blog posts",
        category: "content"
    },
    {
        key: "content.projects.manage",
        label: "Manage Projects",
        description: "Add and edit portfolio projects",
        category: "content"
    },
    {
        key: "content.sitemap.manage",
        label: "Manage Sitemap",
        description: "Edit sitemap and page metadata",
        category: "content"
    },

    // ── Finance ───────────────────────────────────────────────────────────
    {
        key: "finance.summary.view",
        label: "View Finance Summary",
        description: "See revenue and sales charts",
        category: "finance"
    },
    {
        key: "finance.transactions.export",
        label: "Export Transactions",
        description: "Download transaction CSV/PDF",
        category: "finance"
    }
];

/** Returns a flat key → PermissionDef map for O(1) lookups */
export const PERMISSIONS_MAP: Record<string, PermissionDef> = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p]));

/** All keys as a flat string array */
export const ALL_PERMISSION_KEYS: string[] = PERMISSIONS.map((p) => p.key);

/** Permissions grouped by category */
export function permissionsByCategory(): Record<string, PermissionDef[]> {
    return PERMISSIONS.reduce<Record<string, PermissionDef[]>>((acc, p) => {
        (acc[p.category] ??= []).push(p);
        return acc;
    }, {});
}
