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
import type { PermissionKey } from "@Config/Permissions";

export type RolePermissionKey = PermissionKey | "*";

export interface IRoleDefinition extends Document {
    key: string; // unique slug  e.g. "employee"
    label: string; // display name e.g. "Employee"
    description: string;
    permissions: RolePermissionKey[]; // array of permission keys from the Permissions catalog
    isBuiltin: boolean; // built-in roles cannot be deleted
    color: string; // hex color for UI badges  e.g. "#3b82f6"
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
    },
    { timestamps: true }
);

export const RoleDefinition =
    (mongoose.models.RoleDefinition as mongoose.Model<IRoleDefinition>) ||
    mongoose.model<IRoleDefinition>("RoleDefinition", RoleDefinitionSchema);

// ── Seed built-in roles on first use ─────────────────────────────────────────
// Call this once from an API route or server startup.
export async function seedBuiltinRoles() {
    const BUILTIN: Pick<IRoleDefinition, "key" | "label" | "description" | "permissions" | "isBuiltin" | "color">[] = [
        {
            key: "user",
            label: "User",
            description: "Default role for new users. No special permissions.",
            color: "#6b7280",
            isBuiltin: true,
            permissions: [
                // "Users.Avatars.Import",
                "Users.DisplayNames",
                "Users.Emails",
            ]
        },
        {
            key: "admin",
            label: "Admin",
            description: "Full access to all features and settings.",
            color: "#8b5cf6",
            isBuiltin: true,
            permissions: ["*"]
        },
        {
            key: "CDN Application Manager",
            label: "CDN Application Manager",
            description: "Can manage CDN applications and view related data.",
            color: "#3b82f6",
            isBuiltin: true,
            permissions: [
                "Admin.View",
                "Admin.CDN.Application.View",
                "Admin.CDN.Application.Manage",
                "Admin.CDN.APIKeys.Issue",
                "Admin.CDN.APIKeys.Manage",
                "Admin.CDN.APIKeys.Revoke"
            ]
        }
    ];

    for (const role of BUILTIN) {
        await RoleDefinition.findOneAndUpdate({ key: role.key }, { $setOnInsert: role }, { upsert: true });
    }
}
