import { Schema, Document, model } from 'mongoose';

const StateSchema: Schema = new Schema({
    StateID: {
        type: String,
        required: true,
        unique: true,
        enum: [
            "Site@Active#State"
        ]
    },
    Settings: {
        isMaintenance: {
            type: Boolean,
            default: false
        },
        isCommingSoon: {
            type: Boolean,
            default: false
        }
    },
    Notifications: {
        type: Array<{
            icon?: string,
            description?: string,
            message: string,
            type: "error" | "warning" | "info" | "success"
            visibleAt: Date
            VisibleTill?: Date
        }>,
        default: []
    }
}, {
    timestamps: true,
    versionKey: true
});

export interface IState extends Document {
    StateID: string;
    Settings: {
        isMaintenance: boolean;
        isCommingSoon: boolean;
    };
    Notifications: Array<{
        icon?: string;
        description?: string;
        message: string;
        type: "error" | "warning" | "info" | "success";
        visibleAt: Date;
        VisibleTill?: Date;
    }>;
}

export default model<IState>('State', StateSchema);