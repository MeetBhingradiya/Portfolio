/**
 *  @FileID          Models\Transactions.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


import mongoose from 'mongoose';
import { v4 } from 'uuid';
import { Currency } from '@Types/Currency';

enum Status {
    // ? on Transaction Creation
    PENDING = "PENDING",

    // ? on Transaction Completion & Approval of Owner only not Creator of the FromWallet
    COMPLETED = "COMPLETED",

    // ? on Transaction Failure when the transaction is not completed
    FAILED = "FAILED",

    // ? on Transaction Decline by the Owner of the Wallet [Only for DEBIT Transactions]
    DECLINED = "DECLINED"
}

enum TransactionType {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT",
    REVERT = "REVERT"
}

const Transactions_Schema: mongoose.Schema = new mongoose.Schema({
    TransactionID: {
        type: String,
        default: v4,
        unique: true
    },
    Date: {
        type: Date,
        default: Date.now
    },
    Time: {
        type: String,
        default: new Date().toLocaleTimeString()
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
        default: Currency.INR
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
    },
    Type: {
        type: String,
        enum: [TransactionType.DEBIT, TransactionType.CREDIT, TransactionType.REVERT],
        default: TransactionType.DEBIT
    },
    Status: {
        type: String,
        enum: [Status.PENDING, Status.COMPLETED, Status.FAILED, Status.DECLINED],
        default: Status.PENDING
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
    versionKey: "v1"
});

export interface ITransactions extends mongoose.Document {
    TransactionID: string;

    // ? Date of the transaction [Auto Generated if not provided]
    Date?: Date;

    // ? Time of the transaction [Auto Generated if not provided]
    Time?: string;

    // ? From wich Wallet the transaction is made
    FromWalletID: string;

    // ? To wich Wallet the transaction is made [Optional]
    ToWalletID?: string;

    // ? Amount of the transaction
    Amount: number;

    // ? Currency of the transaction Default: INR
    Currency?: Currency;

    // ? Transaction Notes
    Name: string;
    Description?: string;

    // ? Transaction Type
    Type: TransactionType;

    // ? Transaction Status By Default: PENDING
    Status?: Status;

    // ? Transaction Reference [TransactionID]
    ReferenceID: string;

    // ? Transaction Charges [Optional]
    // Charges?: number;

    // ? Transaction Category [Optional] Todo: Enum heare for the categories
    Category?: string;

    // ? Made the transaction by the User
    UserID: string;

    // ? Hide Transaction
    isArchived: boolean;
}

export const Transactions_Model: mongoose.Model<ITransactions> = mongoose.models?.Transactions || mongoose.model<ITransactions>("Transactions", Transactions_Schema);