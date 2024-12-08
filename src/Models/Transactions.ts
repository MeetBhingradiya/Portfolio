import { Schema, Document, model } from 'mongoose';
import { v4 } from 'uuid';
import { Currency } from '@Types/Currency';
import { Status } from '@Types/Transactions';

const Transactions_Schema: Schema = new Schema({
    TransactionID: {
        type: String,
        default: v4,
        unique: true
    },
    FromWalletID: {
        type: String,
        required: true
    },
    ToWalletID: {
        type: String,
    },
    Amount: {
        type: Number,
        required: true
    },
    Currency: {
        type: String,
        enum: Object.values(Currency),
        default: Currency.INR
    },
    Description: {
        type: String,
        required: true
    },
    Type: {
        type: String,
        required: true,
        enum: ['DEBIT', 'CREDIT', 'REVERT']
    },
    Status: {
        type: String,
        required: true,
        enum: Status
    },
    ReferenceID: {
        type: String,
        required: true
    },
    Category: {
        type: String,
    },
    UserID: {
        type: String,
        required: true
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface ITransactions extends Document {
    TransactionID: string;

    // ? Date of the transaction [Auto Generated if not provided]
    Date: Date;

    // ? Time of the transaction [Auto Generated if not provided]
    Time: string;

    // ? From wich Wallet the transaction is made
    FromWalletID: string;

    // ? To wich Wallet the transaction is made [Optional]
    ToWalletID: string;

    // ? Amount of the transaction
    Amount: number;

    // ? Currency of the transaction
    Currency: Currency;

    // ? Transaction Description
    Description: string;

    // ? Transaction Type
    Type: 'DEBIT' | 'CREDIT' | 'REVERT';

    // ? Transaction Status
    Status: 'PENDING' | 'COMPLETED' | 'FAILED';

    // ? Transaction Reference [TransactionID]
    ReferenceID: string;

    // ? Transaction Charges [Optional]
    // Charges: number;

    // ? Transaction Category [Optional] Todo: Enum heare for the categories
    Category: string;

    // ? Made the transaction by the User
    UserID: string;

    // ? Hide Transaction
    isArchived: boolean;
}

export default model<ITransactions>('Transactions', Transactions_Schema);