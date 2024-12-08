import { Schema, Document, model } from 'mongoose';
import { v4 } from 'uuid';

const User_Schema: Schema = new Schema({
    UserID: {
        type: String,
        default: v4,
        unique: true
    },
    Emails: {
        type: Array<{
            Email: string
            isVerified: boolean
            isPrimary: boolean
            isStudent: boolean
            isNominated: boolean
        }>,
        default: []
    },
    PhoneNumbers: {
        type: Array<{
            PhoneNumber: string
            isPrimary: boolean
            isVerified: boolean
        }>,
        default: []
    },
    Salt: {
        type: String,
        required: true
    },
    HashKey: {
        type: String,
        required: true
    },
    Username: {
        type: String,
    },
    Icon: {
        type: String,
        default: null
    },
    FirstName: {
        type: String,
        required: true
    },
    LastName: {
        type: String,
        required: true
    },
    DateOfBirth: {
        type: Date,
        required: true
    },
    Permissions: {
        type: Array<String>,
        default: []
    },
    isMultiFactorAuthEnabled: {
        type: Boolean,
        default: false
    },
    AuthenticatorApp: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        Secret: {
            type: String,
            default: null
        }
    },
    Passkey: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        Passkey: {
            type: String,
            default: null
        }
    },
    Priority: {
        type: Array<String>,
        enum: [
            "Passkey",
            "AuthenticatorApp",
            "Phone",
            "Email"
        ],
        default: [
            "Email",
            "Phone",
            "Passkey",
            "AuthenticatorApp",
        ]
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface IUser extends Document {
    UserID: string;
    Emails: Array<{
        Email: string

        // ? Email Status
        isVerified: boolean

        // ? Email Settings
        isPrimary: boolean
        isStudent: boolean
        isNominated: boolean
    }>
    PhoneNumbers: Array<{
        PhoneNumber: string
        isPrimary: boolean
        isVerified: boolean
    }>

    // ? Credentials
    Salt: string
    HashKey: string

    // ? Personal Information
    Username: string
    Icon: string
    FirstName: string
    LastName: string
    DateOfBirth: Date

    // ? Profile Permissions
    Permissions: Array<string>

    // ? Authentication Methods
    isMultiFactorAuthEnabled: boolean

    // ? Authenticator App
    AuthenticatorApp: {
        isEnabled: boolean
        Secret: string
    }

    // ? Passkey
    Passkey: {
        isEnabled: boolean
        Passkey: string
    }

    // ? Priority
    Priority: "Passkey" | "AuthenticatorApp" | "Phone"

    // ? Admins & Security
    isLocked: boolean
    isSuspended: boolean
    isDeleted: boolean
}

export default model<IUser>('Users', User_Schema);