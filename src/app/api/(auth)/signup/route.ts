import { NextRequest, NextResponse } from "next/server";
import { Users_Model, IUser } from "@Models/Users";
import { VerificationCodes_Model, IVerificationCodes } from "@Models/VerificationCodes";
// import { Sessions_Model, ISessions } from "@Models/Sessions";
import { useEmptyFields } from "@Hooks/useEmptyFields";

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