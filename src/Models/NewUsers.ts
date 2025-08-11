import mongoose from "mongoose";
import { v4 } from "uuid";

const User_Schema = new mongoose.Schema(
    {
        UserID: {
            type: String,
            default: v4,
            unique: true
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: function (this: any) {
                return !this.provider || this.provider === "credentials";
            }
        },
        image: {
            type: String
        },
        provider: {
            type: String,
            enum: ["google", "github", "credentials"],
            default: "credentials"
        },
        providerId: {
            type: String
        },
        emailVerified: {
            type: Date
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    {
        timestamps: true
    }
);

interface IUser extends mongoose.Document {
    UserID: string;
    name: string;
    email: string;
    password?: string;
    image?: string;
    provider?: string;
    providerId?: string;
    emailVerified?: Date;
    role?: "user" | "admin";
    createdAt: Date;
    updatedAt: Date;
}

// Prevent recompilation during development
export const Users_Model: mongoose.Model<IUser> =
    mongoose.models?.Users ||
    mongoose.model<IUser>("Users", User_Schema);

export default Users_Model;
