/**
 *  @FileID          app/api/(auth)/signup/route.ts
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
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
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
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:03 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { Users_Model, IUser } from "@Models/Users";
// import { OTPs_Model, IOTP, OTPs } from "@Models/OneTimePass";
// import { Sessions_Model, ISessions } from "@Models/Sessions";
import { useEmptyFields } from "@Hooks/useEmptyFields";
import { Config } from "@Config";

export async function POST(req: NextRequest) {

    const rawBody = await req.json();
    const Body = {
        email: String(rawBody.email || ''),
        password: String(rawBody.password || ''),
        username: String(rawBody.username || ''),
        firstname: String(rawBody.firstname || ''),
        lastname: String(rawBody.lastname || ''),
        dateofbirth: String(rawBody.dateofbirth || ''),
        gender: String(rawBody.gender || '')
    };

    // ? Check if required fields are missing
    if (useEmptyFields({
        ReqiuredFields: [
            "email",
            "password",
            "firstname",
            "lastname",
            "gender",
            "dateofbirth",
        ],
        targetObject: Body
    }).isMising) {
        return NextResponse.json({
            Status: 0,
            Message: 'Missing required fields',
            StatusCode: 400
        }, { status: 400 });
    }

    // ^ TODO:  Validations
    // ? Email Regex & Domain Whitelist on State Collection
    // ? Email on Users Collection
    // ? Password Decrypt & Validate (Length, Special Characters, Uppercase, Lowercase, Digits)
    // ? Username Regex & Users Collection
    // ? Minimum Age Check on State Collection

    // ? Check if email is already registered or same username not exists
    const FindUser = await Users_Model.find({ 
        email: Body.email,
    });

    if (FindUser.length > 0) {
        return NextResponse.json({
            Status: 0,
            Message: 'Email or Username already exists',
            StatusCode: 400
        }, { status: 400 });
    }

    // ? Create new user
    await Users_Model.create({
        Emails: [
            {
                Email: Body.email,
                isPrimary: true,
                isVerified: false
            }
        ],
        // ? TODO: Encrypt Password not Hash
        Username: Config.DatabaseBydefualt.SignupUsername,
        firstname: Body.firstname,
        lastname: Body.lastname,
        DateOfBirth: Body.dateofbirth,
    });

    // ? Return Response
    return NextResponse.json({
        Status: 1,
        Message: 'User created successfully',
        StatusCode: 200
    }, { status: 200 });
}