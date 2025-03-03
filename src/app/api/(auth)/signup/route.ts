/**
 *  @FileID          app\api\(auth)\signup\route.ts
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


import { NextRequest, NextResponse } from "next/server";
import { Users_Model, IUser } from "@Models/Users";
// import { OTPs_Model, IOTP, OTPs } from "@Models/OneTimePass";
// import { Sessions_Model, ISessions } from "@Models/Sessions";
import { useEmptyFields } from "@Hooks/useEmptyFields";

/**
 * Processes a POST request for user signup.
 *
 * This function extracts user registration data from the request body and validates that all required fields
 * (email, password, username, firstname, lastname, gender, and dateofbirth) are present. It then checks whether
 * a user with the provided email or username already exists. If validation fails or a duplicate is found, it returns
 * a JSON response with a 400 status code and an appropriate error message. If the data is valid and unique, it creates 
 * a new user record and responds with a success message and a 200 status code.
 */
export async function POST(req: NextRequest) {

    const Body: {
        email: string,
        password: string,
        username: string,
        firstname: string,
        lastname: string,
        dateofbirth: string,
    } = req.body as any;

    // ? Check if required fields are missing
    if (useEmptyFields({
        ReqiuredFields: [
            "email",
            "password",
            "username",
            "firstname",
            "lastname",
            "gender",
            "dateofbirth",
        ],
        Object: Body
    }).isMising) {
        return NextResponse.json({
            Status: 0,
            Message: 'Missing required fields',
            StatusCode: 400
        }, { status: 400 });
    }

    // ? Check if email is already registered or same username not exists
    const FindUser = await Users_Model.find({ 
        $or: [
            { email: Body.email },
            { username: Body.username }
        ]
    });

    if (FindUser) {
        return NextResponse.json({
            Status: 0,
            Message: 'Email or Username already exists',
            StatusCode: 400
        }, { status: 400 });
    }

    // ? Create new user
    await Users_Model.create({
        email: Body.email,
        // ? TODO: Encrypt Password not Hash
        password: Body.password,
        username: Body.username,
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