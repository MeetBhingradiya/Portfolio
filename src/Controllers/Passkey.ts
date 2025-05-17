import { NextResponse } from "next/server";
import { Passkeys_Model } from "@Models/Passkeys";
import type { IPasskey } from "@Models/Passkeys";
import dbConnect from "@Utils/dbConnect";
import crypto from 'crypto';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    AuthenticatorTransportFuture,
    AuthenticatorAttachment,
    UserVerificationRequirement,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import PasswordManagers from 'password-managers' with { type: 'json' };
import { Config } from "@/Config";

async function Controller_GET_PasswordManagers() {
    if (Object.keys(PasswordManagers).length === 0) {
        return NextResponse.json({
            Status: 0,
            Message: "No Password Managers Found",
            StatusCode: "NOT_FOUND"
        }, {
            status: 404
        })
    }

    return NextResponse.json({
        Status: 1,
        Message: "Password Managers Found",
        StatusCode: "OK",
        Data: PasswordManagers
    }, {
        status: 200
    })
}

/**
 *  ? Start creating a new passkey by serving registration options.
 */
async function Controller_POST_Register_Passkey_Request() {
    await dbConnect()

    // ? get Authorized User [Temporary] we will fetch from users model
    const User = {
        UserID: "60d4b9e0b6b5c4a6e7c3e4d5",
        plan: "Plus",
        username: "jonedoe",
        name: "John Doe",
    }

    // ? get User's Passkeys Count and Plan Limit 
    // ? User : 1 (Only in Windows with Hello)
    // ? Plus : 2 (Windows Hello, Google Password Manager)
    // ? Premium : Unlimited Authentication Device but Only 1 Passkey still Max 5 Passkeys
    const PasskeyDocuments: IPasskey[] = await Passkeys_Model.find({ UserID: User.UserID })

    const PasskeysCount = PasskeyDocuments.length
    if (User.plan === "User" && PasskeysCount >= 1) {
        return NextResponse.json({
            Status: 0,
            Message: "You have reached the limit of Passkeys",
            StatusCode: "LIMIT_REACHED"
        }, {
            status: 403
        })
    }

    if (User.plan === "Plus" && PasskeysCount >= 2) {
        return NextResponse.json({
            Status: 0,
            Message: "You have reached the limit of Passkeys",
            StatusCode: "LIMIT_REACHED"
        }, {
            status: 403
        })
    }

    if (User.plan === "Premium" && PasskeysCount >= 5) {
        return NextResponse.json({
            Status: 0,
            Message: "You have reached the limit of Passkeys",
            StatusCode: "LIMIT_REACHED"
        }, {
            status: 403
        })
    }

    const excludeCredentials: {
        id: string
        transports?: AuthenticatorTransportFuture[]
    }[] = PasskeyDocuments.map((Passkey) => {
        return {
            id: Passkey.PasskeyID,
            transports: Passkey.Transports
        }
    })

    // ? Create Options
    const authenticatorSelection: {
        authenticatorAttachment?: AuthenticatorAttachment
        requireResidentKey?: boolean
        residentKey?: ResidentKeyRequirement
        userVerification?: UserVerificationRequirement
    } = {
        authenticatorAttachment: 'platform',
        requireResidentKey: true
    }
    const attestationType = 'none'

    const option = await generateRegistrationOptions({
        rpName: Config.Name,

        rpID: `https://${Config.WhiteListedDomains[0]}`,

        // ? Users Data
        userName: User.username,
        userDisplayName: User.name,
        userID: isoBase64URL.toBuffer(User.UserID),

        attestationType,

        excludeCredentials,
        authenticatorSelection,

        // ? 30 Seconds Timeout
        timeout: 30 * 1000
    })

    // ? Save Challenge to Database
    const PasskeyID = crypto.randomBytes(16).toString('hex')
    const Challenge = option.challenge

    await Passkeys_Model.create({
        PasskeyID,
        UserID: User.UserID,
        Challenge
    })

    return NextResponse.json({
        Status: 1,
        Message: "Passkey Registration Started",
        StatusCode: "OK",
        Data: option
    }, {
        status: 200
    })
}

/**
 * ? Register a new passkey to the server.
 */
async function Controller_POST_Register_Passkey_Response() { }

/**
 * ? Start authenticating a passkey by serving authentication options.
 */
async function Controller_POST_Authenticate_Passkey_Request() { }

/**
 * ? Authenticate a passkey to the server & provide account access to the user if authenticated.
 */
async function Controller_POST_Authenticate_Passkey_Response() { }

export {
    Controller_GET_PasswordManagers,
    Controller_POST_Register_Passkey_Request,
    Controller_POST_Register_Passkey_Response,
    Controller_POST_Authenticate_Passkey_Request,
    Controller_POST_Authenticate_Passkey_Response
}