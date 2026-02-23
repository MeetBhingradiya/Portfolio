import mongoose from "mongoose";
import { v4 } from "uuid";
import PasswordManagers from "password-managers" with { type: "json" };

/**
 * Blocked authenticator AAGUIDs for passkey registration.
 * Password managers like 1Password are blocked because we prefer platform authenticators.
 * 
 * @constant BLOCKED_AUTHENTICATOR_AAGUIDS
 * @see {@link https://github.com/agektmr/passkey-authenticator-aaguids|Passkey Authenticator AAGUIDs}
 */
const BLOCKED_AUTHENTICATOR_AAGUIDS = {
    // 1Password - Block all variants because we hate Apple 😂
    ONEPASSWORD: [
        'b84e4048-15dc-4dd0-8640-f4f60813c8af', // 1Password
        '66a0ccb3-bd6a-4eba-8b13-04ad43d0dc00', // 1Password for iOS
        '00000000-0000-0000-0000-000000000000', // Generic 1Password
    ],
    // Bitwarden - Third-party password manager
    BITWARDEN: [
        'adce0002-35bc-c60a-648b-0b25f1f05503', // Bitwarden
        'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4', // Bitwarden Mobile
    ],
    // LastPass - Third-party password manager  
    LASTPASS: [
        '00000000-0000-0000-0000-000000000001', // LastPass
    ],
    // Dashlane - Third-party password manager
    DASHLANE: [
        '00000000-0000-0000-0000-000000000002', // Dashlane
    ],
    // Keeper - Third-party password manager
    KEEPER: [
        '0ea242b4-43c4-4a1b-8b17-dd6d0b6baec6', // Keeper
    ],
    // NordPass - Third-party password manager
    NORDPASS: [
        'f3809540-7f14-49c1-a8b3-8f813b225541', // NordPass (Enpass)
    ]
};

/**
 * Flattened array of all blocked AAGUIDs.
 */
const ALL_BLOCKED_AAGUIDS = [
    ...BLOCKED_AUTHENTICATOR_AAGUIDS.ONEPASSWORD,
    ...BLOCKED_AUTHENTICATOR_AAGUIDS.BITWARDEN,
    ...BLOCKED_AUTHENTICATOR_AAGUIDS.LASTPASS,
    ...BLOCKED_AUTHENTICATOR_AAGUIDS.DASHLANE,
    ...BLOCKED_AUTHENTICATOR_AAGUIDS.KEEPER,
    ...BLOCKED_AUTHENTICATOR_AAGUIDS.NORDPASS
];

/**
 * Authenticator database with AAGUIDs, names, and icon URIs.
 * Dynamically loaded from the password-managers package.
 * Source: https://github.com/agektmr/passkey-authenticator-aaguids
 */
const AUTHENTICATOR_DATABASE: Record<string, { name: string; icon_dark?: string; icon_light?: string }> = PasswordManagers as any;

/**
 * Enhanced User Schema with comprehensive authentication and security features.
 * Supports multiple emails, phone numbers, passkeys (WebAuthn), authenticator apps (TOTP),
 * and OAuth provider connections.
 * 
 * @schema User_Schema
 * @collection Users
 */
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

        // Primary Email (backward compatibility)
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

        // Multiple Emails Support
        emails: [{
            address: {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            },
            isPrimary: {
                type: Boolean,
                default: false
            },
            isVerified: {
                type: Boolean,
                default: false
            },
            verifiedAt: {
                type: Date
            },
            addedAt: {
                type: Date,
                default: Date.now
            },
            label: {
                type: String,
                enum: ["personal", "work", "other"],
                default: "personal"
            }
        }],

        // Multiple Phone Numbers Support
        phoneNumbers: [{
            number: {
                type: String,
                required: true,
                trim: true
            },
            countryCode: {
                type: String,
                required: true
            },
            isPrimary: {
                type: Boolean,
                default: false
            },
            isVerified: {
                type: Boolean,
                default: false
            },
            verifiedAt: {
                type: Date
            },
            addedAt: {
                type: Date,
                default: Date.now
            },
            label: {
                type: String,
                enum: ["mobile", "home", "work", "other"],
                default: "mobile"
            }
        }],

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
        isAdmin: {
            type: Boolean,
            default: false
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

        // Passkeys (WebAuthn)
        passkeys: [{
            credentialId: {
                type: String,
                required: true,
                unique: true
            },
            publicKey: {
                type: String,
                required: true
            },
            counter: {
                type: Number,
                default: 0
            },
            deviceName: {
                type: String,
                trim: true
            },
            deviceType: {
                type: String,
                enum: ["platform", "cross-platform"],
                default: "platform"
            },
            transports: {
                type: [String],
                enum: ["usb", "nfc", "ble", "internal", "hybrid"]
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            lastUsedAt: {
                type: Date
            },
            aaguid: {
                type: String
            },
            authenticatorName: {
                type: String,
                trim: true
            },
            authenticatorIcon: {
                type: String
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],

        // Security & MFA
        security: {
            isMFAEnabled: {
                type: Boolean,
                default: false
            },
            mfaSecret: {
                type: String,
                select: false
            },
            // Authenticator Apps (TOTP)
            authenticatorApps: [{
                id: {
                    type: String,
                    required: true,
                    default: v4
                },
                name: {
                    type: String,
                    required: true,
                    trim: true
                },
                secret: {
                    type: String,
                    required: true,
                    select: false
                },
                algorithm: {
                    type: String,
                    enum: ["SHA1", "SHA256", "SHA512"],
                    default: "SHA1"
                },
                digits: {
                    type: Number,
                    enum: [6, 8],
                    default: 6
                },
                period: {
                    type: Number,
                    default: 30
                },
                isActive: {
                    type: Boolean,
                    default: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                },
                lastUsedAt: {
                    type: Date
                }
            }],
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
            passwordHistory: {
                type: [{
                    hash: {
                        type: String,
                        required: true
                    },
                    changedAt: {
                        type: Date,
                        default: Date.now
                    }
                }],
                select: false,
                default: []
            },
            loginAttempts: {
                type: Number,
                default: 0
            },
            lockUntil: {
                type: Date
            },
            // Track active MFA methods
            activeMFAMethods: {
                type: [String],
                enum: ["totp", "sms", "email", "passkey", "authenticator"],
                default: []
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
            transform: function (doc, ret) {
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

/**
 * Database indexes for optimized query performance.
 * - Composite index on OAuth provider accounts for fast lookups
 * - Individual indexes on emails and phone numbers for authentication
 * - Unique sparse index on passkey credentials for WebAuthn
 * - Temporal indexes for sorting and filtering by date
 */
User_Schema.index({ "connectedAccounts.provider": 1, "connectedAccounts.providerAccountId": 1 });
User_Schema.index({ "emails.address": 1 });
User_Schema.index({ "phoneNumbers.number": 1 });
User_Schema.index({ "passkeys.credentialId": 1 }, { unique: true, sparse: true });
User_Schema.index({ createdAt: 1 });
User_Schema.index({ lastActiveAt: 1 });

/**
 * Virtual property that constructs the user's full name.
 * Returns firstName + lastName if both exist, otherwise falls back to displayName or email prefix.
 * 
 * @virtual
 * @returns {string} The user's full name
 */
User_Schema.virtual('profile.fullName').get(function () {
    if (this.profile?.firstName && this.profile?.lastName) {
        return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.profile?.displayName || this.email.split('@')[0];
});

/**
 * Checks if the user account is currently locked due to failed login attempts.
 * 
 * @method isLocked
 * @returns {boolean} True if account is locked and lock period hasn't expired, false otherwise
 * @example
 * if (user.isLocked()) {
 *   throw new Error('Account is temporarily locked');
 * }
 */
User_Schema.methods.isLocked = function () {
    return !!(this.security?.lockUntil && this.security.lockUntil > Date.now());
};

/**
 * Increments failed login attempts and locks account after reaching threshold.
 * Automatically unlocks and resets counter if lock period has expired.
 * 
 * @method incLoginAttempts
 * @returns {Promise<any>} Promise resolving to update operation result
 * @throws {Error} If database update fails
 * @example
 * await user.incLoginAttempts();
 * 
 * @remarks
 * - Maximum attempts: 3
 * - Lock duration: 2 hours
 * - Auto-resets after lock expiration
 */
User_Schema.methods.incLoginAttempts = function () {
    if (this.security?.lockUntil && this.security.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 }
        });
    }

    const updates: any = { $inc: { 'security.loginAttempts': 1 } };
    const maxAttempts = 3;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours

    if ((this.security?.loginAttempts || 0) + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = { 'security.lockUntil': Date.now() + lockTime };
    }

    return this.updateOne(updates);
};

/**
 * Adds or updates an OAuth provider account connection.
 * If the provider already exists, updates the existing connection; otherwise creates new.
 * 
 * @method addConnectedAccount
 * @param {Object} accountData - OAuth account information
 * @param {string} accountData.provider - OAuth provider name (google, github, etc.)
 * @param {string} accountData.providerAccountId - Unique account ID from provider
 * @param {string} [accountData.accessToken] - OAuth access token
 * @param {string} [accountData.refreshToken] - OAuth refresh token
 * @param {Date} [accountData.expiresAt] - Token expiration date
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.addConnectedAccount({
 *   provider: 'google',
 *   providerAccountId: '123456789',
 *   accessToken: 'ya29.a0...',
 *   email: 'user@gmail.com'
 * });
 */
User_Schema.methods.addConnectedAccount = function (accountData: any) {
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

/**
 * Removes an OAuth provider account connection from the user.
 * 
 * @method removeConnectedAccount
 * @param {string} provider - OAuth provider name to disconnect
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.removeConnectedAccount('github');
 */
User_Schema.methods.removeConnectedAccount = function (provider: string) {
    if (this.connectedAccounts) {
        this.connectedAccounts = this.connectedAccounts.filter(
            (account: any) => account.provider !== provider
        );
    }
    return this.save();
};

/**
 * Adds a new email address to the user's account.
 * Automatically handles primary email designation by unsetting other primary flags.
 * 
 * @method addEmail
 * @param {Object} emailData - Email information
 * @param {string} emailData.address - Email address to add
 * @param {string} [emailData.label='personal'] - Email category (personal, work, other)
 * @param {boolean} [emailData.isPrimary=false] - Whether this should be the primary email
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @throws {Error} If email already exists for this user
 * @example
 * await user.addEmail({
 *   address: 'work@company.com',
 *   label: 'work',
 *   isPrimary: false
 * });
 */
User_Schema.methods.addEmail = function (emailData: { address: string; label?: string; isPrimary?: boolean }) {
    const existingEmail = this.emails?.find(
        (email: any) => email.address === emailData.address.toLowerCase()
    );

    if (existingEmail) {
        throw new Error('Email already exists');
    }

    this.emails = this.emails || [];

    // If setting as primary, unset other primary emails
    if (emailData.isPrimary) {
        this.emails.forEach((email: any) => {
            email.isPrimary = false;
        });
    }

    this.emails.push({
        address: emailData.address.toLowerCase(),
        label: emailData.label || 'personal',
        isPrimary: emailData.isPrimary || false,
        isVerified: false,
        addedAt: new Date()
    });

    return this.save();
};

/**
 * Marks an email address as verified and records verification timestamp.
 * 
 * @method verifyEmail
 * @param {string} emailAddress - Email address to verify
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.verifyEmail('user@example.com');
 */
User_Schema.methods.verifyEmail = function (emailAddress: string) {
    const email = this.emails?.find((e: any) => e.address === emailAddress.toLowerCase());
    if (email) {
        email.isVerified = true;
        email.verifiedAt = new Date();
    }
    return this.save();
};

/**
 * Removes an email address from the user's account.
 * 
 * @method removeEmail
 * @param {string} emailAddress - Email address to remove
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.removeEmail('old@example.com');
 */
User_Schema.methods.removeEmail = function (emailAddress: string) {
    if (this.emails) {
        this.emails = this.emails.filter(
            (email: any) => email.address !== emailAddress.toLowerCase()
        );
    }
    return this.save();
};

/**
 * Adds a new phone number to the user's account.
 * Automatically handles primary phone designation by unsetting other primary flags.
 * 
 * @method addPhoneNumber
 * @param {Object} phoneData - Phone number information
 * @param {string} phoneData.number - Phone number without country code
 * @param {string} phoneData.countryCode - Country code (e.g., '+1', '+44')
 * @param {string} [phoneData.label='mobile'] - Phone category (mobile, home, work, other)
 * @param {boolean} [phoneData.isPrimary=false] - Whether this should be the primary phone
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @throws {Error} If phone number already exists for this user
 * @example
 * await user.addPhoneNumber({
 *   number: '5551234567',
 *   countryCode: '+1',
 *   label: 'mobile',
 *   isPrimary: true
 * });
 */
User_Schema.methods.addPhoneNumber = function (phoneData: { number: string; countryCode: string; label?: string; isPrimary?: boolean }) {
    const existingPhone = this.phoneNumbers?.find(
        (phone: any) => phone.number === phoneData.number && phone.countryCode === phoneData.countryCode
    );

    if (existingPhone) {
        throw new Error('Phone number already exists');
    }

    this.phoneNumbers = this.phoneNumbers || [];

    // If setting as primary, unset other primary phone numbers
    if (phoneData.isPrimary) {
        this.phoneNumbers.forEach((phone: any) => {
            phone.isPrimary = false;
        });
    }

    this.phoneNumbers.push({
        number: phoneData.number,
        countryCode: phoneData.countryCode,
        label: phoneData.label || 'mobile',
        isPrimary: phoneData.isPrimary || false,
        isVerified: false,
        addedAt: new Date()
    });

    return this.save();
};

/**
 * Marks a phone number as verified and records verification timestamp.
 * 
 * @method verifyPhoneNumber
 * @param {string} number - Phone number to verify
 * @param {string} countryCode - Country code of the phone number
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.verifyPhoneNumber('5551234567', '+1');
 */
User_Schema.methods.verifyPhoneNumber = function (number: string, countryCode: string) {
    const phone = this.phoneNumbers?.find(
        (p: any) => p.number === number && p.countryCode === countryCode
    );
    if (phone) {
        phone.isVerified = true;
        phone.verifiedAt = new Date();
    }
    return this.save();
};

/**
 * Removes a phone number from the user's account.
 * 
 * @method removePhoneNumber
 * @param {string} number - Phone number to remove
 * @param {string} countryCode - Country code of the phone number
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.removePhoneNumber('5551234567', '+1');
 */
User_Schema.methods.removePhoneNumber = function (number: string, countryCode: string) {
    if (this.phoneNumbers) {
        this.phoneNumbers = this.phoneNumbers.filter(
            (phone: any) => !(phone.number === number && phone.countryCode === countryCode)
        );
    }
    return this.save();
};

/**
 * Registers a new WebAuthn passkey (FIDO2) for passwordless authentication.
 * Blocks password managers like 1Password, Bitwarden, etc.
 * Automatically adds 'passkey' to active MFA methods and stores authenticator metadata with icon.
 * 
 * @method addPasskey
 * @param {Object} passkeyData - Passkey credential information
 * @param {string} passkeyData.credentialId - Unique credential identifier from WebAuthn
 * @param {string} passkeyData.publicKey - Public key for credential verification
 * @param {string} [passkeyData.deviceName='Unknown Device'] - Human-readable device name
 * @param {string} [passkeyData.deviceType='platform'] - Device type (platform or cross-platform)
 * @param {string[]} [passkeyData.transports] - Supported transport methods (usb, nfc, ble, internal, hybrid)
 * @param {string} passkeyData.aaguid - Authenticator attestation GUID (REQUIRED)
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @throws {Error} If AAGUID is not provided or authenticator is blocked
 * @example
 * await user.addPasskey({
 *   credentialId: 'base64-encoded-id',
 *   publicKey: 'base64-encoded-public-key',
 *   deviceName: 'Windows Hello',
 *   deviceType: 'platform',
 *   transports: ['internal'],
 *   aaguid: '08987058-cadc-4b81-b6e1-30de50dcbe96'
 * });
 * 
 * @remarks
 * Password managers like 1Password are blocked.
 * Platform authenticators (Windows Hello, Face ID, Touch ID, Samsung Pass) are preferred.
 */
User_Schema.methods.addPasskey = function (passkeyData: {
    credentialId: string;
    publicKey: string;
    deviceName?: string;
    deviceType?: string;
    transports?: string[];
    aaguid: string; // Made required
}) {
    // Validate AAGUID is provided
    if (!passkeyData.aaguid) {
        throw new Error('AAGUID is required for passkey registration');
    }
    
    // Normalize AAGUID to lowercase for comparison
    const normalizedAaguid = passkeyData.aaguid.toLowerCase();
    
    // Check if AAGUID is in blocked list (1Password, Bitwarden, etc.)
    if (ALL_BLOCKED_AAGUIDS.includes(normalizedAaguid)) {
        const metadata = AUTHENTICATOR_DATABASE[normalizedAaguid];
        const authenticatorName = metadata?.name || 'This authenticator';
        throw new Error(`${authenticatorName} is not allowed. Please use platform authenticators like Windows Hello, Face ID, Touch ID, or Samsung Pass instead of password managers.`);
    }
    
    // Get authenticator metadata (name and icon)
    const metadata = AUTHENTICATOR_DATABASE[normalizedAaguid] || { name: 'Unknown Authenticator' };
    
    this.passkeys = this.passkeys || [];

    this.passkeys.push({
        credentialId: passkeyData.credentialId,
        publicKey: passkeyData.publicKey,
        deviceName: passkeyData.deviceName || 'Unknown Device',
        deviceType: passkeyData.deviceType || 'platform',
        transports: passkeyData.transports || [],
        aaguid: normalizedAaguid,
        authenticatorName: metadata.name,
        authenticatorIcon: metadata.icon_dark || metadata.icon_light,
        counter: 0,
        isActive: true,
        createdAt: new Date()
    });

    // Add passkey to active MFA methods
    if (!this.security?.activeMFAMethods?.includes('passkey')) {
        this.security = this.security || { activeMFAMethods: [] };
        this.security.activeMFAMethods = this.security.activeMFAMethods || [];
        this.security.activeMFAMethods.push('passkey');
    }

    return this.save();
};

/**
 * Updates the signature counter for a passkey credential.
 * Used for replay attack prevention as per WebAuthn specification.
 * 
 * @method updatePasskeyCounter
 * @param {string} credentialId - Credential identifier to update
 * @param {number} counter - New counter value (must be greater than previous)
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.updatePasskeyCounter('credential-id', 42);
 * 
 * @see {@link https://www.w3.org/TR/webauthn-2/#signature-counter|WebAuthn Signature Counter}
 */
User_Schema.methods.updatePasskeyCounter = function (credentialId: string, counter: number) {
    const passkey = this.passkeys?.find((p: any) => p.credentialId === credentialId);
    if (passkey) {
        passkey.counter = counter;
        passkey.lastUsedAt = new Date();
    }
    return this.save();
};

/**
 * Removes a passkey credential from the user's account.
 * Automatically removes 'passkey' from active MFA methods if no passkeys remain.
 * 
 * @method removePasskey
 * @param {string} credentialId - Credential identifier to remove
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.removePasskey('credential-id-to-remove');
 */
User_Schema.methods.removePasskey = function (credentialId: string) {
    if (this.passkeys) {
        this.passkeys = this.passkeys.filter(
            (passkey: any) => passkey.credentialId !== credentialId
        );

        // Remove from active MFA methods if no passkeys left
        if (this.passkeys.length === 0 && this.security?.activeMFAMethods) {
            this.security.activeMFAMethods = this.security.activeMFAMethods.filter(
                (method: string) => method !== 'passkey'
            );
        }
    }
    return this.save();
};

/**
 * Registers a new TOTP (Time-based One-Time Password) authenticator app.
 * Automatically enables MFA and adds 'authenticator' to active MFA methods.
 * 
 * @method addAuthenticatorApp
 * @param {Object} appData - Authenticator app configuration
 * @param {string} appData.name - Human-readable name for the authenticator
 * @param {string} appData.secret - Base32-encoded secret key for TOTP generation
 * @param {string} [appData.algorithm='SHA1'] - Hash algorithm (SHA1, SHA256, SHA512)
 * @param {number} [appData.digits=6] - Number of digits in generated code (6 or 8)
 * @param {number} [appData.period=30] - Time step in seconds for code generation
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.addAuthenticatorApp({
 *   name: 'Google Authenticator',
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   algorithm: 'SHA1',
 *   digits: 6,
 *   period: 30
 * });
 * 
 * @see {@link https://tools.ietf.org/html/rfc6238|RFC 6238 - TOTP}
 */
User_Schema.methods.addAuthenticatorApp = function (appData: {
    name: string;
    secret: string;
    algorithm?: string;
    digits?: number;
    period?: number;
}) {
    this.security = this.security || {};
    this.security.authenticatorApps = this.security.authenticatorApps || [];

    this.security.authenticatorApps.push({
        id: v4(),
        name: appData.name,
        secret: appData.secret,
        algorithm: appData.algorithm || 'SHA1',
        digits: appData.digits || 6,
        period: appData.period || 30,
        isActive: true,
        createdAt: new Date()
    });

    // Add authenticator to active MFA methods
    this.security.activeMFAMethods = this.security.activeMFAMethods || [];
    if (!this.security.activeMFAMethods.includes('authenticator')) {
        this.security.activeMFAMethods.push('authenticator');
    }

    this.security.isMFAEnabled = true;

    return this.save();
};

/**
 * Updates the last used timestamp for an authenticator app.
 * Used to track active authenticators and display usage information to users.
 * 
 * @method updateAuthenticatorAppUsage
 * @param {string} appId - Unique identifier of the authenticator app
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.updateAuthenticatorAppUsage('uuid-of-authenticator');
 */
User_Schema.methods.updateAuthenticatorAppUsage = function (appId: string) {
    const app = this.security?.authenticatorApps?.find((a: any) => a.id === appId);
    if (app) {
        app.lastUsedAt = new Date();
    }
    return this.save();
};

/**
 * Removes an authenticator app from the user's account.
 * Automatically manages active MFA methods and disables MFA if no methods remain.
 * 
 * @method removeAuthenticatorApp
 * @param {string} appId - Unique identifier of the authenticator app to remove
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * await user.removeAuthenticatorApp('uuid-of-authenticator');
 * 
 * @remarks
 * - Removes 'authenticator' from active MFA methods if no apps remain
 * - Disables MFA entirely if this was the last authentication method
 */
User_Schema.methods.removeAuthenticatorApp = function (appId: string) {
    if (this.security?.authenticatorApps) {
        this.security.authenticatorApps = this.security.authenticatorApps.filter(
            (app: any) => app.id !== appId
        );

        // Remove from active MFA methods if no apps left
        if (this.security.authenticatorApps.length === 0 && this.security.activeMFAMethods) {
            this.security.activeMFAMethods = this.security.activeMFAMethods.filter(
                (method: string) => method !== 'authenticator'
            );
        }

        // Disable MFA if no methods left
        if (!this.security.activeMFAMethods || this.security.activeMFAMethods.length === 0) {
            this.security.isMFAEnabled = false;
        }
    }
    return this.save();
};

/**
 * Updates the user's password and maintains password history.
 * Stores the new password hash in history and keeps only the last 5 passwords.
 * 
 * @method updatePassword
 * @param {string} newPasswordHash - Bcrypt hash of the new password
 * @returns {Promise<IUser>} Promise resolving to updated user document
 * @example
 * const hashedPassword = await bcrypt.hash(newPassword, 10);
 * await user.updatePassword(hashedPassword);
 * 
 * @remarks
 * - Maintains a rolling history of last 5 password hashes
 * - Use with checkPasswordHistory() to prevent password reuse
 */
User_Schema.methods.updatePassword = function(newPasswordHash: string) {
    // Add current password to history before updating
    if (this.password) {
        this.security = this.security || {};
        this.security.passwordHistory = this.security.passwordHistory || [];
        
        this.security.passwordHistory.push({
            hash: this.password,
            changedAt: new Date()
        });
        
        // Keep only last 5 passwords
        if (this.security.passwordHistory.length > 5) {
            this.security.passwordHistory = this.security.passwordHistory.slice(-5);
        }
    }
    
    // Update password and timestamp
    this.password = newPasswordHash;
    this.security = this.security || {};
    this.security.lastPasswordChange = new Date();
    
    return this.save();
};

/**
 * Checks if a password hash exists in the user's password history.
 * Used to prevent password reuse.
 * 
 * @method checkPasswordHistory
 * @param {string} passwordHash - Bcrypt hash to check against history
 * @returns {boolean} True if password exists in history, false otherwise
 * @example
 * const isOldPassword = user.checkPasswordHistory(hashedPassword);
 * if (isOldPassword) {
 *   throw new Error('Cannot reuse old passwords');
 * }
 */
User_Schema.methods.checkPasswordHistory = function(passwordHash: string): boolean {
    if (!this.security?.passwordHistory?.length) {
        return false;
    }
    
    return this.security.passwordHistory.some(
        (entry: any) => entry.hash === passwordHash
    );
};

/**
 * Static method to check if an authenticator AAGUID is blocked.
 * 
 * @method isAuthenticatorBlocked
 * @static
 * @param {string} aaguid - Authenticator AAGUID to validate
 * @returns {boolean} True if authenticator is blocked (like 1Password, Bitwarden, etc.)
 * @example
 * const isBlocked = User_Schema.statics.isAuthenticatorBlocked(aaguid);
 * if (isBlocked) {
 *   throw new Error('Password managers are not allowed');
 * }
 */
User_Schema.statics.isAuthenticatorBlocked = function(aaguid: string): boolean {
    if (!aaguid) return false;
    return ALL_BLOCKED_AAGUIDS.includes(aaguid.toLowerCase());
};

/**
 * Static method to get authenticator metadata (name and icon) from AAGUID.
 * 
 * @method getAuthenticatorMetadata
 * @static
 * @param {string} aaguid - Authenticator AAGUID
 * @returns {{ name: string; icon_dark?: string; icon_light?: string }} Authenticator metadata
 * @example
 * const metadata = User_Schema.statics.getAuthenticatorMetadata(aaguid);
 * // Returns: { name: 'Windows Hello', icon_dark: 'data:image/...' }
 */
User_Schema.statics.getAuthenticatorMetadata = function(aaguid: string): { name: string; icon_dark?: string; icon_light?: string } {
    if (!aaguid) return { name: 'Unknown Authenticator' };
    
    const normalized = aaguid.toLowerCase();
    const metadata = AUTHENTICATOR_DATABASE[normalized];
    
    return metadata || { name: 'Unknown Authenticator' };
};

/**
 * Static method to get authenticator name from AAGUID.
 * 
 * @method getAuthenticatorName
 * @static
 * @param {string} aaguid - Authenticator AAGUID
 * @returns {string} Human-readable authenticator name
 * @example
 * const name = User_Schema.statics.getAuthenticatorName(aaguid);
 * // Returns: 'Windows Hello' or 'Samsung Pass'
 */
User_Schema.statics.getAuthenticatorName = function(aaguid: string): string {
    if (!aaguid) return 'Unknown Authenticator';
    
    const normalized = aaguid.toLowerCase();
    const metadata = AUTHENTICATOR_DATABASE[normalized];
    
    return metadata?.name || 'Unknown Authenticator';
};

/**
 * Email address interface with verification and categorization support.
 * @interface IEmail
 */
interface IEmail {
    address: string;
    isPrimary: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    addedAt: Date;
    label: "personal" | "work" | "other";
}

/**
 * Phone number interface with international format and verification support.
 * @interface IPhoneNumber
 */
interface IPhoneNumber {
    number: string;
    countryCode: string;
    isPrimary: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    addedAt: Date;
    label: "mobile" | "home" | "work" | "other";
}

/**
 * WebAuthn passkey credential interface for FIDO2 passwordless authentication.
 * @interface IPasskey
 * @see {@link https://www.w3.org/TR/webauthn-2/|WebAuthn Level 2 Specification}
 */
interface IPasskey {
    credentialId: string;
    publicKey: string;
    counter: number;
    deviceName?: string;
    deviceType: "platform" | "cross-platform";
    transports?: ("usb" | "nfc" | "ble" | "internal" | "hybrid")[];
    createdAt: Date;
    lastUsedAt?: Date;
    aaguid: string; // Required - password managers like 1Password are blocked
    authenticatorName?: string; // Human-readable name (e.g., "Windows Hello", "Samsung Pass")
    authenticatorIcon?: string; // Base64 icon data URI for UI display
    isActive: boolean;
}

/**
 * TOTP authenticator app interface for time-based one-time password generation.
 * @interface IAuthenticatorApp
 * @see {@link https://tools.ietf.org/html/rfc6238|RFC 6238 - TOTP}
 */
interface IAuthenticatorApp {
    id: string;
    name: string;
    secret: string;
    algorithm: "SHA1" | "SHA256" | "SHA512";
    digits: 6 | 8;
    period: number;
    isActive: boolean;
    createdAt: Date;
    lastUsedAt?: Date;
}

/**
 * OAuth provider account connection interface.
 * Supports multiple OAuth providers with token management and tracking.
 * @interface IConnectedAccount
 */
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

/**
 * Main user document interface extending Mongoose Document.
 * Provides comprehensive user management with authentication, authorization,
 * and multi-factor security features.
 * 
 * @interface IUser
 * @extends {mongoose.Document}
 */
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
    emails?: IEmail[];
    phoneNumbers?: IPhoneNumber[];
    password?: string;
    passkeys?: IPasskey[];
    connectedAccounts?: IConnectedAccount[];
    isAdmin: boolean;
    isActive: boolean;
    isEmailVerified: boolean;
    isSuspended: boolean;
    security?: {
        isMFAEnabled: boolean;
        mfaSecret?: string;
        authenticatorApps?: IAuthenticatorApp[];
        backupCodes?: Array<{
            code: string;
            used: boolean;
            usedAt?: Date;
        }>;
        lastPasswordChange?: Date;
        passwordHistory?: Array<{
            hash: string;
            changedAt: Date;
        }>;
        loginAttempts: number;
        lockUntil?: Date;
        activeMFAMethods?: ("totp" | "sms" | "email" | "passkey" | "authenticator")[];
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
    addEmail(emailData: { address: string; label?: string; isPrimary?: boolean }): Promise<IUser>;
    verifyEmail(emailAddress: string): Promise<IUser>;
    removeEmail(emailAddress: string): Promise<IUser>;
    addPhoneNumber(phoneData: { number: string; countryCode: string; label?: string; isPrimary?: boolean }): Promise<IUser>;
    verifyPhoneNumber(number: string, countryCode: string): Promise<IUser>;
    removePhoneNumber(number: string, countryCode: string): Promise<IUser>;
    addPasskey(passkeyData: { credentialId: string; publicKey: string; deviceName?: string; deviceType?: string; transports?: string[]; aaguid: string }): Promise<IUser>;
    updatePasskeyCounter(credentialId: string, counter: number): Promise<IUser>;
    removePasskey(credentialId: string): Promise<IUser>;
    addAuthenticatorApp(appData: { name: string; secret: string; algorithm?: string; digits?: number; period?: number }): Promise<IUser>;
    updateAuthenticatorAppUsage(appId: string): Promise<IUser>;
    removeAuthenticatorApp(appId: string): Promise<IUser>;
    updatePassword(newPasswordHash: string): Promise<IUser>;
    checkPasswordHistory(passwordHash: string): boolean;
}

/**
 * User model with static methods for authentication validation.
 * @interface IUserModel
 * @extends {mongoose.Model<IUser>}
 */
interface IUserModel extends mongoose.Model<IUser> {
    isAuthenticatorBlocked(aaguid: string): boolean;
    getAuthenticatorMetadata(aaguid: string): { name: string; icon_dark?: string; icon_light?: string };
    getAuthenticatorName(aaguid: string): string;
}

/**
 * Enhanced user model with comprehensive authentication and security features.
 * Prevents model recompilation during hot-reload in development.
 * 
 * @constant Users_Model
 * @type {IUserModel}
 * @exports Users_Model
 */
export const Users_Model: IUserModel =
    (mongoose.models?.Users as IUserModel) ||
    mongoose.model<IUser, IUserModel>("Users", User_Schema);

export type { IUser, IConnectedAccount, IEmail, IPhoneNumber, IPasskey, IAuthenticatorApp };
export default Users_Model;
