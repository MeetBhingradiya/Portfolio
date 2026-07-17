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
    security: { label: "Security", color: "#dc2626" },
    system: { label: "System", color: "#64748b" },
    admin: { label: "Administration", color: "#ef4444" },
    content: { label: "Content", color: "#22c55e" },
    finance: { label: "Finance", color: "#06b6d4" },
    tools: { label: "Tools & Assignments", color: "#14b8a6" }
};

export const PERMISSIONS = [
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
    // {
    //     key: "admin.payments.view",
    //     label: "View Payments",
    //     description: "See all payment records",
    //     category: "admin"
    // },

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
    },

    // ── Tools: Assignment Document System ──────────────────────────────────
    {
        key: "Tools.AssignmentSystem.Create",
        label: "Create Assignments",
        description: "Create new assignment documents",
        category: "tools"
    },
    {
        key: "Tools.AssignmentSystem.List",
        label: "List Assignments",
        description: "List and search assignment documents",
        category: "tools"
    },
    {
        key: "Tools.AssignmentSystem.View",
        label: "View Assignment",
        description: "View assignment document details",
        category: "tools"
    },
    {
        key: "Tools.AssignmentSystem.Edit",
        label: "Edit Assignment",
        description: "Edit assignment document content",
        category: "tools"
    },
    {
        key: "Tools.AssignmentSystem.Delete",
        label: "Delete Assignment",
        description: "Delete assignment document (soft delete to trash)",
        category: "tools"
    },
    {
        key: "Tools.AssignmentSystem.Share",
        label: "Share Assignment",
        description: "Share assignment with other users and generate share links",
        category: "tools"
    },
    {
        key: "Tools.AssignmentSystem.Download",
        label: "Download Assignment",
        description: "Download assignment as PDF",
        category: "tools"
    },
    {
        key: "Tools.AssignmentSystem.Manage",
        label: "Manage All Assignments",
        description: "Admin access to manage all assignments and apply restrictions",
        category: "tools"
    },








    // ? New Permissions System
    {
        key: "System.Permissions.View",
        label: "View Permissions",
        description: "View the list of all permissions in the system",
        category: "system"
    },

    // ^ Admin Dashboard Access
    {
        key: "Admin.View",
        label: "Access Admin Dashboard",
        description: "Access the admin dashboard and its basic overview pages",
        category: "system"
    },

    // ^ Role Management Permissions
    {
        key: "System.Roles.Edit",
        label: "Edit Roles",
        description: "Edit roles in the system",
        category: "system"
    },
    {
        key: "System.Roles.Delete",
        label: "Delete Roles",
        description: "Delete roles from the system",
        category: "system"
    },
    {
        key: "System.Roles.Create",
        label: "Create Roles",
        description: "Create new roles in the system",
        category: "system"
    },

    // ^ Sitemap Management
    {
        key: "System.Sitemap.view",
        label: "View Sitemap",
        description: "View the sitemap and page metadata in the system",
        category: "system"
    },

    // ^ Feature Flag Permissions
    {
        key: "Admin.FeatureFlags.Toggle",
        label: "Toggle Feature Flags",
        description: "Enable or disable feature flags in the system",
        category: "admin"
    },
    {
        key: "Admin.FeatureFlags.Edit",
        label: "Edit Feature Flags",
        description: "Edit feature flag settings in the system",
        category: "admin"
    },
    {
        key: "Admin.FeatureFlags.View",
        label: "View Feature Flags",
        description: "View the list of feature flags in the system",
        category: "admin"
    },

    // ? Switch Account
    // ? History of Avatars
    // ? Social Login Management
    // ? Authentication & Registration Controls


    // ^ Database Sync on Development
    {
        key: "System.Database.Sync.View",
        label: "Database Sync Tool",
        description: "View & Sync database localy of production data for testing and development purposes",
        category: "system"
    },

    // ^ User Assignment Permissions
    {
        key: "Admin.Users.Permissions.Assign",
        label: "Assign Permissions",
        description: "Assign permissions to users in the system",
        category: "admin"
    },
    {
        key: "Admin.Users.Permissions.Manage",
        label: "Manage Permissions",
        description: "Edit user permissions and overrides in the system",
        category: "admin"
    },
    {
        key: "Admin.Users.Roles.Assign",
        label: "Assign Roles",
        description: "Assign roles to users in the system",
        category: "admin"
    },
    {
        key: "Admin.Users.Roles.Manage",
        label: "Manage Roles",
        description: "Edit user role assignments in the system",
        category: "admin"
    },
    {
        key: "Admin.Users.Roles.View",
        label: "View Roles",
        description: "View the list of roles in the system",
        category: "admin"
    },

    // ^ Users
    {
        key: "Admin.Users.View",
        label: "View Users",
        description: "View the list of users in the system",
        category: "admin"
    },
    {
        key: "Admin.Users.Create",
        label: "Create Users",
        description: "Create new users in the system",
        category: "admin"
    },
    {
        key: "Admin.Users.Edit",
        label: "Edit Users",
        description: "Edit user details and information in the system",
        category: "admin"
    },
    {
        key: "Admin.Users.Delete",
        label: "Delete Users",
        description: "Delete users from the system",
        category: "admin"
    },

    // ^ Special Permissions
    {
        key: "Users.Photos.Access",
        label: "Photo Cloud Access",
        description: "Access to Immich self-hosted storage for user photos and media",
        category: "users"
    },
    {
        key: "Admin.Users.Photos.View",
        label: "View List of Users with Photo Storage Access",
        description: "View the list of users who have access to Immich self-hosted storage for photos and media",
        category: "admin"
    },
    {
        key: "Admin.Users.Photos.Access.Manage",
        label: "Manage User Photo Storage Access",
        description: "Grant or revoke user access to Immich self-hosted storage for photos and media",
        category: "admin"
    },

    // ^ CDN Management
    {
        key: "Users.Avatars.Import",
        label: "Import Custom Avatars",
        description: "Import custom avatar images to cdn for users, which may be stored on the CDN or webpage directly",
        category: "users"
    },
    {
        key: "Users.Avatars.Upload",
        label: "Upload Custom Avatars",
        description: "Upload custom avatar images for users, which may be stored on their storage",
        category: "users"
    },
    {
        key: "Users.CDN.Application.Request",
        label: "Request CDN Access",
        description: "Request Form access to the CDN for hosting user content",
        category: "users"
    },
    {
        key: "Admin.CDN.Application.View",
        label: "View CDN Access Requests",
        description: "See the list of user requests for CDN access",
        category: "admin"
    },
    {
        key: "Admin.CDN.Application.Manage",
        label: "Manage CDN Access Requests",
        description: "Review and approve or reject user requests for CDN access",
        category: "admin"
    },
    {
        key: "Admin.CDN.APIKeys.Issue",
        label: "Issue CDN API Keys",
        description: "Issue API keys for users approved for CDN access",
        category: "admin"
    },
    {
        key: "Admin.CDN.APIKeys.Revoke",
        label: "Revoke CDN API Keys",
        description: "Revoke API keys for users with CDN access",
        category: "admin"
    },
    {
        key: "Admin.CDN.APIKeys.Manage",
        label: "Manage CDN API Keys",
        description: "Manage API keys Rate Limits for users with CDN access",
        category: "admin"
    },

    // ^ Social Login/Registration Management
    {
        key: "Users.Social.Google",
        label: "Link Google",
        description: "Link or unlink Google social login for user accounts",
        category: "users"
    },
    {
        key: "Users.Social.GitHub",
        label: "Link GitHub",
        description: "Link or unlink GitHub social login for user accounts",
        category: "users"
    },
    {
        key: "Users.Social.Microsoft",
        label: "Link Microsoft",
        description: "Link or unlink Microsoft social login for user accounts",
        category: "users"
    },
    {
        key: "Users.Social.Apple",
        label: "Link Apple ID",
        description: "Link or unlink Apple social login for user accounts",
        category: "users"
    },

    // ^ Profile Management
    {
        key: "Users.Usernames",
        label: "Manage Usernames",
        description: "Edit user usernames of its account",
        category: "users"
    },
    {
        key: "Users.Emails",
        label: "Emails",
        description: "Edit user email addresses associated with their account",
        category: "users"
    },
    {
        key: "Users.DisplayNames",
        label: "Display Names",
        description: "Edit user display names associated with their account",
        category: "users"
    },

    // ^ Maintanance Mode
    {
        key: "Admin.Maintenance.Manage",
        label: "Toggle Maintenance Mode",
        description: "Enable or disable maintenance mode for the website",
        category: "admin"
    },
    {
        key: "Admin.Maintenance.Access",
        label: "View Maintenance Mode Status",
        description: "Able to View Entire website when in Maintenance Mode is enabled",
        category: "admin"
    },

    // ^ AI Providers
    {
        key: "Admin.AI.View",
        label: "View AI Providers",
        description: "View the list of AI providers in the system",
        category: "admin"
    },
    {
        key: "Admin.AI.Manage",
        label: "Manage AI Providers",
        description: "Add, edit or remove AI providers in the system",
        category: "admin"
    },

    // ^ Resume Permissions
    {
        key: "Admin.Resume.View",
        label: "View Resumes",
        description: "View resumes in the system",
        category: "admin"
    },
    {
        key: "Admin.Resume.Download",
        label: "Download Resumes",
        description: "Download resumes from the system",
        category: "admin"
    },
    {
        key: "Admin.Resume.Preset.Create",
        label: "Create Resume Presets",
        description: "Create resume presets for users to choose from",
        category: "admin"
    },
    {
        key: "Admin.Resume.Preset.Edit",
        label: "Edit Resume Presets",
        description: "Edit resume presets in the system",
        category: "admin"
    },
    {
        key: "Admin.Resume.Preset.Delete",
        label: "Delete Resume Presets",
        description: "Delete resume presets from the system",
        category: "admin"
    },

    // ? Tools Permissions - Tools that Requires to Signin to Access
    {
        key: "Tools.TradeJournal.Access",
        label: "Trade Journal",
        description: "Access to the private trade journal tool that requires user authentication",
        category: "tools"
    },
    {
        key: "Tools.WalletTracker.Access",
        label: "Wallet Tracker",
        description: "Access to the private wallet tracker tool that requires user authentication",
        category: "tools"
    },
    {
        key: "Tools.Productivity.Access",
        label: "Productivity Tool",
        description: "Access to the private productivity tool that require user authentication",
        category: "tools"
    },
    {
        key: "Tools.HardwareUnlock.Access",
        label: "Hardware Unlock Tool",
        description: "Access to the hardware unlock tool that requires user authentication and permission",
        category: "tools"
    },
    {
        key: "Tools.DocumentVault.Access",
        label: "Document Vault",
        description: "Access to the private document vault tool that requires user authentication",
        category: "tools"
    },
    {
        key: "Tools.Student.AssignmentDocs.Access",
        label: "Assignment Documents",
        description: "Access to the private assignment documents tool that requires user authentication",
        category: "tools"
    },

    // ? Blogs Permissions
    {
        key: "Users.Blogs.Create",
        label: "Create Blogs",
        description: "Create new blog posts",
        category: "users"
    },
    {
        key: "Users.Blogs.Edit",
        label: "Edit Blogs",
        description: "Edit existing blog posts & if already published, it will be unpublished and need to be published again",
        category: "users"
    },
    {
        key: "Users.Blogs.History.View",
        label: "View Blog Edit History",
        description: "View the edit history of blog posts with timestamps and changes made",
        category: "users"
    },
    {
        key: "Users.Blogs.Delete",
        label: "Delete Blogs",
        description: "Delete blog posts (soft delete), for Government compliance and to prevent abuse, it will be moved to trash and can be restored within 30 days, after 30 days it will be permanently deleted",
        category: "users"
    },
    {
        key: "Users.Blogs.Privacy.View",
        label: "View Blog Privacy Options",
        description: "View blog privacy options when creating or editing blog posts",
        category: "users"
    },
    {
        key: "Users.Blogs.Privacy.Manage",
        label: "Manage Blog Privacy",
        description: "Set blog posts as public or private",
        category: "users"
    },
    {
        key: "Users.Blogs.Share",
        label: "Share Blogs",
        description: "Share blog posts with other users and generate share links",
        category: "users"
    },
    {
        key: "Admin.Blogs.View",
        label: "View User Blogs",
        description: "View user-created blog posts for moderation",
        category: "admin"
    },
    {
        key: "Admin.Blogs.Publish",
        label: "Publish User Blogs",
        description: "Publish user-created blog posts to make them visible to others",
        category: "admin"
    },
    {
        key: "Admin.Blogs.Restrict",
        label: "Restrict User Blogs",
        description: "Restrict user-created blog posts from being visible to others",
        category: "admin"
    },
    {
        key: "Admin.Blogs.Delete",
        label: "Delete User Blogs",
        description: "Permanently delete user-created blog posts",
        category: "admin"
    },

    // ? Portfolio Permissions (Projects, Skills, Experiences, Education, Certifications, Test Scores)
    {
        key: "Admin.Projects.View",
        label: "View User Projects",
        description: "View user-created portfolio projects for moderation",
        category: "admin"
    },
    {
        key: "Admin.Projects.Manage",
        label: "Manage User Projects",
        description: "Manage user-created portfolio projects",
        category: "admin"
    },
    {
        key: "Admin.Skills.View",
        label: "View User Skills",
        description: "View user-created skills for moderation",
        category: "admin"
    },
    {
        key: "Admin.Skills.Manage",
        label: "Manage User Skills",
        description: "Manage user-created skills",
        category: "admin"
    },
    {
        key: "Admin.Experiences.View",
        label: "View User Experiences",
        description: "View user-created experiences for moderation",
        category: "admin"
    },
    {
        key: "Admin.Experiences.Manage",
        label: "Manage User Experiences",
        description: "Manage user-created experiences",
        category: "admin"
    },
    {
        key: "Admin.Education.View",
        label: "View User Education",
        description: "View user-created education entries for moderation",
        category: "admin"
    },
    {
        key: "Admin.Education.Manage",
        label: "Manage User Education",
        description: "Manage user-created education entries",
        category: "admin"
    },
    {
        key: "Admin.Certifications.View",
        label: "View User Certifications",
        description: "View user-created certifications for moderation",
        category: "admin"
    },
    {
        key: "Admin.Certifications.Manage",
        label: "Manage User Certifications",
        description: "Manage user-created certifications",
        category: "admin"
    },
    {
        key: "Admin.TestScores.View",
        label: "View User Test Scores",
        description: "View user-created test scores for moderation",
        category: "admin"
    },
    {
        key: "Admin.TestScores.Manage",
        label: "Manage User Test Scores",
        description: "Manage user-created test scores",
        category: "admin"
    },

    // ── Rate Limiting ─────────────────────────────────────────────────────
    {
        key: "admin.rate-limits.view",
        label: "View Rate Limits",
        description: "View rate limit rules, counters, and blocked identities",
        category: "security"
    },
    {
        key: "admin.rate-limits.manage",
        label: "Manage Rate Limits",
        description: "Create, edit, and delete rate limit rules and whitelists",
        category: "security"
    },
    {
        key: "admin.rate-limits.whitelist",
        label: "Manage Rate Limit Whitelist",
        description: "Add or remove IPs and device fingerprints from the rate limit bypass list",
        category: "security"
    }

] as const satisfies readonly PermissionDef[];

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

/** Returns a flat key → PermissionDef map for O(1) lookups */
export const PERMISSIONS_MAP = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p])) as Record<PermissionKey, PermissionDef>;

/** All keys as a flat string array */
export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

const LEGACY_PERMISSION_ALIASES: Record<string, PermissionKey> = {
    "Users.Usernames.Manage": "Users.Usernames",
    "Users.Emails.Manage": "Users.Emails",
    "Users.DisplayNames.Manage": "Users.DisplayNames"
};

export function isPermissionKey(key: string): key is PermissionKey {
    return (ALL_PERMISSION_KEYS as readonly string[]).includes(key);
}

export function normalizePermissionKey(key: string): PermissionKey | "*" | null {
    if (key === "*") return "*";
    const normalized = LEGACY_PERMISSION_ALIASES[key] ?? key;
    return isPermissionKey(normalized) ? normalized : null;
}

export function isRolePermissionKey(key: string): key is PermissionKey | "*" {
    return normalizePermissionKey(key) !== null;
}

export function normalizePermissionKeys(keys: string[]): Array<PermissionKey | "*"> {
    return keys
        .map((key) => normalizePermissionKey(key))
        .filter((key): key is PermissionKey | "*" => key !== null);
}

/** Permissions grouped by category */
export function permissionsByCategory(): Record<string, PermissionDef[]> {
    return PERMISSIONS.reduce<Record<string, PermissionDef[]>>((acc, p) => {
        (acc[p.category] ??= []).push(p);
        return acc;
    }, {});
}
