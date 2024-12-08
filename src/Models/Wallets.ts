import { Schema, Document, model } from 'mongoose';
import { v4 } from 'uuid';
import { Currency } from '@Types/Currency';

const Wallets_Schema: Schema = new Schema({
    WalletID: {
        type: String,
        default: v4,
        unique: true
    },
    Balance: {
        type: Number,
        required: true
    },
    Currency: {
        type: String,
        enum: Object.values(Currency),
        default: Currency.INR
    },
    CreatorID: {
        type: String,
        required: true
    },
    OwnerID: {
        type: String,
        required: true
    },
    OrganizationID: {
        type: String,
    },
    Permissions: {
        DEBIT: {
            type: [String],
            default: []
        },
        CREDIT: {
            type: [String],
            default: []
        },
        REVERT: {
            type: [String],
            default: []
        },
        BAL_READ: {
            type: [String],
            default: []
        }
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface IWallets extends Document {
    WalletID: string

    // ? Wallets Balance its also can be 00.00
    Balance: number

    // ? Wallets Currency
    Currency: Currency

    // ? Linked with Organization
    OrganizationID: string

    Members: Array<{
        UserID: string
        PermissionID: string

        isCreator: boolean // ? READ ONLY
        isOwner: boolean
    }>

    Name: string
    Description: string

    isDeleted: boolean
    isLocked: boolean
}

export default model<IWallets>('Wallets', Wallets_Schema);