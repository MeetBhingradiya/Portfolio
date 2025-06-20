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

async function Signup() {}

export {
    is_email_already_exists,
    is_email_Verified,
    is_username_created,
    is_username_already_exists
};
