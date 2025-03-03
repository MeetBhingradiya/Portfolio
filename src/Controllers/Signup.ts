/**
 *  @FileID          Controllers\Signup.ts
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


import { NextResponse } from "next/server";
import { Users_Model } from "@Models/Users";
import { Config } from "@Config";

/**
 * Checks if the specified email exists in the database.
 *
 * The function searches the user collection for any document with an `Emails` array containing
 * the provided email. It returns true if a matching document is found, and false otherwise.
 *
 * @param email - The email address to check for existence.
 * @returns True if the email exists in the database; false otherwise.
 */
async function is_email_already_exists(email: string): Promise<boolean> {
    const doc = await Users_Model.findOne({
        Emails: {
            $elemMatch: {
                Email: email
            }
        }
    });
    return doc ? true : false;
}

/**
 * Checks if the specified email address is verified.
 *
 * This function queries the user database for a document that includes the provided email with 
 * its verification flag set. It returns true if such a document is found, indicating that the email 
 * has been verified, and false otherwise.
 *
 * @param email - The email address to check.
 * @returns A promise that resolves to true if the email is verified; otherwise, false.
 */
async function is_email_Verified(email: string): Promise<boolean> {
    const doc = await Users_Model.findOne({
        Emails: {
            $elemMatch: {
                Email: email,
                isVerified: true
            }
        }
    });
    return doc ? true : false;
}

/**
 * Determines whether a user with the given email has set a custom username.
 *
 * This function queries the database for a record containing the provided email and a username that is equal to the default signup username defined in the configuration. If such a record is found, it indicates that the user has not changed the default username, and the function returns false. If no such record exists, it returns true, suggesting that a custom username has been created.
 *
 * @param email - The email address of the user to check for a custom username.
 * @returns True if the user has set a custom username; otherwise, false.
 */
async function is_username_created(email: string): Promise<boolean> {
    const doc = await Users_Model.findOne({ 
        Emails: {
            $elemMatch: {
                Email: email
            }
        },
        Username: Config.DatabaseBydefualt.SignupUsername
    });

    return doc ? false : true;
}

/**
 * Checks if the specified username already exists in the database.
 *
 * This function queries the Users_Model for any document that has the provided username.
 * It returns a promise that resolves to true if a matching record is found, and false otherwise.
 *
 * @param username - The username to check.
 * @returns A promise that resolves to true if the username exists, false otherwise.
 */
async function is_username_already_exists(username: string): Promise<boolean> {
    const doc = await Users_Model.findOne({
        Username: username
    });
    return doc ? true : false;
}

/**
 * Initiates the user signup process.
 *
 * This asynchronous function is a placeholder for the signup workflow. In the future, it is expected to handle tasks such as validating user input, creating user records, and triggering email verification.
 *
 * @todo Implement the signup logic.
 */
async function Signup() { }

export {
    is_email_already_exists,
    is_email_Verified,
    is_username_created,
    is_username_already_exists,
}