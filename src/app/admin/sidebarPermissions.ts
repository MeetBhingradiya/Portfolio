/**
 * Admin Sidebar Permissions Configuration
 *
 * Maps each sidebar item/group to required permissions.
 * Empty array = accessible to all authenticated users
 * Multiple permissions = user must have at least one (OR logic)
 */

export type NavItemKey =
    | "dashboard"
    | "users"
    | "roles"
    | "tickets"
    | "faq"
    | "employee"
    | "products"
    | "orders"
    | "refunds"
    | "sitemap"
    | "projects"
    | "documents"
    | "skills"
    | "education"
    | "experience"
    | "certificates"
    | "test-scores"
    | "resume"
    | "blogs"
    | "features"
    | "tools"
    | "tool-settings"
    | "ai-providers"
    | "maintenance"
    | "rate-limits"
    | "immich-access"
    | "db-sync"
    | "cdn"
    | "cdn-applications"
    | "cdn-api-keys"
    | "docgen";

/**
 * Navigation item to required permission(s) mapping
 * If empty array → no specific permissions required (all users can access)
 * If has permissions → user must have at least ONE of them
 */
export const sidebarPermissions: Record<NavItemKey, string[]> = {
    // Core admin pages (requires admin email or admin role)
    "dashboard": [],
    "users": ["admin.users.view", "admin.users.manage"],
    "roles": ["admin.roles.manage"],

    // Support module
    "tickets": ["support.tickets.view"],
    "faq": ["admin.faq.manage"],
    "employee": ["support.tickets.view"],

    // Shop module
    "products": ["shop.products.manage"],
    "orders": ["shop.orders.view"],
    "refunds": ["shop.refunds.view"],

    // Portfolio module
    "sitemap": ["portfolio.manage"],
    "projects": ["portfolio.manage"],
    "documents": ["portfolio.manage"],
    "skills": ["portfolio.manage"],
    "education": ["portfolio.manage"],
    "experience": ["portfolio.manage"],
    "certificates": ["portfolio.manage"],
    "test-scores": ["portfolio.manage"],
    "resume": ["portfolio.manage"],
    "blogs": ["content.blog.manage"],

    // System/Settings module (admin only)
    "features": ["admin.site.settings"],
    "tools": ["admin.site.settings"],
    "tool-settings": ["admin.site.settings"],
    "ai-providers": ["admin.site.settings"],
    "maintenance": ["admin.site.settings"],
    "rate-limits": ["admin.rate-limits.view", "admin.rate-limits.manage"],
    "immich-access": ["admin.site.settings"],
    "db-sync": ["admin.site.settings"],
    "cdn": ["cdn.keys.view", "cdn.keys.manage"],
    "cdn-applications": ["cdn.applications.view", "cdn.applications.review"],
    "cdn-api-keys": ["cdn.keys.view", "cdn.keys.manage"],
    "docgen": ["admin.site.settings"]
};

/**
 * Get required permissions for a sidebar item
 */
export function getItemPermissions(itemKey: NavItemKey): string[] {
    return sidebarPermissions[itemKey] || [];
}
