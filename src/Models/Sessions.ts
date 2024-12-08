import { Schema, Document, model } from 'mongoose';
import { v4 } from 'uuid';

const Session_Schema: Schema = new Schema({
    SessionID: {
        type: String,
        default: v4,
        unique: true
    },
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface ISessions extends Document {
    SessionID: string;
    IPv4: string
    IPv6: string
    NativeIP: string
    IPProvider: string
    UserAgent: string
    Extensions: string[]
    OS: "Windows" | "Mac" | "Linux" | "Android" | "iOS" | "Huawei"
    Browser?: "Chrome" | "Edge"
    JWTTokenHash: string
    JWTTokenSalt: string
}

export default model<ISessions>('Sessions', Session_Schema);