import mongoose from "mongoose";
import { v4 } from "uuid";

const State_Schema: mongoose.Schema = new mongoose.Schema(
    {
        StateID: {
            type: String,
            default: "Site_Settings" + v4()
        },
        Analytics: {
            Vercel: {
                type: Boolean,
                default: false
            }
        },

        Debugging: {
            ReactScan: {
                type: Boolean,
                default: false
            }
        },

        Monitization: {
            GoogleADS: {
                type: Boolean,
                default: false
            }
        },

        Authentication: {
            Whitelisted_Email_Domains: {
                type: [String],
                default: []
            },
            Blocked_Threats: {
                type: [String],
                default: [
                    "TOR",
                    "VPN",
                    "ICloud-Relay",
                    "KnownAttacker",
                    "KnownAbuser",
                    "Threat",
                    "Bogon"
                ],
                enum: [
                    "TOR",
                    "VPN",
                    "ICloud-Relay",
                    "Proxy",
                    "Datacenter",
                    "Anonymous",
                    "KnownAttacker",
                    "KnownAbuser",
                    "Threat",
                    "Bogon"
                ]
            },
            Signup_Enabled: {
                type: Boolean,
                default: true
            },
            Signin_Enabled: {
                type: Boolean,
                default: true
            },
            Password_Strength: {
                Min_Length: { type: Number, default: 8 },
                Max_Length: { type: Number, default: 64 },
                Require_Uppercase: { type: Boolean, default: true },
                Require_Lowercase: { type: Boolean, default: true },
                Require_Numbers: { type: Boolean, default: true },
                Require_Special_Characters: { type: Boolean, default: true }
            }
        }
    },
    {
        timestamps: true,
        versionKey: "v1"
    }
);

export interface IState extends mongoose.Document {
    StateID: string;

    Analytics: {
        Vercel: boolean;
    };

    Debugging: {
        ReactScan: boolean;
    };

    Monitization: {
        GoogleADS: boolean;
    };

    Authentication: {
        // ? Prevent Spam Registrations
        Whitelisted_Email_Domains: string[];

        // ? Used to Block API Endpoints if any of these detected by IPData.co API
        Blocked_Threats: Array<
            | "TOR"
            | "VPN"
            | "ICloud-Relay"
            | "Proxy"
            | "Datacenter"
            | "Anonymous"
            | "KnownAttacker"
            | "KnownAbuser"
            | "Threat"
            | "Bogon"
        >;

        // ? Signup & SignIn Controls
        Signup_Enabled: boolean;
        Signin_Enabled: boolean;

        // ? Password Strengths
        Password_Strength: {
            Min_Length: number;
            Max_Length: number;
            Require_Uppercase: boolean;
            Require_Lowercase: boolean;
            Require_Numbers: boolean;
            Require_Special_Characters: boolean;
        };
    };

    createdAt: Date;
    updatedAt: Date;
}

export const State_Model: mongoose.Model<IState> =
    mongoose.models?.State || mongoose.model<IState>("State", State_Schema);
