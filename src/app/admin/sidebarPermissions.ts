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
    | "skills"
    | "education"
    | "experience"
    | "certificates"
    | "test-scores"
    | "resume"
    | "blogs"
    | "features"
    | "tool-settings"
    | "ai-providers"
    | "maintenance"
    | "immich-access"
    | "cdn"
    | "cdn-applications"
    | "cdn-api-keys";

/**
 * Navigation item to required permission(s) mapping
 * If empty array → no specific permissions required (all users can access)
 * If has permissions → user must have at least ONE of them
 */
export const sidebarPermissions: Record<NavItemKey, string[]> = {
    // Core admin pages (requires admin email or admin role)
    dashboard: [],
    users: ["admin.users.manage"],
    roles: ["admin.roles.manage"],

    // Support module
    tickets: ["support.tickets.view"],
    faq: ["admin.faq.manage"],
    employee: ["support.tickets.view"],

    // Shop module
    products: ["shop.products.manage"],
    orders: ["shop.orders.view"],
    refunds: ["shop.refunds.view"],

    // Portfolio module
    sitemap: ["portfolio.manage"],
    projects: ["portfolio.manage"],
    skills: ["portfolio.manage"],
    education: ["portfolio.manage"],
    experience: ["portfolio.manage"],
    certificates: ["portfolio.manage"],
    "test-scores": ["portfolio.manage"],
    resume: ["portfolio.manage"],
    blogs: ["content.blog.manage"],

    // System/Settings module (admin only)
    features: [],
    "tool-settings": [],
    "ai-providers": [],
    maintenance: [],
    "immich-access": [],
    cdn: [],
    "cdn-applications": [],
    "cdn-api-keys": [],
};

/**
 * Get required permissions for a sidebar item
 */
export function getItemPermissions(itemKey: NavItemKey): string[] {
    return sidebarPermissions[itemKey] || [];
}
