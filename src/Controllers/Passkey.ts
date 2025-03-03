/**
 *  @FileID          Controllers\Passkey.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


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
    UserVerificationRequirement
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import PasswordManagers from 'password-managers' with { type: 'json' };
import { Config } from "@/Config";

/**
 * Retrieves available password managers.
 *
 * Checks if any password managers exist by examining the keys of the collection. If no password managers
 * are found, the function returns a JSON response with a 404 status and an appropriate message. Otherwise,
 * it returns a JSON response with the password managers data and a 200 status.
 *
 * @returns A promise that resolves to a JSON response with either the password managers data (HTTP 200) or
 * a not found message (HTTP 404).
 */
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
 * Initiates passkey registration by generating registration options for a new passkey.
 *
 * This function performs the following steps:
 * - Connects to the database.
 * - Retrieves a predefined authorized user and fetches their existing passkeys from the database.
 * - Checks the user's current passkey count against the limits defined for their subscription plan:
 *   - "User": Maximum of 1 passkey.
 *   - "Plus": Maximum of 2 passkeys.
 *   - "Premium": Maximum of 5 passkeys.
 * - If the passkey limit is reached, returns a JSON response with a 403 status and an appropriate error message.
 * - Otherwise, generates passkey registration options using configuration data and user details.
 * - Saves the generated challenge and a new passkey identifier to the database.
 * - Returns a JSON response with a 200 status containing the registration options.
 *
 * @returns A JSON response indicating either that the passkey registration has started with the generated registration options,
 *          or an error message if the user's passkey limit has been reached.
 *
 * @example
 * Controller_POST_Register_Passkey_Request()
 *   .then(response => response.json())
 *   .then(data => console.log(data));
 */
async function Controller_POST_Register_Passkey_Request() {
    await dbConnect()

    // ? get Authorized User
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

        // ? Modify this if Domain got Expired
        rpID: `https://${Config.WhiteListedDomains[1]}`,

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
 * Processes the client response for passkey registration.
 *
 * This controller function is intended to finalize the passkey registration process by handling
 * the attestation data returned from the client. When fully implemented, it will validate the response,
 * verify the attestation, and complete the linking of the new passkey with the user's account.
 *
 * @remarks
 * This function is currently a placeholder and is not yet implemented.
 */
async function Controller_POST_Register_Passkey_Response() { }

/**
 * Initiates the passkey authentication process by providing the client with authentication options.
 *
 * This asynchronous controller function is intended to generate and serve the necessary options to complete
 * passkey authentication. The complete implementation should handle input validation, challenge generation,
 * and respond with the appropriate HTTP status and authentication options.
 *
 * @remarks
 * This function is currently a placeholder awaiting further implementation.
 */
async function Controller_POST_Authenticate_Passkey_Request() { }

/**
 * Authenticates a passkey response and grants account access.
 *
 * This asynchronous function processes the authentication response provided by the client,
 * validates the passkey credentials, and authorizes the corresponding user account if the
 * authentication is successful.
 */
async function Controller_POST_Authenticate_Passkey_Response() { }

export {
    Controller_GET_PasswordManagers,
    Controller_POST_Register_Passkey_Request,
    Controller_POST_Register_Passkey_Response,
    Controller_POST_Authenticate_Passkey_Request,
    Controller_POST_Authenticate_Passkey_Response
}