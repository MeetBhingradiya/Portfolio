/**
 *  @file        Models\Transactions.ts
 *  @description No description available for Models\Transactions.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
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