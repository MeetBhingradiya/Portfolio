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

export {
    Status
}