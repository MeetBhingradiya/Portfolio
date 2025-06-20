import mongoose from "mongoose";
import { v4 } from "uuid";

enum DocumentType {
    MAINTENANCE = "maintenance"
}

const State_Schema: mongoose.Schema = new mongoose.Schema(
    {
        StateID: {
            type: String,
            default: v4,
            unique: true
        }
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

export interface IState extends mongoose.Document {
    StateID: string;
    Document: DocumentType;

    // ? Maintenance Document
    isMaintenance?: boolean;

    // Automatic Maintenance Options
    isAutoEnable?: boolean;
    EnableOptions?: {
        Date: `${number}${number}/${number}${number}/${number}${number}${number}${number}`;
        Time: `${number}${number}:${number}${number}`;
    };

    isAutoDisable?: boolean;
    DisableOption?: {
        Date: `${number}${number}/${number}${number}/${number}${number}${number}${number}`;
        Time: `${number}${number}:${number}${number}`;
    };
}

export const State_Model: mongoose.Model<IState> =
    mongoose.models?.State || mongoose.model<IState>("State", State_Schema);
