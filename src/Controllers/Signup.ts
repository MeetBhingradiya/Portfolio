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

async function is_username_already_exists(username: string): Promise<boolean> {
    const doc = await Users_Model.findOne({
        Username: username
    });
    return doc ? true : false;
}

async function Signup() { }

export {
    is_email_already_exists,
    is_email_Verified,
    is_username_created,
    is_username_already_exists,
}