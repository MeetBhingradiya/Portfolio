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
    }).isMissing) {
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
            Message: 'Account already exists with this email',
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

    // ? Generate OTP for Email Verification
    // ? Create Session and RSA Key Pairs

    // ? Return Response
    return NextResponse.json({
        Status: 1,
        Message: 'User created successfully',
        StatusCode: 200
    }, { status: 200 });
}