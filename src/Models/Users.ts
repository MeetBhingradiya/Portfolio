import mongoose from "mongoose";
import { v4 } from "uuid";
import { IGender } from "@Types/Gender";

const User_Schema: mongoose.Schema = new mongoose.Schema(
    {
        UserID: {
            type: String,
            default: v4,
            unique: true
        },
        Username: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        Emails: {
            type: [
                {
                    Email: String,
                    isVerified: Boolean,
                    isPrimary: Boolean
                }
            ]
        },
        PhoneNumbers: {
            type: [
                {
                    PhoneNumber: String,
                    isPrimary: Boolean,
                    isVerified: Boolean
                }
            ]
        },
        Credentials: {
            type: [
                {
                    Salt: String,
                    Secret: String,
                    Data: String,
                    Rounds: Number,
                    isActive: Boolean,
                    createdAt: {
                        type: Date,
                        default: Date.now
                    }
                }
            ]
        },
        Icon: {
            type: String
        },
        FirstName: {
            type: String
        },
        LastName: {
            type: String
        },
        DateOfBirth: {
            type: Date
        },
        Gender: {
            type: String,
            enum: {
                values: Object.values(IGender),
                message: "{VALUE} is not a valid gender"
            }
        },
        CustomGender: {
            type: String
        },
        isMFA: {
            type: Boolean,
            default: false
        },
        isSuspicousActivity: {
            type: Boolean,
            default: false
        },
        AuthenticatorApp: {
            type: {
                isEnabled: Boolean,
                Secret: String
            }
        },
        Priority: {
            type: String,
            enum: [
                "Passkey",
                "AuthenticatorApp",
                "Phone",
                "Email",
                "RecoveryCodes"
            ],
            default: "Email"
        },
        isAdmin: {
            type: Boolean,
            default: false
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
        },
        thirdPartyConnections: [
            {
                provider: {
                    type: String,
                    required: true,
                    enum: [
                        "google",
                        "github",
                        "microsoft",
                        "linkedin",
                        "facebook",
                        "instagram",
                        "discord"
                    ]
                },
                providerId: {
                    type: String,
                    required: true
                },
                email: {
                    type: String
                },
                username: {
                    type: String
                },
                accessToken: {
                    type: String,
                    required: true
                },
                refreshToken: {
                    type: String
                },
                connectedAt: {
                    type: Date,
                    default: Date.now
                },
                lastUsed: {
                    type: Date
                }
            }
        ],
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

export interface IUser extends mongoose.Document {
    // ? Unique Identifiers

    // ? Used for Sessions & Passkey Identification
    UserID: string;

    // ? Used for Login, Profile, Find Account Email
    Username: string;

    // ? Used for Account Recovery, Login and Verification
    Emails: Array<{
        Email: string;
        isVerified: boolean;
        isPrimary: boolean;
    }>;

    PhoneNumbers: Array<{
        PhoneNumber: string;
        isPrimary: boolean;
        isVerified: boolean;
    }>;

    // ? Access Credentials
    Credentials: Array<{
        Salt: string;
        Secret: string;
        Data: string;
        Rounds: number;
        isActive: boolean;
        createdAt: Date;
    }>;

    // ? Personal Information
    Icon: string;
    FirstName: string;
    LastName: string;
    DateOfBirth: Date;
    Gender: IGender;
    CustomGender: string;

    // ? Authentication Methods
    isMFA: boolean;
    isSuspicousActivity: boolean;

    // ? Authenticator App
    AuthenticatorApp: {
        isEnabled: boolean;
        Secret: string;
    };

    // ? Priority
    Priority:
        | "Passkey"
        | "AuthenticatorApp"
        | "Phone"
        | "Email"
        | "RecoveryCodes";
    // ? Admins & Security
    isAdmin: boolean;
    isLocked: boolean;
    isSuspended: boolean;
    isDeleted: boolean;

    // ? Third-party OAuth connections
    thirdPartyConnections?: Array<{
        provider:
            | "google"
            | "github"
            | "microsoft"
            | "linkedin"
            | "facebook"
            | "instagram"
            | "discord";
        providerId: string;
        email?: string;
        username?: string;
        accessToken: string;
        refreshToken?: string;
        connectedAt: Date;
        lastUsed?: Date;
    }>;

    //  ? Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export const Users_Model: mongoose.Model<IUser> =
    mongoose.models?.OLD_Users ||
    mongoose.model<IUser>("OLD_Users", User_Schema);
