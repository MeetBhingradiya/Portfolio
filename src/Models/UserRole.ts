/**
 * UserRole Model
 * Stores role assignments and custom permissions for users.
 * Admin can grant custom roles beyond the built-in set.
 *
 * Built-in roles:
 *  - user        → Default, every authenticated account
 *  - employee    → Staff managing support platform
 *  - paid_customer → Purchased product/subscription
 *  - admin       → Full access (ADMIN_EMAIL from env — no DB record needed)
 *
 * Additional roles can be created via Admin Panel permission system.
 */

import mongoose, { Schema, Document } from "mongoose";

export type BuiltInRole = "user" | "employee" | "paid_customer" | "admin";

export interface IPermission {
    key: string; // e.g. "support.view", "shop.manage"
    label: string;
    granted: boolean;
}

export interface IUserRole extends Document {
    userId: string; // Better Auth user _id
    email: string; // Denormalised for quick look-up
    roles: string[]; // ['user', 'employee', 'paid_customer'] or custom
    permissions: IPermission[];
    notes?: string; // Admin notes
    grantedBy: string; // admin email who set this
    createdAt: Date;
    updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
    {
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        granted: { type: Boolean, default: true }
    },
    { _id: false }
);

const UserRoleSchema = new Schema<IUserRole>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        roles: {
            type: [String],
            default: ["user"],
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: "At least one role is required"
            }
        },
        permissions: { type: [PermissionSchema], default: [] },
        notes: { type: String, trim: true },
        grantedBy: { type: String, required: true }
    },
    { timestamps: true }
);

export const UserRole = mongoose.models.UserRole || mongoose.model<IUserRole>("UserRole", UserRoleSchema);
