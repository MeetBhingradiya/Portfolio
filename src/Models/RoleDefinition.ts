/**
 * RoleDefinition Model
 *
 * Defines what a "role" means — a named bundle of permission keys.
 * Roles are assigned to users via the UserRole model.
 * Permissions in a role are expanded at runtime by RolePermissions.resolveEffectivePermissions().
 *
 * Built-in roles (isBuiltin: true) cannot be deleted but their permissions can be edited.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface IRoleDefinition extends Document {
    key: string; // unique slug  e.g. "employee"
    label: string; // display name e.g. "Employee"
    description: string;
    permissions: string[]; // array of permission keys from the Permissions catalog
    isBuiltin: boolean; // built-in roles cannot be deleted
    color: string; // hex color for UI badges  e.g. "#3b82f6"
    order: number; // sort order in the UI
    createdAt: Date;
    updatedAt: Date;
}

const RoleDefinitionSchema = new Schema<IRoleDefinition>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        label: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        permissions: { type: [String], default: [] },
        isBuiltin: { type: Boolean, default: false },
        color: { type: String, default: "#6366f1", trim: true },
        order: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export const RoleDefinition =
    (mongoose.models.RoleDefinition as mongoose.Model<IRoleDefinition>) ||
    mongoose.model<IRoleDefinition>("RoleDefinition", RoleDefinitionSchema);

// ── Seed built-in roles on first use ─────────────────────────────────────────
// Call this once from an API route or server startup.
export async function seedBuiltinRoles() {
    const BUILTIN: Omit<IRoleDefinition, keyof Document | "createdAt" | "updatedAt">[] = [
        {
            key: "employee",
            label: "Employee",
            description: "Staff with access to support, orders, and content management.",
            color: "#3b82f6",
            order: 1,
            isBuiltin: true,
            permissions: [
                "support.tickets.view",
                "support.tickets.manage",
                "support.tickets.assign",
                "shop.orders.view",
                "shop.orders.update",
                "shop.refunds.view",
                "admin.faq.manage",
                "content.blog.manage"
            ]
        },
        {
            key: "paid_customer",
            label: "Paid Customer",
            description: "User who has purchased a product or active subscription.",
            color: "#22c55e",
            order: 2,
            isBuiltin: true,
            permissions: [] // permissions granted by the shop checkout, not manually
        },
        {
            key: "moderator",
            label: "Moderator",
            description: "Community moderator with limited admin access.",
            color: "#f59e0b",
            order: 3,
            isBuiltin: true,
            permissions: ["support.tickets.view", "support.tickets.manage", "shop.refunds.view", "admin.faq.manage"]
        }
    ];

    for (const role of BUILTIN) {
        await RoleDefinition.findOneAndUpdate({ key: role.key }, { $setOnInsert: role }, { upsert: true });
    }
}
