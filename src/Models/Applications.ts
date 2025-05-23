import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Applications_Schema: mongoose.Schema = new mongoose.Schema({
    ApplicationID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IApplications extends mongoose.Document {
    // ? Machine Readable Identifier
    ApplicationID: string

    // ? Human Readable Identifier
    Icon?: string
    Name?: string
    Description?: string

    // ? Client Details
    Company_Name?: string
    Company_Logo?: string
    Company_Description?: string
    Company_Website?: string
    Company_Phone?: string
    Company_Email?: string
    Company_Location?: string
    Company_Social?: {
        [key: string]: string
    }
    Company_GST?: string
    Company_Owner_Name?: string
    Company_Owner_PAN?: string
    Company_Owner_Addhar?: string

    // ? Server & Client Signatures
    Services?: Array<{
        ClientType: "Client" | "Server" | "Database"
        Signature: string
        enabled: boolean
        Note?: string


        // ? Suspend & Resume Temporary Access
        Suspend?: {
            Start: Date
            End: Date
        }
        Resume?: {
            Start: Date
            End: Date
        }
    }>

    // ? Biling & Payment Details
    ApplicationTYPE: "Preperatory" | "Subscription"
    PaymentType: "OneTime" | "Monthly" | "Yearly"
    PaymentMethod: "UPI" | "Card" | "NetBanking" | "Wallet" | "Cash" | "Cheque" | "BankTransfer"

    // ? Developer Backdoor Protection
    DeveloperAccess?: {
        Enabled: boolean
        SecretKey?: string
        EmergencyToken?: string
        IPWhitelist?: string[]
        AccessLogs?: Array<{
            Timestamp: Date
            IP: string
            Action: string
            Success: boolean
        }>
        RateLimit?: {
            MaxAttempts: number
            TimeWindowMinutes: number
            BlockDurationMinutes?: number
        }
        TwoFactorAuth?: {
            Required: boolean
            Method: "Email" | "SMS" | "Authenticator"
            BackupCodes?: string[]
        }
        Permissions?: {
            CanModifyData: boolean
            CanAccessDatabase: boolean
            CanManageUsers: boolean
            CanModifySettings: boolean
        }
        ExpiryDate?: Date
        LastLogin?: Date
    }
    
    // ? Emergency Shutdown
    EmergencyControls?: {
        ShutdownEnabled: boolean
        ShutdownReason?: string
        ShutdownDate?: Date
        RestartKey?: string
        NotificationContacts?: string[]
        AutomaticRecovery?: boolean
        MaintenanceMode?: {
            Active: boolean
            Message?: string
            EstimatedEndTime?: Date
        }
    }
}

export const Applications_Model: mongoose.Model<IApplications> = mongoose.models?.BlogsContents || mongoose.model<IApplications>("Applications", Applications_Schema);