import mongoose from 'mongoose';
import { v4 } from 'uuid';
import { Currency } from '@Types/Currency';

enum Permissions {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT",
    REVERT = "REVERT",
    BAL_READ = "BAL_READ"
}

enum Privacy {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    SHARED = "SHARED"
}

const Wallets_Schema: mongoose.Schema = new mongoose.Schema({
    WalletID: {
        type: String,
        default: v4,
        unique: true
    },
    Balance: {
        type: Number,
        default: 0.00
    },
    LinkedWalletID: {
        type: String,
    },
    Ownership: {
        type: String,
        enum: ["PERSONAL", "ORGANIZATION"],
        default: "PERSONAL"
    },
    OrganizationID: {
        type: String,
    },
    Members: [{
        UserID: {
            type: String,
            required: true
        },
        Permissions: {
            type: [String],
            default: [
                Permissions.DEBIT,
                Permissions.CREDIT,
                Permissions.REVERT,
                Permissions.BAL_READ
            ]
        },
        isCreator: {
            type: Boolean,
            default: false
        },
        isOwner: {
            type: Boolean,
            default: false
        },
        isRemoved: {
            type: Boolean,
            default: false
        }
    }],
    Name: {
        type: String,
        required: true
    },
    Currency: {
        type: String,
        default: "INR"
    },
    Description: {
        type: String,
    },
    Type: {
        type: String,
        enum: ["WALLET", "BANK", "UPI"],
        default: "WALLET"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    Privacy: {
        type: String,
        enum: ["PUBLIC", "PRIVATE", "SHARED"],
        default: "PRIVATE"
    },
    MinimumBalance: {
        type: Number,
        default: 0.00
    }
}, {
    timestamps: true,
    versionKey: "v1",
});

export interface IWallets extends mongoose.Document {
    WalletID: string

    // ? Bank Wallet ID only for UPI Wallets
    LinkedWalletID?: string

    // ? Wallets Balance its also can be 00.00
    Balance: number

    // ? Linked with Organization
    Ownership: "PERSONAL" | "ORGANIZATION"
    OrganizationID?: string

    Members: Array<{
        // ? User Identifier
        UserID: string

        // ? Current User Permissions
        Permissions: Array<Permissions> // @Modifiable

        // ? Who Created Wallet
        isCreator: boolean

        // ? Current Owner of Wallet
        isOwner: boolean // @Modifiable

        // ? When User is Removed from Wallet
        isRemoved?: boolean // @Modifiable
    }>
    
    // ? Wallet Information
    Name: string // @Modifiable
    Currency: Currency // @Default INR
    Description: string // @Modifiable
    Type: "WALLET" | "BANK" | "UPI" // @Default WALLET
    
    // ? Wallets Settings
    isDeleted: boolean
    isLocked: boolean
    Privacy: Privacy

    // ? Required for Banks
    MinimumBalance?: number // @Default 0.00
}

export const Wallets_Model: mongoose.Model<IWallets> = mongoose.models?.Wallets || mongoose.model<IWallets>("Wallets", Wallets_Schema);