import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Sessions_Schema: mongoose.Schema = new mongoose.Schema({
    SessionID: {
        type: String,
        default: v4,
        unique: true,
        required: true,
        index: true
    },

    UserID: {
        type: String,
        required: true,
        index: true
    },

    isRevoked: {
        type: Boolean,
        default: false
    },
    
    // ? Decrypted Token from Local Storage & Cookies
    AccessToken: {
        type: String,
        required: true
    },

    UserAgent: {
        type: String,
        required: true
    },

    // ? Extracted from User Agent
    Platform: {
        type: String
    },
    Browser: {
        type: String
    },
    Model: {
        type: String
    },
    
    // ? Track Hackers or Debuggers
    UnknownRequestHeaders: {
        type: [Object]
    },
    DetectedExtensions: {
        type: [String]
    },
    
    // ? IP & Location Info By IPData.com
    IPDataMappedResponse: {
        type: Object
    },

    // ? Session Expiration
    ExpiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
}, {
    timestamps: true,
    versionKey: "v1",

    // ? ByDefault Saved for 60 Days to Track Sessions
    expireAfterSeconds: 60 * 60 * 24 * 60
});

export interface ISessions extends Document {
    SessionID: string
    UserID: string

    AccessToken: string

    UserAgent: string
    Platform: "Windows" | "Linux" | "Android" | "iOS" | "MacOS"
    Browser: "Chrome" | "Edge" | "Safari" | "Firefox" | "Opera" | "Arc" | "Unknown"
    Model: string

    isRevoked: boolean

    UnknownRequestHeaders: Array<{
        [key: string]: string
    }>
    DetectedExtensions: string[]

    IPDataMappedResponse: {
        IP: string

        // ? Region
        City: string
        Region: string
        RegionCode: string
        Country: string
        CountryCode: string
        Flag: string

        // ? Provider
        Company: {
            Name: string
            Domain: string
            Type: string
            Network: string
        }

        // ? Timezone
        Timezone: {
            name: string
            abbreviation: string
            gmt_offset: number
            current_time: string
            is_daylight_saving: boolean
        }
        
        // ? Maplocation
        Latitude: number
        Longitude: number
    }

    // ? Expiry
    ExpiresAt: Date
}

export const Sessions_Model: mongoose.Model<ISessions> = mongoose.models?.Sessions || mongoose.model<ISessions>("Sessions", Sessions_Schema);