import mongoose from "mongoose";
import { v4 } from "uuid";

type AuthenticatorTransportFuture =
    | "ble"
    | "cable"
    | "hybrid"
    | "internal"
    | "nfc"
    | "smart-card"
    | "usb";

const Passkeys_Schema: mongoose.Schema = new mongoose.Schema(
    {
        PasskeyID: {
            type: String,
            default: v4,
            unique: true
        },
        UserID: {
            type: String,
            required: true,
            index: true
        },
        Challenge: {
            type: String,
            required: true
        },
        PublicKey: {
            type: String
        },
        Transports: {
            type: [String],
            enum: [
                "ble",
                "cable",
                "hybrid",
                "internal",
                "nfc",
                "smart-card",
                "usb"
            ]
        },
        Name: {
            type: String
        },
        LastUsed: {
            type: Date
        },
        CreatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

export interface IPasskey extends mongoose.Document {
    // ? Identification of Passkey
    PasskeyID: string;

    // ? Owner of Passkey
    UserID: string;

    // ? Challenge Data
    Challenge: string;

    // ? Passkey Data
    PublicKey: string; // ? Base64 Encoded
    Transports: AuthenticatorTransportFuture[];

    // ? User Defined Data
    Name?: string;

    LastUsed?: Date;
    CreatedAt?: Date;
}

export const Passkeys_Model: mongoose.Model<IPasskey> =
    mongoose.models?.Passkeys ||
    mongoose.model<IPasskey>("Passkeys", Passkeys_Schema);
