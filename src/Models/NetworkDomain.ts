import mongoose, { Document, Schema } from "mongoose";

export interface INetworkDomain extends Document {
    name: string;
    domain: string;
    description?: string;
    icon?: string;
    enabled: boolean;
    type: "domain" | "subdomain";
    createdAt: Date;
    updatedAt: Date;
}

const NetworkDomainSchema = new Schema<INetworkDomain>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        domain: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        icon: {
            type: String,
            trim: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        type: {
            type: String,
            enum: ["domain", "subdomain"],
            default: "domain",
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

export const NetworkDomain: mongoose.Model<INetworkDomain> =
    mongoose.models.NetworkDomain || mongoose.model<INetworkDomain>("NetworkDomain", NetworkDomainSchema);
