import mongoose from "mongoose";
import { v4 } from "uuid";

// Enhanced User Schema with better structure
const User_Schema = new mongoose.Schema(
    {
        UserID: {
            type: String,
            default: v4,
            unique: true,
            index: true
        },
        
        // Basic Profile Information
        profile: {
            firstName: {
                type: String,
                trim: true
            },
            lastName: {
                type: String,
                trim: true
            },
            displayName: {
                type: String,
                required: true,
                trim: true
            },
            username: {
                type: String,
                unique: true,
                sparse: true,
                trim: true,
                lowercase: true
            },
            bio: {
                type: String,
                maxlength: 500
            },
            avatar: {
                type: String
            },
            website: {
                type: String
            },
            location: {
                type: String
            },
            dateOfBirth: {
                type: Date
            }
        },

        // Account Information
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        emailVerified: {
            type: Date
        },
        
        // Authentication
        password: {
            type: String,
            required: function (this: any) {
                return !this.connectedAccounts?.length;
            }
        },
        
        // Connected OAuth Accounts
        connectedAccounts: [{
            provider: {
                type: String,
                required: true,
                enum: [
                    "google", "github", "discord", "apple", "facebook", 
                    "linkedin", "microsoft", "instagram", "twitter", 
                    "spotify", "reddit", "gitlab"
                ]
            },
            providerAccountId: {
                type: String,
                required: true
            },
            accessToken: {
                type: String
            },
            refreshToken: {
                type: String
            },
            expiresAt: {
                type: Date
            },
            scope: {
                type: String
            },
            email: {
                type: String
            },
            name: {
                type: String
            },
            image: {
                type: String
            },
            connectedAt: {
                type: Date,
                default: Date.now
            },
            lastUsed: {
                type: Date,
                default: Date.now
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],

        // Account Status & Permissions
        role: {
            type: String,
            enum: ["user", "admin", "moderator", "premium"],
            default: "user"
        },
        accountType: {
            type: String,
            enum: ["personal", "business", "developer"],
            default: "personal"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        isSuspended: {
            type: Boolean,
            default: false
        },
        
        // Security & MFA
        security: {
            isMFAEnabled: {
                type: Boolean,
                default: false
            },
            mfaSecret: {
                type: String
            },
            backupCodes: {
                type: [{
                    code: String,
                    used: Boolean,
                    usedAt: Date
                }],
                select: false  // Exclude from queries by default
            },
            lastPasswordChange: {
                type: Date
            },
            loginAttempts: {
                type: Number,
                default: 0
            },
            lockUntil: {
                type: Date
            }
        },

        // Preferences
        preferences: {
            theme: {
                type: String,
                enum: ["light", "dark", "system"],
                default: "system"
            },
            language: {
                type: String,
                default: "en"
            },
            timezone: {
                type: String,
                default: "UTC"
            },
            notifications: {
                email: {
                    type: Boolean,
                    default: true
                },
                push: {
                    type: Boolean,
                    default: true
                },
                marketing: {
                    type: Boolean,
                    default: false
                }
            }
        },

        // Activity Tracking
        lastLoginAt: {
            type: Date
        },
        lastActiveAt: {
            type: Date,
            default: Date.now
        },
        loginCount: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function(doc, ret) {
                // Remove sensitive fields from JSON output
                delete ret.password;
                if (ret.security) {
                    delete ret.security.mfaSecret;
                    // backupCodes are excluded in schema definition
                }
                if (ret.connectedAccounts) {
                    ret.connectedAccounts.forEach((account: any) => {
                        delete account.accessToken;
                        delete account.refreshToken;
                    });
                }
                return ret;
            }
        }
    }
);

// Indexes for better performance
User_Schema.index({ "connectedAccounts.provider": 1, "connectedAccounts.providerAccountId": 1 });
User_Schema.index({ createdAt: 1 });
User_Schema.index({ lastActiveAt: 1 });

// Virtual for full name
User_Schema.virtual('profile.fullName').get(function() {
    if (this.profile?.firstName && this.profile?.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.profile?.displayName || this.email.split('@')[0];
});

// Method to check if account is locked
User_Schema.methods.isLocked = function() {
    return !!(this.security?.lockUntil && this.security.lockUntil > Date.now());
};

// Method to increment login attempts
User_Schema.methods.incLoginAttempts = function() {
    if (this.security?.lockUntil && this.security.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 }
        });
    }
    
    const updates: any = { $inc: { 'security.loginAttempts': 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours

    if ((this.security?.loginAttempts || 0) + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = { 'security.lockUntil': Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Method to add connected account
User_Schema.methods.addConnectedAccount = function(accountData: any) {
    const existingAccount = this.connectedAccounts?.find(
        (account: any) => account.provider === accountData.provider
    );
    
    if (existingAccount) {
        existingAccount.set(accountData);
        existingAccount.lastUsed = new Date();
    } else {
        this.connectedAccounts = this.connectedAccounts || [];
        this.connectedAccounts.push({
            ...accountData,
            connectedAt: new Date(),
            lastUsed: new Date(),
            isActive: true
        });
    }
    
    return this.save();
};

// Method to remove connected account
User_Schema.methods.removeConnectedAccount = function(provider: string) {
    if (this.connectedAccounts) {
        this.connectedAccounts = this.connectedAccounts.filter(
            (account: any) => account.provider !== provider
        );
    }
    return this.save();
};

interface IConnectedAccount {
    provider: string;
    providerAccountId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
    email?: string;
    name?: string;
    image?: string;
    connectedAt: Date;
    lastUsed: Date;
    isActive: boolean;
}

interface IUser extends mongoose.Document {
    UserID: string;
    profile?: {
        firstName?: string;
        lastName?: string;
        displayName: string;
        username?: string;
        bio?: string;
        avatar?: string;
        website?: string;
        location?: string;
        dateOfBirth?: Date;
        fullName?: string; // virtual
    };
    email: string;
    emailVerified?: Date;
    password?: string;
    connectedAccounts?: IConnectedAccount[];
    role: "user" | "admin" | "moderator" | "premium";
    accountType: "personal" | "business" | "developer";
    isActive: boolean;
    isEmailVerified: boolean;
    isSuspended: boolean;
    security?: {
        isMFAEnabled: boolean;
        mfaSecret?: string;
        backupCodes?: Array<{
            code: string;
            used: boolean;
            usedAt?: Date;
        }>;
        lastPasswordChange?: Date;
        loginAttempts: number;
        lockUntil?: Date;
    };
    preferences?: {
        theme: "light" | "dark" | "system";
        language: string;
        timezone: string;
        notifications: {
            email: boolean;
            push: boolean;
            marketing: boolean;
        };
    };
    lastLoginAt?: Date;
    lastActiveAt: Date;
    loginCount: number;
    createdAt: Date;
    updatedAt: Date;
    
    // Methods
    isLocked(): boolean;
    incLoginAttempts(): Promise<any>;
    addConnectedAccount(accountData: any): Promise<IUser>;
    removeConnectedAccount(provider: string): Promise<IUser>;
}

// Prevent recompilation during development
export const Users_Model: mongoose.Model<IUser> =
    mongoose.models?.EnhancedUsers ||
    mongoose.model<IUser>("EnhancedUsers", User_Schema);

export type { IUser, IConnectedAccount };
export default Users_Model;
