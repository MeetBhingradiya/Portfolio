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
    Maintenance: {
        Global: {
            type: Boolean,
            default: false
        },
        Partial: {
            type: Boolean,
            default: false
        },
        Endpoints: {
            type: Array<String>,
            default: []
        },
        Message: {
            type: String,
            default: ""
        }
    },
    CommingSoon: {
        Global: {
            type: Boolean,
            default: false
        },
        Partial: {
            type: Boolean,
            default: false
        },
        Endpoints: {
            type: Array<String>,
            default: []
        },
        Message: {
            type: String,
            default: ""
        }
    },
    Homepage: {
        Links: {
            type: Array<{
                Title: string
                URL: string
                Icon?: string
                isShown: boolean
            }>,
            default: []
        }
    },
    Authentication: {
        CookieDuration: {
            type: Number,
            // ? 7 days
            default: 604800
        },
        MaxUserProfiles: {
            type: Number,
            default: 5
        },
        saltRounds: {
            type: Number,
            default: 10
        },
        saltFormat: {
            type: String,
            default: "#SALT@TOKEN#SALT"
        },
        AllowSignup: {
            type: Boolean,
            default: true
        },
        AllowLogin: {
            type: Boolean,
            default: true
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
    StateID: string
    Maintenance?: {
        Global?: boolean
        Partial?: boolean
        Endpoints?: Array<string>
        Message?: string
    }
    CommingSoon?: {
        Global?: boolean
        Partial?: boolean
        Endpoints?: Array<string>
        Message?: string
    }
    Homepage: {
        Links: Array<{
            Title: string
            URL: string
            Icon?: string
            isShown: boolean
        }>
    }
    Authentication: {
        CookieDuration: number
        MaxUserProfiles: number
        saltRounds: number
        saltFormat: string
        AllowSignup: boolean
        AllowLogin: boolean
    }
    Notifications: Array<{
        icon?: string
        description?: string
        message: string
        type: "error" | "warning" | "info" | "success"
        visibleAt: Date
        VisibleTill?: Date
    }>;
}

export default model<IState>('State', StateSchema);